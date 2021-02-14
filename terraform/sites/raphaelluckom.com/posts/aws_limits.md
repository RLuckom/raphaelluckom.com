---
title: "Postmortem: AWS Certificate limit"
author: "Raphael Luckom"
date: 2021-02-13T21:06:34
draft: false
meta:
  trail:
    - postmortem
    - practitioner-inn
---
One of my main principles in this series is pragmatism--while I have technology preferences[^1], I want to
be realistic about what decisions are based on _values_ and which are based on convenience. Part of that means
acknowledging problems and risks that arise in the process. About a month and a half ago, I wrote a post about
[cost overages due to excessive logging](https://raphaelluckom.com/posts/postmortem_000.html)[^2]. I've been 
largely stalled for a few days waiting for an AWS limit increase, so it seems like a good time to log the
experience and notice some surrounding issues.

On Wednesday, I was testing a terraform configuration when I got the following error:

![error reading "Error: Error requesting certificate: LimitExceededException: Error: you have reached your limit of 20 certificates in the last year."](/img/postmortem/002/limit_error.png)

This error means that I've exceeded one of AWS's [quotas](https://docs.aws.amazon.com/general/latest/gr/aws_service_limits.html).
AWS quotas are limits on the amounts of different services you're allowed to use. Some are in place to protect inexperienced people
from making expensive mistakes; some are to protect AWS's services from excessive unexpected load, and most are a combination of the
two. Many limits, but not all, can be extended if you open a request on the [service dashboard](https://console.aws.amazon.com/support/home#/).
Early Sunday morning I got an email that my request had been approved.

The specific quota that I exceeded was the quota for the number of certificates I have requested in the last 365 days. The [stated quota](https://docs.aws.amazon.com/acm/latest/userguide/acm-limits.html)
is 2000 certificates, but the current quota seems to _actually_ be set at 20 certificates. We use one of these requests each time we set up and
tear down a hostname--a web location like `raphaelluckom.com` or `auth.raphaelluckom.com`. Certificates are critical to the security
of these services.

AWS _often_ approves limit increases, but they don't _always_ approve them. They don't publish a list of reasons why requests
can be denied, but they seem to consider the nature of the limit (some limits are extended automatically), the age of the account,
and, potentially, the profitability of the account. Frontline support or automated systems handle the more easily-approved requests,
while the rest need to be passed to the teams within Amazon that handle the relevant service. Certificate quota requests are
handled by the Amazon Certificate Manager (ACM) team on a case-by-case basis. I'm not sure how long they usually take, but mine
took about 4 days (and was completed on a Sunday, which surprised me).

This is one of the realities of being a small customer of a large cloud provider, and it's something that should inform
our service design. In the first place, I'm going to be thinking about how to not recreate certificates. This system doesn't
_need_ more than a single-digit number of certificates; I hit the limit because I've been setting things up and breaking them down
repeatedly. More generally, we should acknowledge that using cloud providers also means being subject to their rules
and decisions, often without any recourse. As deliberately small customers, we shouldn't plan to be able to get issues
like this resolved quickly or in our favor[^3].

To summarize the immediate situation: there's a limit on the number of certificates a new AWS customer can make. I need to
account for that in the system design and in exercise design. Seperately, I hit the limit in the account that I use
for development, meaning that I haven't gotten too much done for the past three days and, had the limit not been increased, I'd
have had to come up with a workaround. In the accounting of the pros and cons of using AWS, this specific experience goes
in the "con" column. If experiences like this one accumulate, or if they add complexity to the installation path for new
practitioners, it will be worth exploring other options.

Longer term, we should think strategically about the dynamics that control our access to these capabilities. When possible,
we should try to be "easy" customers for cloud providers to have[^4], because we're (hopefully) not going to provide them
too much revenue. Beyond that, there are well-understood techniques by which lots of individually-small stakeholders
can collaborate to achieve collective goals. From a pragmatic point of view, it's worth exploring any promising ideas.

As far as my overall plan is concerned, I'm not too worried about this. One reason I'm building with terraform is that it
can create infrastructure in a huge number of different [public cloud providers](https://registry.terraform.io/browse/providers).
There's some risk that I'll have to reorganize things I've done so far, and it's a little frustrating to be spinning my wheels
this week instead of making forward progress. But that's a fact of life, and it's given me time to pick up a few interesting
hobby projects, about which more later, maybe.

[^1]: I like AWS, I like circa 2015 Javascript (before promises; don't @ me), and I like terraform.

[^2]: since fixed.

[^3]: This is a pragmatic "shouldn't," meaning that we should not _plan_ on having good support from AWS. It's not a
      comment on what we ought to expect as customers. To be honest, what _I_ usually expect as a customer is that things
      will mostly work most of the time, but there are always going to be occasional outages and rough edges no matter where I go.

[^4]: A few hours after writing this, I keep coming back to this sentiment. It troubles me, because I can read it as a kind
      of scolding. I don't exactly mean it that way. What I mean is that, when we are engaging with a supplier in good faith,
      we should think realistically about the deal we're trying to strike. In this case, with AWS, the $2 / month we're offering 
      is not enough to cover the cost of one-on-one support to guide us through cloud architecture and system design. The only way
      that kind of support _might_ be realistic at that price point would be to vastly limit the variety of things we can do,
      so that the support organization could focus its effort on a smaller area. But the point of this series is not to
      goad yet another tech company into building one or another type of service--it's to build critical understanding of these
      systems _outside_ the context of tech companies. To achieve that goal in the near term, we can't rely too much on the explanatory
      apparatuses of our suppliers, which is what a support organization is.
