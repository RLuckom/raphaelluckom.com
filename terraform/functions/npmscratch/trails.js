const _ = require('lodash')
const urlTemplate = require('url-template')

function checkForEmptyLists({trailsWithDeletedMembers, plannedUpdates}) {
	const {trailsToReRender, neighborsToReRender, dynamoPuts, dynamoDeletes, trailsListName} = plannedUpdates
	const additionalDeletes = []
	_.each(trailsWithDeletedMembers, (trails, i) => {
		if (trails.length < 2) {
			additionalDeletes.push({
        memberKey: `trail:${dynamoDeletes[i].trailName}`,
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

function determineUpdates({trails, existingMemberships, siteDescription, item, trailNames}) {
  const updates = {
    neighborsToReRender: [],
    trailsToReRender: [],
    dynamoPuts: [],
    dynamoDeletes: [],
    neighbors: {}
  }
  const trailUriTemplate = urlTemplate.parse(_.get(siteDescription, 'relations.meta.trail.idTemplate'))
  const trailsListName = 'trails'
  const trailsListId = trailUriTemplate.expand({...siteDescription.siteDetails, ...{name: encodeURIComponent(trailsListName)}})
  _.each(existingMemberships, (trail) => {
    if (!_.find(trailNames, (name) => name === trail.trailName)) {
      updates.dynamoDeletes.push({
        memberKey: `${item.type}:${item.name}`,
        trailName: trail.trailName
      })
      updates.trailsToReRender.push(trailUriTemplate.expand({...siteDescription.siteDetails, ...{name: trail.trailName}}))
    }
  })
  _.each(trails, ({members, trailName}) => {
    const trailUriTemplate = urlTemplate.parse(_.get(siteDescription, 'relations.meta.trail.idTemplate'))
    const newList = _.cloneDeep(members)
    const trailUri = trailUriTemplate.expand({...siteDescription.siteDetails, ...{name: encodeURIComponent(trailName)}})
    const currentIndex = _.findIndex(members, (member) => {
      return member.memberKey === `${item.type}:${item.name}` && _.isEqual(member.memberMetadata, item.metadata)
    })
    const previousIndex = _.findIndex(members, (member) => member.memberUri === item.id)
    if (members.length === 0) {
      updates.dynamoPuts.push({
        trailUri: trailsListId,
        trailName: trailsListName,
        memberUri: trailUri,
        memberName: trailName,
        memberKey: `trail:${trailName}`,
        memberType: 'trail',
        memberMetadata: {
          date: new Date().toISOString(),
        }
      })
      updates.trailsToReRender.push(trailUriTemplate.expand({...siteDescription.siteDetails, ...{name: trailName}}))
    }
    if (currentIndex === -1) {
      const trailMember = {
        trailUri: trailUri,
        trailName,
        memberUri: item.uri,
        memberName: item.name,
        memberKey: `${item.type}:${item.name}`,
        memberType: item.type,
        memberMetadata: item.metadata
      }
      newList.push(trailMember)
      updates.dynamoPuts.push(trailMember)
      const sortedNewList = _.sortBy(newList, ['memberMetadata', 'date'])
      const newIndex = sortedNewList.findIndex((i) => i.memberUri === item.id && _.isEqual(i.memberMetadata, item.metadata))
      if (previousIndex !== -1 && newIndex !== previousIndex) {
        updates.neighborsToReRender.push(members[previousIndex + 1])
        updates.neighborsToReRender.push(members[previousIndex - 1])
        newList.splice(previousIndex, 1)
      }
      updates.neighborsToReRender.push(sortedNewList[newIndex + 1])
      updates.neighborsToReRender.push(sortedNewList[newIndex - 1])
      updates.neighbors[trailName] = {
        trailName,
        previousNeighbor: sortedNewList[newIndex - 1] || null,
        nextNeighbor: sortedNewList[newIndex + 1] || null,
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
  updates.neighborsToReRender = _(updates.neighborsToReRender).filter().uniqWith((arg1, arg2) => {
    return arg1.memberUri === arg2.memberUri && arg2.memberType === arg2.memberType
  }).value()
  updates.dynamoPuts = _(updates.dynamoPuts).uniq().filter().value()
  updates.dynamoDeletes = _(updates.dynamoDeletes).uniq().filter().value()
  updates.trailsListName = trailsListName
  return updates
} 

module.exports = {determineUpdates, checkForEmptyLists}
