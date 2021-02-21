---
title: "Note to Self: Login System Overview"
author: "Raphael Luckom"
date: 2021-02-21T14:18:22
draft: false
meta:
  trail:
    - note-to-self
---
_This post is a running collection of my notes on the login system as I build and test it.
It's intended mostly for future-me to be able to get this context back, so it may not be super
useful to non-practitioners or people just starting out in their practitioner journey. However,
it ought to be fairly legible to experienced practitioners._

Here we go. Login system. I'm starting from [this example system](https://aws.amazon.com/blogs/networking-and-content-delivery/authorizationedge-using-cookies-protect-your-amazon-cloudfront-content-from-being-downloaded-by-unauthenticated-users/)
of using AWS Cognito to control access to a cloudfront distribution. Cognito is essentially a hosted
Oauth identity provider[^1]. It provides a hosted login UI to which a client application (our social media system) can direct
a user-agent such as a browser; on sign-in success, the hosted UI will redirect back to the (whitelisted)
client application URL with an authorization code, which the client application can then exchange for a
JWT. In the example I'm following, the JWT and a couple other security things are stored as cookies
by the browser. Lambda@edge functions inspect each incoming request to validate the cookies; if they don't
find them, or if they're expired or invalid, cloudfront returns a redirect to the login system. If the
validation functions _do_ find valid cookies, the request is sent through to the cloudfront origin, which returns
the requested resource.

Upsides:

