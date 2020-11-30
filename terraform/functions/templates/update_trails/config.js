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
      transformers: {
        item: {
          helper: 'fromJson',
          params: { string: { ref: 'event.item' }},
        },
      },
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
      transformers: {
        trails: {
          helper: 'transform',
          params: {
            arg: {
              all: {
                tagNames: {ref: 'sources.vars.item.tagNames'},
                siteDescription: { ref: 'sources.results.siteDescription[0].body' }, 
              }
            },
            func: {
              value: ({tagNames, siteDescription}) => {
                const template = urlTemplate.parse(_.get(siteDescription, '${self_type}.idTemplate'))
                return _.map(tagNames, (v, k) => {
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
                itemId: {ref: 'sources.vars.item.id'},
                siteDescription: { ref: 'sources.results.siteDescription[0].body' }, 
              }
            },
            func: {
              value: ({itemId, siteDescription}) => {
                const membershipTemplate = urlTemplate.parse(_.get(siteDescription, '${self_type}.memberTemplate'))
                return membershipTemplate.expand({...siteDescription.siteDetails, ...{name: encodeURIComponent(itemId)}})
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
                trailNames: {ref: 'sources.vars.item.tagNames'},
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
                trailNames: {ref: 'updateDependencies.vars.trails' },
                existingMemberships: { ref: 'parseLists.vars.existingMemberships' },
                siteDescription: { ref: 'sources.results.siteDescription[0].body' }, 
                item: { ref: 'sources.vars.item' },
              }
            },
            //TODO: extract && test this
            // TODO: create neighbord data structure using newLists
            func: { value: ({trails, existingMemberships, siteDescription, item, trailNames}) => {
              const updates = {
                neighborsToReRender: [],
                trailsToReRender: [],
                dynamoPuts: [],
                dynamoDeletes: [],
                neighbors: {}
              }
              const trailIdTemplate = urlTemplate.parse(_.get(siteDescription, '${self_type}.idTemplate'))
              const trailsListName = 'trails'
              const trailsListId = trailIdTemplate.expand({...siteDescription.siteDetails, ...{name: encodeURIComponent(trailsListName)}})
              _.each(existingMemberships, (trail) => {
                if (!_.find(trailNames, (i) => i === trail.trailId)) {
                  updates.dynamoDeletes.push({
                    memberId: item.id,
                    trailId: trail.trailId
                  })
                }
              })
              _.each(trails, ({members, trailName}, trailId) => {
                const newList = _.cloneDeep(members)
                const currentPosition = _.findIndex(members, (member) => {
                  return menber.memberId === item.id && _.isEqual(member.memberMetadata, item.metadata)
                })
                const previousIndex = _.findIndex(members, (member) => member.memberId === item.id)
                if (members.length === 0) {
                  updates.dynamoPuts.push({
                    trailId: trailsListId,
                    trailName: trailsListName,
                    memberId: trailId,
                    memberName: trailName,
                    memberType: 'trail',
                    memberMetadata: {
                      date: new Date().toISOString(),
                    }
                  })
                  updates.trailsToReRender.push(trailsListId)
                  updates.trailsToReRender.push(trailId)
                }
                if (currentPosition === -1) {
                  if (previousIndex !== -1) {
                    updates.neighborsToReRender.push(members[previousIndex + 1])
                    updates.neighborsToReRender.push(members[previousIndex - 1])
                    newList.splice(previousIndex, 1)
                  }
                  const trailMember = {
                    trailId: trailId,
                    trailName,
                    memberId: item.id,
                    memberName: item.name,
                    memberType: item.itemType,
                    memberMetadata: item.metadata
                  }
                  newList.push(trailMember)
                  updates.dynamoPuts.push(trailMember)
                  const newIndex = _(newList).sortBy(['memberMetadata', 'date']).findIndex((i) => i.memberId === item.id && _.isEqual(i.memberMetadata, item.metadata))
                  updates.neighborsToReRender.push(newList[newIndex + 1])
                  updates.neighborsToReRender.push(newList[newIndex - 1])
                  updates.neighbors[trailId] = {
                    trailName,
                    previousNeighbor: newList[newIndex - 1] || null,
                    nextNeighbor: newList[newIndex - 1] || null,
                  }
                }
              })
              updates.trailsToReRender = _.uniq(updates.trailsToReRender)
              updates.neighborsToReRender = _(updates.neighborsToReRender).uniq().filter().value()
              updates.dynamoPuts = _(updates.dynamoPuts).uniq().filter().value()
              updates.dynamoDeletes = _(updates.dynamoDeletes).uniq().filter().value()
              updates.trailsListId = trailsListId
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
                arg: { ref: 'stage.updates.dynamoDeletes'},
                func: (deletes) => {
                  console.log(deletes)
                  console.log( _.map(deletes, 'trailId'))
                  return _.map(deletes, 'trailId')
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
                const {trailsToReRender, neighborsToReRender, dynamoPuts, dynamoDeletes, trailsListId} = plannedUpdates
                const additionalDeletes = []
                _.each(trailsWithDeletedMembers, ({body}, i) => {
                  if (JSON.parse(body).length < 2) {
                    additionalDeletes.push({
                      memberId: dynamoDeletes[i].trailId,
                      trailId: trailsListId
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
      }
    },
    foo: { bar: {
      dependencies: {
        get: {
          action: 'exploranda',
          params: {
            accessSchema: {value: 'dataSources.AWS.dynamodb.query'},
            params: {
              explorandaParams: {
                apiConfig: {value: {region: 'us-east-1'}},
                TableName: '${table}',
                IndexName: '${reverse_association_index}',
                ExpressionAttributeValues: {
                  all: {
                    ':item': {ref: 'stage.item'}
                  }
                },
                KeyConditionExpression: 'dependent = :item'
              }
            },
          }
        },
        update: {
          action: 'exploranda',
          params: {
            accessSchema: {value: 'dataSources.AWS.dynamodb.putItem'},
            params: {
              explorandaParams: {
                apiConfig: {value: {region: 'us-east-1'}},
                TableName: '${table}',
                Item: {
                  helper: 'transform',
                  params: {
                    arg: {ref: 'stage.item'},
                    func: {
                      value: ({item, memberOf}) => _.isArray(memberOf) ? _.map(memberOf, (depended) => {
                        return {
                          dependent: item,
                          depended
                        }
                      }) : { dependent: item, depended: JSON.stringify(memberOf) }
                    }
                  }
                }
              }
            },
          }
        },
      },
      deleteOldDependencies: {
        index: 1,
        transformers: {
          recordsToDelete: {
            helper: 'transform',
            params: {
              arg: {
                all: {
                  memberOf: {ref: 'getAndUpdateDependencies.vars.memberOf' },
                  existingRecords: { ref: 'getAndUpdateDependencies.results.get' }
                }
              },
              func: {
                value: ({memberOf, existingRecords}) => {
                  const keys = _.filter(existingRecords, (itm) => {
                    if (_.isString(memberOf)) {
                      return itm.depended !== memberOf
                    }
                    return memberOf.indexOf(itm.depended) === -1
                  })
                  return keys
                }
              }
            }
          }
        },
        dependencies: {
          delete: {
            condition: { ref: 'stage.recordsToDelete.length' },
            action: 'exploranda',
            params: {
              accessSchema: {value: 'dataSources.AWS.dynamodb.deleteItem'},
              params: {
                explorandaParams: {
                  apiConfig: {value: {region: 'us-east-1'}},
                  TableName: '${table}',
                  Key: {ref : 'stage.recordsToDelete'}
                },
              }
            },
          },
        },
      },
    }
    }
  }
}
