const _ = require('lodash')
const urlTemplate = require('url-template')

function determineUpdates({trails, existingMemberships, siteDescription, item, trailNames}) {
  const updates = {
    neighborsToReRender: [],
    trailsToReRender: [],
    dynamoPuts: [],
    dynamoDeletes: [],
    neighbors: {}
  }
  const trailUriTemplate = urlTemplate.parse(_.get(siteDescription, 'relations.meta.trail.setTemplate'))
  const trailsListName = 'trails'
  const trailsListId = trailUriTemplate.expand({...siteDescription.siteDetails, ...{name: encodeURIComponent(trailsListName)}})
  _.each(existingMemberships, (trail) => {
    console.log(trail)
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
      return member.memberName === item.name && _.isEqual(member.memberMetadata, item.metadata)
    })
    const previousIndex = _.findIndex(members, (member) => member.memberUri === item.id)
    const trailUriTemplate = urlTemplate.parse(_.get(siteDescription, 'relations.meta.trail.idTemplate'))
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
      updates.trailsToReRender.push(trailUriTemplate.expand({...siteDescription.siteDetails, ...{name: trailName}}))
    }
    if (currentIndex === -1) {
      const trailMember = {
        trailUri: trailUri,
        trailName,
        memberUri: item.uri,
        memberName: item.name,
        memberType: item.type,
        memberMetadata: item.typeDef
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
} 

module.exports = {determineUpdates}
