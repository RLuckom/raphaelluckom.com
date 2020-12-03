const _ = require('lodash')
const urlTemplate = require('url-template')
const {formatters, siteDescriptionDependency } = require('./helpers')

module.exports = {
  cleanup: {
    transformers: {
      state: {ref: 'determineUpdates.vars.updates.neighbors' }
    }
  },
  stages: {
    siteDescription: {
      index: 0,
      dependencies: {
        siteDescription: siteDescriptionDependency('${domain_name}', '${site_description_path}')
      },
    },
    updateDependencies: {
      index: 1,
      transformers: {
        trails: {
          helper: 'expandUrlTemplateWithNames',
          params: {
            templateString: {ref: 'siteDescription.results.siteDescription.${self_type}.setTemplate'},
            siteDetails: {ref: 'siteDescription.results.siteDescription.siteDetails'},
            names: {ref: 'event.trailNames'},
          }
        },
        existingMemberships: {
          helper: 'expandUrlTemplateWithNames',
          params: {
            templateString: {ref: 'siteDescription.results.siteDescription.${self_type}.setTemplate'},
            siteDetails: {ref: 'siteDescription.results.siteDescription.siteDetails'},
            name: {ref: 'event.item.name'},
          }
        },
      },
      dependencies: {
        trails: {
          action: 'genericApi',
          formatter: formatters.singleValue.unwrapJsonHttpResponseArray,
          params: {
            url: { ref: 'stage.trails' }
          }
        },
        existingMemberships: {
          action: 'genericApi',
          formatter: formatters.singleValue.unwrapFunctionPayload,
          params: {
            url: { ref: 'stage.existingMemberships'}
          }
        }
      },
    },
    parseLists: {
      transformers: {
        trails: { 
          helper: 'transform',
          params: {
            arg: {
              all: {
                trailArrays: {ref: 'updateDependencies.results.trails' },
                trailUrls: {ref: 'updateDependencies.vars.trails' },
                trailNames: {ref: 'event.trailNames'},
              }
            },
            func: {value: ({trailUrls, trailNames, trailArrays}) => {
              return _.reduce(trailUrls, (a, trailUrl, index) => {
                a[trailUrl] = {
                  members: _.sortBy(trailArrays[index], ['metadata', 'date']),
                  trailName: trailNames[index]
                }
                return a
              }, {})
            } }
          }
        },
      }
    },
    determineUpdates: {
      transformers: {
        updates: {
          helper: 'transform',
          params: {
            arg: {
              all: {
                trails: { ref: 'parseLists.vars.trails' },
                trailNames: {ref: 'event.trailNames'},
                existingMemberships: { ref: 'updateDependencies.results.existingMemberships' },
                siteDescription: { ref: 'siteDescription.results.siteDescription' }, 
                item: { ref: 'event.item' },
              }
            },
            //TODO: extract && test this
            func: { value: ({trails, existingMemberships, siteDescription, item, trailNames}) => {
              const updates = {
                neighborsToReRender: [],
                trailsToReRender: [],
                dynamoPuts: [],
                dynamoDeletes: [],
                neighbors: {}
              }
              const trailUriTemplate = urlTemplate.parse(_.get(siteDescription, '${self_type}.setTemplate'))
              const trailsListName = 'trails'
              const trailsListId = trailUriTemplate.expand({...siteDescription.siteDetails, ...{name: encodeURIComponent(trailsListName)}})
              _.each(existingMemberships, (trail) => {
                if (!_.find(trailNames, (name) => name === trail.trailName)) {
                  updates.dynamoDeletes.push({
                    memberName: item.name,
                    trailName: trail.trailName
                  })
                }
              })
              _.each(trails, ({members, trailName}, trailUri) => {
                const newList = _.cloneDeep(members)
                const currentIndex = _.findIndex(members, (member) => {
                  return member.memberUri === item.id && _.isEqual(member.memberMetadata, item.metadata)
                })
                const previousIndex = _.findIndex(members, (member) => member.memberUri === item.id)
                if (members.length === 0) {
                  updates.dynamoPuts.push({
                    trailUri: trailsListId,
                    trailName: trailsListName,
                    memberUri: trailUri,
                    memberName: trailName,
                    memberType: 'trail',
                    memberMetadata: {
                      date: new Date().toISOString(),
                    }
                  })
                  updates.trailsToReRender.push(trailsListId)
                  updates.trailsToReRender.push(trailUri)
                }
                if (currentIndex === -1) {
                  const trailMember = {
                    trailUri: trailUri,
                    trailName,
                    memberUri: item.id,
                    memberName: item.name,
                    memberType: item.itemType,
                    memberMetadata: item.metadata
                  }
                  newList.push(trailMember)
                  updates.dynamoPuts.push(trailMember)
                  const newIndex = _(newList).sortBy(['memberMetadata', 'date']).findIndex((i) => i.memberUri === item.id && _.isEqual(i.memberMetadata, item.metadata))
                  if (previousIndex !== -1 && newIndex !== previousIndex) {
                    updates.neighborsToReRender.push(members[previousIndex + 1])
                    updates.neighborsToReRender.push(members[previousIndex - 1])
                    newList.splice(previousIndex, 1)
                  }
                  updates.neighborsToReRender.push(newList[newIndex + 1])
                  updates.neighborsToReRender.push(newList[newIndex - 1])
                  updates.neighbors[trailName] = {
                    trailName,
                    previousNeighbor: newList[newIndex - 1] || null,
                    nextNeighbor: newList[newIndex + 1] || null,
                  }
                } else {
                  updates.neighbors[trailUri] = {
                    trailName,
                    previousNeighbor: newList[currentIndex - 1] || null,
                    nextNeighbor: newList[currentIndex + 1] || null,
                  }
                }
              })
              updates.trailsToReRender = _.uniq(updates.trailsToReRender)
              updates.neighborsToReRender = _(updates.neighborsToReRender).uniq().filter().value()
              updates.dynamoPuts = _(updates.dynamoPuts).uniq().filter().value()
              updates.dynamoDeletes = _(updates.dynamoDeletes).uniq().filter().value()
              updates.trailsListName = trailsListName
              return updates
            } }
          }
        }
      },
      dependencies: {
        trailsWithDeletedMembers: {
          action: 'genericApi',
          params: {
            url: {
              helper: 'transform',
              params: {
                arg: {
                  all: {
                    deletes: { ref: 'stage.updates.dynamoDeletes'},
                    siteDescription: { ref: 'siteDescription.results.siteDescription' }, 
                  }
                },
                func: ({deletes, siteDescription}) => {
                  const trailUriTemplate = urlTemplate.parse(_.get(siteDescription, '${self_type}.setTemplate'))
                  return _.map(deletes, ({trailName}) => {
                    return trailUriTemplate.expand({...siteDescription.siteDetails, ...{name: encodeURIComponent(trailName)}})
                  })
                }
              }
            }
          }
        }
      }
    },
    checkForEmptyLists: {
      transformers: {
        allUpdates: {
          helper: 'transform',
          params: {
            arg: {
              all: {
                plannedUpdates: { ref: 'determineUpdates.vars.updates' },
                trailsWithDeletedMembers: {ref: 'determineUpdates.results.trailsWithDeletedMembers' }
              }
            },
            func: {
              value: ({trailsWithDeletedMembers, plannedUpdates}) => {
                const {trailsToReRender, neighborsToReRender, dynamoPuts, dynamoDeletes, trailsListName} = plannedUpdates
                const additionalDeletes = []
                _.each(trailsWithDeletedMembers, ({body}, i) => {
                  if (JSON.parse(body).length < 2) {
                    additionalDeletes.push({
                      memberName: dynamoDeletes[i].trailName,
                      trailName: trailsListName
                    })
                  }
                })
                return {
                  trailsToReRender,
                  neighborsToReRender,
                  dynamoPuts,
                  dynamoDeletes: _.concat(dynamoDeletes, additionalDeletes)
                }
              }
            }
          }
        }
      },
      dependencies: {
        dynamoPuts: {
          action: 'exploranda',
          condition: { ref: 'stage.allUpdates.dynamoPuts.length' },
          params: {
            accessSchema: {value: 'dataSources.AWS.dynamodb.putItem'},
            params: {
              explorandaParams: {
                apiConfig: {value: {region: 'us-east-1'}},
                TableName: '${table}',
                Item: { ref: 'stage.allUpdates.dynamoPuts' }
              }
            }
          }
        },
        dynamorDeletes: {
          action: 'exploranda',
          condition: { ref: 'stage.allUpdates.dynamoDeletes.length' },
          params: {
            accessSchema: {value: 'dataSources.AWS.dynamodb.deleteItem'},
            params: {
              explorandaParams: {
                apiConfig: {value: {region: 'us-east-1'}},
                TableName: '${table}',
                Key: { ref: 'stage.allUpdates.dynamoDeletes' }
              }
            }
          }
        }
      },
    },
  }
}
