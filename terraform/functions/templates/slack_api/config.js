module.exports = {
  intro: {
    transformers: {
      body: { 
        helper: 'fromJson',
        params: {
          string: { ref: 'event.body'}
        }
      }
    }
  },
  cleanup: {
    transformers: {
      statusCode: { value: 200 },
      body: {helper: 'toJson', params: {challenge: { ref: 'intro.vars.body.challenge' }}},
    }
  }
}
