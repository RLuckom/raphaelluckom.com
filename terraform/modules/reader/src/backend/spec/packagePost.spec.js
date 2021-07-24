const fs = require('fs')
const { packagePost } = require('../packagePost.js')

describe('package post', () => {
  it('packages the post', (done) => {
    packagePost({
      postId: 'a post',
      postText: fs.readFileSync(__dirname + '/support/assets/posts/midjuly.md').toString('utf8'),
      pluginImageRoot: "https://admin.raphaelluckom.com/hosted-assets/plugins/prod_blog/img/Mid-July%20check%20in%3A%20alpha%20and%20beyond/",
      images: {
        '7f1a30af-dba5-460b-85bf-12d6643d75fa/50.svg': fs.readFileSync(__dirname + '/support/assets/img/midjuly/7f1a30af-dba5-460b-85bf-12d6643d75fa/50.svg'),
        '7f1a30af-dba5-460b-85bf-12d6643d75fa/500.svg': fs.readFileSync(__dirname + '/support/assets/img/midjuly/7f1a30af-dba5-460b-85bf-12d6643d75fa/50.svg'),
      }
    }, (err, buf) => {
      console.log(err)
      fs.writeFileSync('buf.zip', buf)
      done()
    })
  })
})