1. Since the authn[^2] is handled by cognito I don't have to invent a way to store usernames & passwords or do MFA; that's cognito's problem.
2. Cognito [pricing](https://aws.amazon.com/cognito/pricing/) is pay-as-you-go, with a free tier of 50,000 monthly active users, of which
   I plan on using approximately 1.
3. By putting the authz system at the outer edge of the cloudfront distribution--intercepting and authorizing requests as they come in--we
   relieve some of the burden of that complexity from the rest of the back-end systems--each individual service can focus on its intended
   function without having to implement its own security system.
4. By using a consistent system for authz (controlling access to cloudfront origins at the CDN layer), we plant the seed of another
   human-adapted control surface within the interior of the system. I can imagine constructing a "request permissions" system, similar to the
   ones that iphones and android phones have for third-party apps, that would allow people to install third-party apps to extend their
   own social media systems while still retaining granular control over their data. Another potential way to support non-practitioners.

Downsides:

1. Oauth is not simple. Its security design is difficult to explain to non-practitioners (and many professionals).
2. Cognito-the-hosted-service is another anchor to AWS specifically. [Auth0](https://auth0.com/) appears to offer an equivalent
   service that a) meets price and functionality requirements; b) is not immediately AWS (might run on AWS behind the scenes, I haven't checked).
   I don't want to make people sign up for another thing though.
3. This design constitutes a _massive_ increase in the number of charged lambda function executions per month. Each request to a private
   area under this type of security generates at least one Lambda@edge execution. Those executions are not part of the lambda free tier.
   In every previous exercise, the number of executed lambdas was a function of something like "the number of blog posts published" rather than the
   number of blog post views. I'm _pretty confident_ that the increase in this number due to this login system will be proportional to
   "the number of requests one makes to one's facebook account," for instance. As an order-of-magnitude estimate. The [pricing](https://aws.amazon.com/lambda/pricing/#Lambda.40Edge_Pricing)
   of these requests is $0.60 per million plus a small amount for duration, which still seems pretty safe--if one person checked their 
   private site at a rate of one request per second for the entire month with no breaks, and each request used 100ms @128MB, it would cost $3.22. 
   That would bump the overall monthly cost of running the system to around $4.50. I think that's a pretty conservative bound--I don't
   think an ordinary person would hit that number of requests or that they would require that duration[^3]; I suspect the common-case number
   might grow to around a quarter of that estimate. This estimate assumes that non-owner-viewer requests will not contribute to that load,
   which is a little bit of a tricky assumption but I can think of ways to make it work, especially at common scales.

So that's how I thought about this decision before deciding to use this design. Next, we can look at the mechanics of the thing:

Terraform can deploy all the cognito resources needed for this solution. _If_ we use the builtin terraform providers, we'll end up
with secret data stored in the terraform state file[^4]. That's not great but, since terraform deploys the login functions, and those functions
require access to those secrets, I don't see it as disqualifying. If a security person makes a good case for why that's disqualifying,
the fallback is to make some new terraform providers and resources that don't store sensitive things in the state file, which is doable but
seems like not quite enough benefit to be worth the effort.

There are [five separate functions](https://github.com/aws-samples/cloudfront-authorization-at-edge/tree/master/src/lambda-edge) that together
implement a full controlled-access system:

1. `check_auth`: This function runs on every request. It looks for authz cookies in incoming requests and validates them. If it finds
   a valid JWT that isn't close to expiration, it passes the request through to the backend.
2. `http_headers`: this function runs on every successful request. It sets additional security headers on the response, telling
   the browser how to correctly protect the user from malicious third parties. It does _not_ have access to the oauth client secret or nonce-signing
   secret.
3. `parse_auth`: On sign in, `check_auth` sends the user to the cognito login page. When the user signs in, they are bounced from cognito
   to the `parse_auth` function with an authorization code. The `parse_auth` function exchanges the authorization code for a JWT and refresh token, and responds
   with several `set-cookie` headers that tell the browser how to store and use the access token, ID token, and refresh token.
4. `refresh_auth`: If `check_auth` gets an access token whose expiration time is within 10 minutes, _and_ the client has a refresh token,
   the user is bounced to the `refresh_auth` function. This function uses the refresh token to generate a _new_ JWT, and it responds with
   a similar set of `set-cookie` headers as the `parse_auth` function and bounces the user back to whatever page they requested.
5. `sign_out`: This expires all of the cookies and bounces the now-logged-out user to the sign-in page.

This kind of security code requires comprehensive testing, which is why I'm taking my time with it. The beginnings of the tests are
[in the repo](https://github.com/RLuckom/raphaelluckom.com/tree/a869b2f8a74ef4146c93359234526b6393f79cd9/terraform/functions/libraries/spec/src/cognito_functions);
my next week or so is going to consist of trudging through all the test cases that I need to make me feel comfortable with this code.
If anyone feels like doing a review, let me know and I'll put together some basic instructions for setting up an environment and running the tests.

Overall I'm pretty happy with this solution. I've let myself slow way down, reviewing, resting, and re-reviewing this design until I've
become comfortable that I understand it. The tradeoffs it makes seem like ones that align with my values. I don't love this work pace
but I'm not feeling rushed--If I don't deliver anything else for a week or two it'll be fine. I try to only use the best 20% or so of my daily
working attention for this, usually a few hours in the morning. When I catch myself getting antsy, I usually switch to something else,
because that's not a headspace I trust for this work.

[^1]: nomenclature gets really screwy in this area. There is a cognito feature called "User Pools", which fulfills the role of an _identity_
      provider for my purpose here, but there's _also_ a cognito feature called "identity pools," which refers to a different kind of
      identity that I haven't yet found a reason to use. So any references here to a user identity should be understood as what cognito
      calls a "user" in a "user pool."

[^2]: authn: authentication -- verify _who you are_. authz: authorization -- determining _what you're allowed to do_. Cognito does authn;
      it means that when we're processing a request in cloudfront, we can verify that it came from e.g. Raphael Luckom. _Our_ application
      is responsible for authz itself; once we know that the request came from Raphael, the application needs to figure out whether Raphael
      is supposed to be allowed to do the requested thing.

[^3]: There's another interesting way to think about this price difference. From AWS's point of view, Lambda@edge functions are a _huge_
      upsell from regular lambda functions--the 1x / second example above is _three times_ as expensive as the same volume of regular
      lambda usage; even more once you factor in the free tier. Stay with me on this one: If I was employed by a BigCo and I was looking
      at those numbers for running costs, I might make the decision that the benefits, in terms of design simplicity, were not worth
      that kind of premium. But I _do_ think that, at a cost of ~$3 / month, that benefit _is_ worth it for an individual user. This may be
      an area where from Amazon's point of view, it could be _more_ profitable to have 300 million small customers, paying "premium" rates
      for edge functions, than a smaller number of large customers who can do their own auth stuff on a cheaper layer. Not sure if this
      idea really holds water, but it's a thought.

[^4]: The oauth client secret and the nonce-signing key would be located (in addition to within the auth functions themselves)
      in an S3 bucket object to which _no_ parts of the deployed system have access. The only thing that can access the terraform
      state is the system owner, plus the admin instance on which they run terraform to create infrastructure. The terraform documentation
      acknowledges that it may sometimes be appropriate to treat [state as sensitive data](https://www.terraform.io/docs/language/state/sensitive-data.html).
