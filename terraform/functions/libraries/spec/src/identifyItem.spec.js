const {identifyItem} = require('../../itentifyItem.js') 
const siteDescription = require('../../../../sites/test.raphaelluckom.com/site_description')

describe('identifyItem', () => {
  it('test1', () => {
    console.log(identifyItem({siteDescription, resourcePath: 'https://test.raphaelluckom.com/posts/post1.md'}))
  })
})
