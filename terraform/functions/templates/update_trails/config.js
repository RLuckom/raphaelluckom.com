const _ = require('lodash')
const urlTemplate = require('url-template')
const {formatters, siteDescriptionDependency } = require('./helpers')
const trails = require('./trails.js')

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
          helper: 'expandUrlTemplateWithName',
          params: {
            templateString: {ref: 'siteDescription.results.siteDescription.${self_type}.membersTemplate'},
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
          formatter: formatters.singleValue.unwrapJsonHttpResponse,
          params: {
            url: { ref: 'stage.existingMemberships'}
          }
        }
      },
    },
    parseLists: {
      index: 2,
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
      index: 3,
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
            func: { value: trails.determineUpdates }
          }
        }
      },
      dependencies: {
        trailsWithDeletedMembers: {
          condition: { ref: 'stage.updates.dynamoDeletes.length'},
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
      index: 4,
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
                _.each(trailsWithDeletedMembers, (trails, i) => {
                  if (trails.length < 2) {
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
        },
        trails: {
          action: 'invokeFunction',
          condition: { ref: 'stage.allUpdates.neighborsToReRender.length' },
          params: {
            FunctionName: {value: '${render_function}'},
            Payload: { 
              helper: 'transform', 
              params: {
                arg: {
                  all: {
                    neighbors: {ref: 'stage.allUpdates.neighborsToReRender'},
                    bounceDepth: {ref: 'event.bounceDepth'},
                  }
                },
                func: ({neighbors, bounceDepth}) => {
                  return _.map(neighbors, (n) => {
                    return JSON.stringify({
                      item: n,
                      bounceDepth: bounceDepth + 1
                    })
                  })
                },
              }
            }
          }
        }
      },
    },
  }
}
