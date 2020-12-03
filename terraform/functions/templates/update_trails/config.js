const _ = require('lodash')
const urlTemplate = require('url-template')

module.exports = {
  cleanup: {
    transformers: {
      state: {ref: 'determineUpdates.vars.updates.neighbors' }
    }
  },
  stages: {
    sources: {
      index: 0,
      dependencies: {
        siteDescription: {
          action: 'genericApi',
          params: {
            apiConfig: {
              value: {
                host: '${domain_name}',
                path: '${site_description_path}',
              }
            },
          },
        },
      },
    },
    updateDependencies: {
      index: 1,
      transformers: {
        trails: {
          helper: 'transform',
          params: {
            arg: {
              all: {
                trailNames: {ref: 'event.trailNames'},
                siteDescription: { ref: 'sources.results.siteDescription[0].body' }, 
              }
            },
            func: {
              value: ({trailNames, siteDescription}) => {
                const template = urlTemplate.parse(_.get(siteDescription, '${self_type}.setTemplate'))
                return _.map(trailNames, (v, k) => {
                  return template.expand({...siteDescription.siteDetails, ...{name: encodeURIComponent(v)}})
                })
              }
            }
          }
        },
        existingMemberships: {
          helper: 'transform',
          params: {
            arg: {
              all: {
                itemName: {ref: 'event.item.name'},
                siteDescription: { ref: 'sources.results.siteDescription[0].body' }, 
              }
            },
            func: {
              value: ({itemName, siteDescription}) => {
                const membershipTemplate = urlTemplate.parse(_.get(siteDescription, '${self_type}.setTemplate'))
                return membershipTemplate.expand({...siteDescription.siteDetails, ...{name: encodeURIComponent(itemName)}})
              }
            }
          }
        },
      },
      dependencies: {
        trails: {
          action: 'genericApi',
          params: {
            url: { ref: 'stage.trails' }
          }
        },
        existingMemberships: {
          action: 'genericApi',
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
                response: {ref: 'updateDependencies.results.trails' },
                trails: {ref: 'updateDependencies.vars.trails' },
                trailNames: {ref: 'event.trailNames'},
              }
            },
            func: {value: ({trails, trailNames, response}) => {
              return _.reduce(trails, (a, v, k) => {
                a[v] = {
                  members: _.sortBy(JSON.parse(response[k].body), ['metadata', 'date']),
                  trailName: trailNames[k]
                }
                return a
              }, {})
            } }
          }
        },
        existingMemberships: {
          helper: 'fromJson',
          params: {
            string: {ref: 'updateDependencies.results.existingMemberships[0].body'}
          }
        }
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
                existingMemberships: { ref: 'parseLists.vars.existingMemberships' },
                siteDescription: { ref: 'sources.results.siteDescription[0].body' }, 
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
                    siteDescription: { ref: 'sources.results.siteDescription[0].body' }, 
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
        dynamodeletes: {
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
