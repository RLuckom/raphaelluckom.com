function buildGopher({awsDependencies, otherDependencies, defaultInputs}) {
  const credentialsAccessSchema = {
    name: 'site AWS credentials',
    value: {path: 'body'},
    dataSource: 'GENERIC_API',
    behaviors: {
      cacheLifetime: 30 * 60 * 1000
    },
    host: window.location.hostname,
    path: 'api/actions/access/credentials'
  }

  const apiConfigSelector = {
    source: 'credentials',
    formatter: ({credentials}) => {
      console.log(credentials)
      return {
        region: 'us-east-1',
        accessKeyId: credentials[0].Credentials.AccessKeyId,
        secretAccessKey: credentials[0].Credentials.SecretKey,
        sessionToken: credentials[0].Credentials.SessionToken
      }
    }
  }

  const dependencies = _.merge(
    {
      credentials: {
        accessSchema: credentialsAccessSchema
      }
    },
    _.reduce(awsDependencies, (acc, v, k) => {
      v.params.apiConfig = apiConfigSelector
      acc[k] = v
      return acc
    }, {}),
    otherDependencies || {}
  )

  return exploranda.Gopher(dependencies, defaultInputs)
}

const listHostingRootDependency = {
  accessSchema: exploranda.dataSources.AWS.s3.listObjects,
  params: {
    Bucket: {value: CONFIG.private_storage_bucket },
    Prefix: {value: CONFIG.hosting_root },
  }
}
