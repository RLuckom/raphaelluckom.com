const _ = require('lodash')
const compiled = _.template(require('fs').readFileSync('../../sites/test.raphaelluckom.com/assets/templates/trail.tmpl'))
console.log(compiled.source)
console.log(
  compiled(
    {
      title: 'foo',
      content: 'foo',
      meta: {
        trails: {
          "neighbors": {
            "https://test.raphaelluckom.com/trails/trails.md": {
              "trailName": "trails",
              "previousNeighbor": {
                "trailName": "trails",
                "memberType": "trail",
                "trailUri": "https://test.raphaelluckom.com/trails/trails.md",
                "memberName": "check-in",
                "memberUri": "https://test.raphaelluckom.com/trails/check-in.md",
                "memberMetadata": {
                  "date": "2020-12-06T19:35:57.011Z"
                },
                "memberKey": "trail:check-in"
              },
              "nextNeighbor": null
            }
          },
          "members": [
            {
              "trailName": "posts",
              "memberType": "post",
              "trailUri": "https://test.raphaelluckom.com/trails/posts.md",
              "memberName": "post2",
              "memberUri": "https://test.raphaelluckom.com/posts/post2.md",
              "memberMetadata": {
                "date": "2018-07-13T00:00:00.000Z",
                "title": "Organic Parametric Shapes: Bézier Curves in OpenSCAD",
                "author": "Raphael Luckom",
                "meta": {
                  "trail": [
                    "check-in"
                  ]
                },
                "draft": false
              },
              "memberKey": "post:post2"
            }
          ]
        }
      }
    }
  )
)
