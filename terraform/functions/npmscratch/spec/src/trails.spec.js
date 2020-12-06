const siteDescription = require('../../../../sites/test.raphaelluckom.com/site_description')
const trails = require('../../trails')
const _ = require('lodash')
const fs = require('fs')

const arg1 = {
  "trails": {
    "https://test.raphaelluckom.com/meta/relations/trails?keyType=trailName&keyId=check-in": {
      "members": [],
      "trailName": "check-in"
    },
    "https://test.raphaelluckom.com/meta/relations/trails?keyType=trailName&keyId=posts": {
      "members": [],
      "trailName": "posts"
    }
  },
  "trailNames": [
    "check-in",
    "posts"
  ],
  "existingMemberships": [],
  "siteDescription": {
    "siteDetails": {
      "domainName": "test.raphaelluckom.com",
      "title": "Test Site",
      "maintainer": "Raphael Luckom",
      "maintainerEmail": "raphaelluckom@gmail.com",
      "relationEndpoint": "https://test.raphaelluckom.com/meta/relations",
      "pathRegex": "^https://test.raphaelluckom.com/(.*)$",
      "formats": {
        "html": {
          "sections": {
            "index": {
              "renderFrom": "https://test.raphaelluckom.com/trails/posts.md",
              "renderTo": "/index.html",
              "sectionTitle": "Home"
            }
          }
        }
      }
    },
    "relations": {
      "post": {
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
      "meta": {
        "trail": {
          "relation": "{+relationEndpoint}/meta/trail",
          "idTemplate": "https://{domainName}/trails/{name}.md",
          "pathNameRegex": "^/?trails/([^/]*).md$",
          "setTemplate": "{+relationEndpoint}/trails?keyType=trailName&keyId={name}",
          "membersTemplate": "{+relationEndpoint}/trails?keyType=memberName&keyId={name}",
          "meta": {
            "trail": {
              "default": [
                "trails"
              ]
            }
          },
          "formats": {
            "markdown": {
              "authoring": true,
              "idTemplate": "https://{domainName}/trails/{name}.md"
            },
            "html": {
              "idTemplate": "https://{domainName}/trails/{name}.html",
              "render": {
                "template": "https://{domainName}/assets/templates/trail.tpl"
              }
            }
          }
        }
      }
    }
  },
  "item": {
    "type": "post",
    "name": "post1",
    "formatUrls": {
      "markdown": {
        "uri": "https://test.raphaelluckom.com/posts/post1.md",
        "path": "posts/post1.md"
      },
      "html": {
        "uri": "https://test.raphaelluckom.com/posts/post1.html",
        "path": "posts/post1.html"
      }
    },
    "uri": "https://test.raphaelluckom.com/posts/post1.md",
    "path": "posts/post1.md",
    "metadata": {
      "title": "Organic Parametric Shapes: Bézier Curves in OpenSCAD",
      "author": "Raphael Luckom",
      "date": "2018-07-13T00:00:00.000Z",
      "draft": false,
      "meta": {
        "trail": [
          "check-in"
        ]
      }
    }
  }
}

const arg2 = {
  "trails": {
    "https://test.raphaelluckom.com/meta/relations/trails?keyType=trailName&keyId=check-in": {
      "members": [
        {
          "memberUri": "https://test.raphaelluckom.com/posts/post1.md",
          "trailName": "check-in",
          "memberType": "post",
          "trailUri": "https://test.raphaelluckom.com/meta/relations/trails?keyType=trailName&keyId=check-in",
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
          "memberName": "post1"
        }
      ],
      "trailName": "check-in"
    },
    "https://test.raphaelluckom.com/meta/relations/trails?keyType=trailName&keyId=posts": {
      "members": [
        {
          "memberUri": "https://test.raphaelluckom.com/posts/post1.md",
          "trailName": "posts",
          "memberType": "post",
          "trailUri": "https://test.raphaelluckom.com/meta/relations/trails?keyType=trailName&keyId=posts",
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
          "memberName": "post1"
        }
      ],
      "trailName": "posts"
    }
  },
  "trailNames": [
    "check-in",
    "posts"
  ],
  "existingMemberships": [
    {
      "memberUri": "https://test.raphaelluckom.com/posts/post1.md",
      "memberType": "post",
      "trailName": "check-in",
      "trailUri": "https://test.raphaelluckom.com/meta/relations/trails?keyType=trailName&keyId=check-in",
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
      "memberName": "post1"
    },
    {
      "memberUri": "https://test.raphaelluckom.com/posts/post1.md",
      "memberType": "post",
      "trailName": "posts",
      "trailUri": "https://test.raphaelluckom.com/meta/relations/trails?keyType=trailName&keyId=posts",
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
      "memberName": "post1"
    }
  ],
  "siteDescription": {
    "siteDetails": {
      "domainName": "test.raphaelluckom.com",
      "title": "Test Site",
      "maintainer": "Raphael Luckom",
      "maintainerEmail": "raphaelluckom@gmail.com",
      "relationEndpoint": "https://test.raphaelluckom.com/meta/relations",
      "pathRegex": "^https://test.raphaelluckom.com/(.*)$",
      "formats": {
        "html": {
          "sections": {
            "index": {
              "renderFrom": "https://test.raphaelluckom.com/trails/posts.md",
              "renderTo": "/index.html",
              "sectionTitle": "Home"
            }
          }
        }
      }
    },
    "relations": {
      "post": {
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
      "meta": {
        "trail": {
          "relation": "{+relationEndpoint}/meta/trail",
          "idTemplate": "https://{domainName}/trails/{name}.md",
          "pathNameRegex": "^/?trails/([^/]*).md$",
          "setTemplate": "{+relationEndpoint}/trails?keyType=trailName&keyId={name}",
          "membersTemplate": "{+relationEndpoint}/trails?keyType=memberName&keyId={name}",
          "meta": {
            "trail": {
              "default": [
                "trails"
              ]
            }
          },
          "formats": {
            "markdown": {
              "authoring": true,
              "idTemplate": "https://{domainName}/trails/{name}.md"
            },
            "html": {
              "idTemplate": "https://{domainName}/trails/{name}.html",
              "render": {
                "template": "https://{domainName}/assets/templates/trail.tpl"
              }
            }
          }
        }
      }
    }
  },
  "item": {
    "type": "post",
    "name": "post1",
    "formatUrls": {
      "markdown": {
        "uri": "https://test.raphaelluckom.com/posts/post1.md",
        "path": "posts/post1.md"
      },
      "html": {
        "uri": "https://test.raphaelluckom.com/posts/post1.html",
        "path": "posts/post1.html"
      }
    },
    "uri": "https://test.raphaelluckom.com/posts/post1.md",
    "path": "posts/post1.md",
    "metadata": {
      "title": "Organic Parametric Shapes: Bézier Curves in OpenSCAD",
      "author": "Raphael Luckom",
      "date": "2018-07-13T00:00:00.000Z",
      "draft": false,
      "meta": {
        "trail": [
          "check-in"
        ]
      }
    }
  }
}

const arg3 = {
  "trails": {
    "https://test.raphaelluckom.com/meta/relations/trails?keyType=trailName&keyId=check-in": {
      "members": [
        {
          "memberUri": "https://test.raphaelluckom.com/posts/post2.md",
          "trailName": "check-in",
          "memberType": "post",
          "trailUri": "https://test.raphaelluckom.com/meta/relations/trails?keyType=trailName&keyId=check-in",
          "memberMetadata": {
            "date": "2018-07-13T00:00:00.000Z",
            "title": "Organic Parametric Shapes: Bézier Curves in OpenSCAD",
            "author": "Raphael Luckom",
            "meta": {
              "trail": [
                "random",
                "check-in"
              ]
            },
            "draft": false
          },
          "memberName": "post2"
        }
      ],
      "trailName": "check-in"
    },
    "https://test.raphaelluckom.com/meta/relations/trails?keyType=trailName&keyId=posts": {
      "members": [
        {
          "memberUri": "https://test.raphaelluckom.com/posts/post2.md",
          "trailName": "posts",
          "memberType": "post",
          "trailUri": "https://test.raphaelluckom.com/meta/relations/trails?keyType=trailName&keyId=posts",
          "memberMetadata": {
            "date": "2018-07-13T00:00:00.000Z",
            "title": "Organic Parametric Shapes: Bézier Curves in OpenSCAD",
            "author": "Raphael Luckom",
            "meta": {
              "trail": [
                "random",
                "check-in"
              ]
            },
            "draft": false
          },
          "memberName": "post2"
        }
      ],
      "trailName": "posts"
    }
  },
  "trailNames": [
    "check-in",
    "posts"
  ],
  "existingMemberships": [
    {
      "memberUri": "https://test.raphaelluckom.com/posts/post2.md",
      "memberType": "post",
      "trailName": "check-in",
      "trailUri": "https://test.raphaelluckom.com/meta/relations/trails?keyType=trailName&keyId=check-in",
      "memberMetadata": {
        "date": "2018-07-13T00:00:00.000Z",
        "title": "Organic Parametric Shapes: Bézier Curves in OpenSCAD",
        "author": "Raphael Luckom",
        "meta": {
          "trail": [
            "random",
            "check-in"
          ]
        },
        "draft": false
      },
      "memberName": "post2"
    },
    {
      "memberUri": "https://test.raphaelluckom.com/posts/post2.md",
      "memberType": "post",
      "trailName": "posts",
      "trailUri": "https://test.raphaelluckom.com/meta/relations/trails?keyType=trailName&keyId=posts",
      "memberMetadata": {
        "date": "2018-07-13T00:00:00.000Z",
        "title": "Organic Parametric Shapes: Bézier Curves in OpenSCAD",
        "author": "Raphael Luckom",
        "meta": {
          "trail": [
            "random",
            "check-in"
          ]
        },
        "draft": false
      },
      "memberName": "post2"
    },
    {
      "memberUri": "https://test.raphaelluckom.com/posts/post2.md",
      "memberType": "post",
      "trailName": "random",
      "trailUri": "https://test.raphaelluckom.com/meta/relations/trails?keyType=trailName&keyId=random",
      "memberMetadata": {
        "date": "2018-07-13T00:00:00.000Z",
        "title": "Organic Parametric Shapes: Bézier Curves in OpenSCAD",
        "author": "Raphael Luckom",
        "meta": {
          "trail": [
            "random",
            "check-in"
          ]
        },
        "draft": false
      },
      "memberName": "post2"
    }
  ],
  "siteDescription": {
    "siteDetails": {
      "domainName": "test.raphaelluckom.com",
      "title": "Test Site",
      "maintainer": "Raphael Luckom",
      "maintainerEmail": "raphaelluckom@gmail.com",
      "relationEndpoint": "https://test.raphaelluckom.com/meta/relations",
      "pathRegex": "^https://test.raphaelluckom.com/(.*)$",
      "formats": {
        "html": {
          "sections": {
            "index": {
              "renderFrom": "https://test.raphaelluckom.com/trails/posts.md",
              "renderTo": "/index.html",
              "sectionTitle": "Home"
            }
          }
        }
      }
    },
    "relations": {
      "post": {
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
      "meta": {
        "trail": {
          "relation": "{+relationEndpoint}/meta/trail",
          "idTemplate": "https://{domainName}/trails/{name}.md",
          "pathNameRegex": "^/?trails/([^/]*).md$",
          "setTemplate": "{+relationEndpoint}/trails?keyType=trailName&keyId={name}",
          "membersTemplate": "{+relationEndpoint}/trails?keyType=memberName&keyId={name}",
          "meta": {
            "trail": {
              "default": [
                "trails"
              ]
            }
          },
          "formats": {
            "markdown": {
              "authoring": true,
              "idTemplate": "https://{domainName}/trails/{name}.md"
            },
            "html": {
              "idTemplate": "https://{domainName}/trails/{name}.html",
              "render": {
                "template": "https://{domainName}/assets/templates/trail.tpl"
              }
            }
          }
        }
      }
    }
  },
  "item": {
    "type": "post",
    "name": "post2",
    "formatUrls": {
      "markdown": {
        "uri": "https://test.raphaelluckom.com/posts/post2.md",
        "path": "posts/post2.md"
      },
      "html": {
        "uri": "https://test.raphaelluckom.com/posts/post2.html",
        "path": "posts/post2.html"
      }
    },
    "uri": "https://test.raphaelluckom.com/posts/post2.md",
    "path": "posts/post2.md",
    "metadata": {
      "title": "Organic Parametric Shapes: Bézier Curves in OpenSCAD",
      "author": "Raphael Luckom",
      "date": "2018-07-13T00:00:00.000Z",
      "draft": false,
      "meta": {
        "trail": [
          "check-in"
        ]
      }
    }
  }
}
describe('trails test', () => {

  it('test1', () => {
    const updates = trails.determineUpdates(arg1)
    //fs.writeFileSync(`${__dirname}/../fixtures/test1.json`, JSON.stringify(updates, null, 2))
    expect(updates).toEqual(JSON.parse(fs.readFileSync(`${__dirname}/../fixtures/test1.json`)))
  })

  it('test2', () => {
    const updates = trails.determineUpdates(arg2)
    //fs.writeFileSync(`${__dirname}/../fixtures/test2.json`, JSON.stringify(updates, null, 2))
    expect(updates).toEqual(JSON.parse(fs.readFileSync(`${__dirname}/../fixtures/test2.json`)))
  })

  it('test3', () => {
    const updates = trails.determineUpdates(arg3)
    //fs.writeFileSync(`${__dirname}/../fixtures/test3.json`, JSON.stringify(updates, null, 2))
    expect(updates).toEqual(JSON.parse(fs.readFileSync(`${__dirname}/../fixtures/test3.json`)))
  })

})
