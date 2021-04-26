const credentialsAccessSchema = {
  name: 'site AWS credentials',
  value: {path: 'body'},
  dataSource: 'GENERIC_API',
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
