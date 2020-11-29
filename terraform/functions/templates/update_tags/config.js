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
        lists: {
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
        lists: {
          action: 'genericApi',
          params: {
            url: { ref: 'stage.lists' }
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
        lists: { 
          helper: 'transform',
          params: {
            arg: { 
              all: {
                response: {ref: 'updateDependencies.results.lists' },
                lists: {ref: 'updateDependencies.vars.lists' },
                listNames: {ref: 'sources.vars.item.tagNames'},
              }
            },
            func: {value: ({lists, listNames, response}) => {
              return _.reduce(lists, (a, v, k) => {
                a[v] = {
                  members: _.sortBy(JSON.parse(response[k].body), ['metadata', 'date']),
                  listName: listNames[k]
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
                lists: { ref: 'parseLists.vars.lists' },
                listNames: {ref: 'updateDependencies.vars.lists' },
                existingMemberships: { ref: 'parseLists.vars.existingMemberships' },
                siteDescription: { ref: 'sources.results.siteDescription[0].body' }, 
                item: { ref: 'sources.vars.item' },
              }
            },
            //TODO: extract && test this
            // TODO: create neighbord data structure using newLists
            func: { value: ({lists, existingMemberships, siteDescription, item, listNames}) => {
              const updates = {
                neighborsToReRender: [],
                listsToReRender: [],
                dynamoPuts: [],
                dynamoDeletes: [],
                neighbors: {}
              }
              const listIdTemplate = urlTemplate.parse(_.get(siteDescription, '${self_type}.idTemplate'))
              const listsListName = 'lists'
              const listsListId = listIdTemplate.expand({...siteDescription.siteDetails, ...{name: encodeURIComponent(listsListName)}})
              _.each(existingMemberships, (list) => {
                if (!_.find(listNames, (i) => i === list.listId)) {
                  updates.dynamoDeletes.push({
                    memberId: item.id,
                    listId: list.listId
                  })
                }
              })
              _.each(lists, ({members, listName}, listId) => {
                const newList = _.cloneDeep(members)
                const currentPosition = _.findIndex(members, (member) => {
                  return menber.memberId === item.id && _.isEqual(member.memberMetadata, item.metadata)
                })
                const previousIndex = _.findIndex(members, (member) => member.memberId === item.id)
                if (members.length === 0) {
                  updates.dynamoPuts.push({
                    listId: listsListId,
                    listName: listsListName,
                    memberId: listId,
                    memberName: listName,
                    memberType: 'list',
                    memberMetadata: {
                      date: new Date().toISOString(),
                    }
                  })
                  updates.listsToReRender.push(listsListId)
                  updates.listsToReRender.push(listId)
                }
                if (currentPosition === -1) {
                  if (previousIndex !== -1) {
                    updates.neighborsToReRender.push(members[previousIndex + 1])
                    updates.neighborsToReRender.push(members[previousIndex - 1])
                    newList.splice(previousIndex, 1)
                  }
                  const listMember = {
                    listId: listId,
                    listName,
                    memberId: item.id,
                    memberName: item.name,
                    memberType: item.itemType,
                    memberMetadata: item.metadata
                  }
                  newList.push(listMember)
                  updates.dynamoPuts.push(listMember)
                  const newIndex = _(newList).sortBy(['memberMetadata', 'date']).findIndex((i) => i.memberId === item.id && _.isEqual(i.memberMetadata, item.metadata))
                  updates.neighborsToReRender.push(newList[newIndex + 1])
                  updates.neighborsToReRender.push(newList[newIndex - 1])
                  updates.neighbors[listId] = {
                    listName,
                    previousNeighbor: newList[newIndex - 1] || null,
                    nextNeighbor: newList[newIndex - 1] || null,
                  }
                }
              })
              updates.listsToReRender = _.uniq(updates.listsToReRender)
              updates.neighborsToReRender = _(updates.neighborsToReRender).uniq().filter().value()
              updates.dynamoPuts = _(updates.dynamoPuts).uniq().filter().value()
              updates.dynamoDeletes = _(updates.dynamoDeletes).uniq().filter().value()
              updates.listsListId = listsListId
              return updates
            } }
          }
        }
      },
      dependencies: {
        listsWithDeletedMembers: {
          action: 'genericApi',
          params: {
            url: {
              helper: 'transform',
              params: {
                arg: { ref: 'stage.updates.dynamoDeletes'},
                func: (deletes) => {
                  console.log(deletes)
                  console.log( _.map(deletes, 'listId'))
                  return _.map(deletes, 'listId')
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
                listsWithDeletedMembers: {ref: 'determineUpdates.results.listsWithDeletedMembers' }
              }
            },
            func: {
              value: ({listsWithDeletedMembers, plannedUpdates}) => {
                const {listsToReRender, neighborsToReRender, dynamoPuts, dynamoDeletes, listsListId} = plannedUpdates
                const additionalDeletes = []
                _.each(listsWithDeletedMembers, ({body}, i) => {
                  if (JSON.parse(body).length < 2) {
                    additionalDeletes.push({
                      memberId: dynamoDeletes[i].listId,
                      listId: listsListId
                    })
                  }
                })
                return {
                  listsToReRender,
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
