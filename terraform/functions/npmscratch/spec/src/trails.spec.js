const siteDescription = require('../../../../sites/test.raphaelluckom.com/site_description')
const trails = require('../../trails')
const _ = require('lodash')
const fs = require('fs')


const testItem1 = {
	"type": "post",
	"typeDef": {
		"relation": "{relationEndpoint}/post",
		"idTemplate": "https://{domainName}/posts/{name}.md",
		"pathNameRegex": "^/?posts/([^/]*).md$",
		"meta": {
			"trail": {
				"default": [
					"posts"
				]
			}
		},
		"formats": {
			"markdown": {
				"authoring": true,
				"idTemplate": "https://{domainName}/posts/{name}.md"
			},
			"html": {
				"idTemplate": "https://{domainName}/posts/{name}.html",
				"views": {
					"trail": "https://{domainName}/posts.html"
				},
				"render": {
					"template": "https://{domainName}/assets/templates/post.tmpl"
				}
			}
		}
	},
	"name": "blork3",
	"formatUrls": {
		"markdown": {
			"uri": "https://test.raphaelluckom.com/posts/blork3.md",
			"path": "posts/blork3.md"
		},
		"html": {
			"uri": "https://test.raphaelluckom.com/posts/blork3.html",
			"path": "posts/blork3.html"
		}
	},
	"uri": "https://test.raphaelluckom.com/posts/blork3.md",
	"path": "posts/blork3.md"
}

const trails1 = {
	"https://test.raphaelluckom.com/meta/relations/trails?keyType=trailName&keyId=check-in": {
		"members": [
			{
				"trailUri": "https://test.raphaelluckom.com/meta/relations/trails?keyType=trailName&keyId=check-in",
				"trailName": "check-in",
				"memberName": "blork"
			}
		],
		"trailName": "check-in"
	},
	"https://test.raphaelluckom.com/meta/relations/trails?keyType=trailName&keyId=posts": {
		"members": [
			{
				"trailUri": "https://test.raphaelluckom.com/meta/relations/trails?keyType=trailName&keyId=posts",
				"trailName": "posts",
				"memberName": "blork"
			}
		],
		"trailName": "posts"
	}
}

trailNames1 = [
	"check-in",
	"posts"
],

existingMemberships1 = []

const noUpdates = {"neighborsToReRender":[],"trailsToReRender":[],"dynamoPuts":[],"dynamoDeletes":[],"neighbors":{},"trailsListName":"trails"}

describe('trails test', () => {
	it('is a test', () => {
		const updates = trails.determineUpdates({trails: [], existingMemberships: [], siteDescription, item: testItem1, trailNames: []})
		expect(updates).toEqual(noUpdates)
	})

	it('test1', () => {
		const updates = trails.determineUpdates({trails: trails1, existingMemberships: existingMemberships1, siteDescription, item: testItem1, trailNames: trailNames1})
    //fs.writeFileSync(`${__dirname}/../fixtures/test1.json`, JSON.stringify(updates, null, 2))
		expect(updates).toEqual(JSON.parse(fs.readFileSync(`${__dirname}/../fixtures/test1.json`)))
	})

	it('test2', () => {
		const updates = trails.determineUpdates({trails: [], existingMemberships: existingMemberships1, siteDescription, item: testItem1, trailNames: trailNames1})
    //fs.writeFileSync(`${__dirname}/../fixtures/test2.json`, JSON.stringify(updates, null, 2))
		expect(updates).toEqual(JSON.parse(fs.readFileSync(`${__dirname}/../fixtures/test2.json`)))
	})
})
