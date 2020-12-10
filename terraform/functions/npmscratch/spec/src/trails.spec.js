const siteDescription = require('../../../../sites/test.raphaelluckom.com/site_description')
const trails = require('../../trails')
const _ = require('lodash')
const fs = require('fs')

const arg1 = {
  "trails": {
    "https://test.raphaelluckom.com/trails/check-in.md": {
      "members": [],
      "trailName": "check-in"
    },
    "https://test.raphaelluckom.com/trails/posts.md": {
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
          "membersTemplate": "{+relationEndpoint}/trails?keyType=memberKey&keyId={name}",
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
    "https://test.raphaelluckom.com/trails/check-in.md": {
      "members": [
        {
          "memberUri": "https://test.raphaelluckom.com/posts/post1.md",
          "trailName": "check-in",
          "memberType": "post",
          "trailUri": "https://test.raphaelluckom.com/trails/check-in.md",
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
          "memberName": "post1",
          "memberKey": "post:post1"
        }
      ],
      "trailName": "check-in"
    },
    "https://test.raphaelluckom.com/trails/posts.md": {
      "members": [
        {
          "memberUri": "https://test.raphaelluckom.com/posts/post1.md",
          "trailName": "posts",
          "memberType": "post",
          "trailUri": "https://test.raphaelluckom.com/trails/posts.md",
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
          "memberName": "post1",
          "memberKey": "post:post1"
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
      "trailUri": "https://test.raphaelluckom.com/trails/check-in.md",
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
      "memberName": "post1",
      "memberKey": "post:post1"
    },
    {
      "memberUri": "https://test.raphaelluckom.com/posts/post1.md",
      "memberType": "post",
      "trailName": "posts",
      "trailUri": "https://test.raphaelluckom.com/trails/posts.md",
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
      "memberName": "post1",
      "memberKey": "post:post1"
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
          "membersTemplate": "{+relationEndpoint}/trails?keyType=memberKey&keyId={name}",
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
    "https://test.raphaelluckom.com/trails/check-in.md": {
      "members": [
        {
          "memberUri": "https://test.raphaelluckom.com/posts/post2.md",
          "trailName": "check-in",
          "memberType": "post",
          "trailUri": "https://test.raphaelluckom.com/trails/check-in.md",
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
          "memberName": "post2",
          "memberKey": "post:post2"
        }
      ],
      "trailName": "check-in"
    },
    "https://test.raphaelluckom.com/trails/posts.md": {
      "members": [
        {
          "memberUri": "https://test.raphaelluckom.com/posts/post2.md",
          "trailName": "posts",
          "memberType": "post",
          "trailUri": "https://test.raphaelluckom.com/trails/posts.md",
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
          "memberName": "post2",
          "memberKey": "post:post2"
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
      "trailUri": "https://test.raphaelluckom.com/trails/check-in.md",
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
      "memberName": "post2",
      "memberKey": "post:post2"
    },
    {
      "memberUri": "https://test.raphaelluckom.com/posts/post2.md",
      "memberType": "post",
      "trailName": "posts",
      "trailUri": "https://test.raphaelluckom.com/trails/posts.md",
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
      "memberName": "post2",
      "memberKey": "post:post2"
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
      "memberKey": "post:post2",
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
          "membersTemplate": "{+relationEndpoint}/trails?keyType=memberKey&keyId={name}",
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

const arg4 = {
    "trails": {
        "https://test.raphaelluckom.com/meta/relations/trails?keyType=trailName&keyId=trails": {
            "members": [
                {
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
                {
                    "trailName": "trails",
                    "memberType": "trail",
                    "trailUri": "https://test.raphaelluckom.com/trails/trails.md",
                    "memberName": "random",
                    "memberUri": "https://test.raphaelluckom.com/trails/random.md",
                    "memberMetadata": {
                        "date": "2020-12-07T20:08:45.245Z"
                    },
                    "memberKey": "trail:random"
                }
            ],
            "trailName": "trails"
        }
    },
    "trailNames": [
        "trails"
    ],
    "existingMemberships": [],
    "siteDescription": {
        "siteDetails": {
            "domainName": "test.raphaelluckom.com",
            "title": "Raphael Luckom's Test Site",
            "maintainer": "Raphael Luckom",
            "maintainerEmail": "raphaelluckom@gmail.com",
            "relationEndpoint": "https://test.raphaelluckom.com/meta/relations",
            "pathRegex": "^https://test.raphaelluckom.com/(.*)$",
            "formats": {
                "html": {
                    "nav": {
                        "links": [
                            {
                                "name": "Posts",
                                "target": "https://test.raphaelluckom.com/trails/posts.html"
                            },
                            {
                                "name": "Github",
                                "target": "https://github.com/RLuckom"
                            }
                        ]
                    },
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
                    "membersTemplate": "{+relationEndpoint}/trails?keyType=memberKey&keyId={type}:{name}",
                    "meta": {
                        "trail": {
                            "default": [
                                "trails"
                            ]
                        },
                        "meta": {
                            "feed": {}
                        }
                    },
                    "accumulators": {
                        "members": {
                            "idTemplate": "{+relationEndpoint}/trails?keyType=trailName&keyId={name}"
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
                                "template": "https://{domainName}/assets/templates/trail.tmpl"
                            }
                        },
                        "atom1.0": {
                            "idTemplate": "https://{domainName}/trails/atom1.0/{name}.xml"
                        },
                        "rss2.0": {
                            "idTemplate": "https://{domainName}/trails/rss2.0/{name}.xml"
                        },
                        "json1.0": {
                            "idTemplate": "https://{domainName}/trails/json1.0/{name}.json"
                        }
                    }
                }
            }
        }
    },
    "item": {
        "type": "trail",
        "name": "posts",
        "formatUrls": {
            "markdown": {
                "uri": "https://test.raphaelluckom.com/trails/posts.md",
                "path": "trails/posts.md"
            },
            "html": {
                "uri": "https://test.raphaelluckom.com/trails/posts.html",
                "path": "trails/posts.html"
            },
            "atom1.0": {
                "uri": "https://test.raphaelluckom.com/trails/atom1.0/posts.xml",
                "path": "trails/atom1.0/posts.xml"
            },
            "rss2.0": {
                "uri": "https://test.raphaelluckom.com/trails/rss2.0/posts.xml",
                "path": "trails/rss2.0/posts.xml"
            },
            "json1.0": {
                "uri": "https://test.raphaelluckom.com/trails/json1.0/posts.json",
                "path": "trails/json1.0/posts.json"
            }
        },
        "uri": "https://test.raphaelluckom.com/trails/posts.md",
        "path": "trails/posts.md",
        "metadata": {
            "frontMatter": {
                "title": "posts",
                "color": "red"
            },
            "content": "\n",
            "raw": "---\ntitle: \"posts\"\ncolor: \"red\"\n---\n"
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

  it('test4', () => {
    const updates = trails.determineUpdates(arg4)
    fs.writeFileSync(`${__dirname}/../fixtures/test4.json`, JSON.stringify(updates, null, 2))
    expect(updates).toEqual(JSON.parse(fs.readFileSync(`${__dirname}/../fixtures/test4.json`)))
  })

})
