---
title: "Design Outline 001"
author: "Raphael Luckom"
date: 2021-04-11T20:18:22
draft: false
meta:
  trail:
    - implemetation-note
---

My overall goal is to assemble, out of the cheapest[^1] reliable[^2] components, a hostable[^3] single-user[^4] system
that provides its owner with _online agency_, broadly defined to include things like social media, payment
sending and receiving, document storage and composition, durable data backup, etc. 

I am working on a proof-of-concept system that fulfills the top-level requirements--cost, reliability, and hostability
at single-user scale--and provides enough of the intended feature set to demonstrate that implementing the _entire_ feature set
is feasible. That is, I'm building a set of foundational features--user management, logging and analytics, deployment, backups,
hosting and networking, UI--that will support my initial feature set and provide a clear path for adding subsequent features.
In this post I'm going to describe that foundation at a high level, making the case that it is effectively finished and most of the
remaining work is on individual features.

Im my earlier post, [Anatomy of a Web App](https://raphaelluckom.com/posts/anatomy_of_a_web_service.html), I asserted that
an average web service can be described in terms of six fundamental areas:

1. __Access Control__: certain data and capabilities are restricted to specific users.
2. __UI__: The system presents an interface that a non-practitioner-user can be comfortable using
3. __API and Domain Logic__: The system is set up to receive requests from a network (i.e. it has a
   URL that can be accessed from wherever the authorized users are likely to be), _and_ there is code
   on the server that handles incoming requests appropriately. In some cases that code is very simple,
   for instance, returning an HTML page like this blog post. In other cases it might be more complex, such
   as completing a monetary transaction.
4. __Application Data__: The system stores data for the user; things like posts, images, sounds, videos, etc.
   The most important of these are what I would call _artifacts of human attention_--things like photos
   and blog posts, which a person directly uses their time and attention to create. But there are other types
   of application data that are also important, such as receipts. Application data must be secure against loss
   and against unauthorized access.
5. __Logging__: The system stores records of everything it does that its owner might like to know about; it holds
   those logs for a reasonable period and they can be inspected by the owner.
6. __Analytics__: Certain operational metrics are shown to the user via a dashboard or other admin UI. These might
   include pageviews, system errors, likes on posts, etc.

I would also add _deployment_ to these points if I were writing it now. In the [practitioner-journey](https://raphaelluckom.com/posts/practitioner_journey_004.html)
series I've published instructions for deploying minimal self-contained systems, and specifically a [blog system](https://raphaelluckom.com/posts/practitioner_journey_004.html)
identical to this one. The deployment process that I outlined is to get an AWS account, start an instance with admin permissions,
and run the infrastructure-deployment tool [terraform](https://terraform.io) to set up predesigned infrastructure. At least two
non-practitioners have successfully followed these instructions and deployed the example systems. I do not expect to add
anything to the deployment process; that is, the eventual deployment process for the complete system will not be more
complex than the already-tested process.

In the following paragraphs I'll address each of the fundamental web service areas and describe how my system provides
them:

#### Access Control
The user-management is provided by [AWS Cognito](https://aws.amazon.com/cognito/), which is free for a single-user use case.
The access control for private site areas sits at the edge of the system. In a [previous post](https://raphaelluckom.com/posts/login_system_notes.html) I
described the implementation details of this system; in my [first post on testing](https://raphaelluckom.com/posts/on_testing_000.html) I described
how it works in a more accessible way. The basic outline is that Cognito provides OAuth2.0 endpoints, and a combination of built-in AWS functionality
and hosted access-control functions guard private site areas[^5]. Every forseeable piece of functionality I intend for this system can feasibly
make use of these security controls.

#### UI
Table stakes for an effective UI are basically two capabilities:

1. Ability to serve assets from URLs, including media, markup, and scripts
2. Ability to call server-side functions from scripts running on a web page.

For this system, assets are hosted using AWS S3 and delivered using AWS Cloudfront. Scripts in the browser can either use
system-specific server-side code (i.e. lambda functions I write) or they can get scope-limited credentials to interact with AWS services like
S3 directly. Specifically, I've prototyped hosting a private site, getting AWS access credentials, uploading images to S3 hosting, and
running log queries in the browser. These prototypes cover a broad enough group of use-cases that I'm confident that all the others I 
intend can be added.

#### API and Domain Logic
The blog system example in the practitioner-journey series demonstrates using event-driven lambda functions to perform all of the
system-specific server-side processing, while a content-delivery network (Cloudfront, in the case of AWS) provides basic file-serving
functionality. I've validated my ability to trigger events from the browser, and there are even published guides for things like
[video chat](https://aws.amazon.com/blogs/media/enabling-video-chats-using-amazon-kinesis-video-streams-for-webrtc/) through browsers,
which I believe could be made to work on pay-as-you-go terms. I've also looked into an integration with Stripe enough to be confident that
my existing combination of lambda and S3 would be sufficient to integrate payment processing. Various permutations of the existing code
used for access control could also enable private messages or content-sharing between friend or subscriber groups.

#### Application Data
My prototype demonstrates both a _feasible structure_ for application data and a _backup strategy_. Artifacts of human attention,
--text, media, etc.-- will be stored in S3. The prototype blog system I outlined demonstrated how text and images could be stored
in S3 in convenient forms. In the past two weeks, I've also made provision for backups: I've made a terraform module that creates
three S3 buckets in different parts of the world (I chose Canada, Australia, and Germany), monitors paths in other buckets, and replicates
anything added to those paths into deep storage in all three locations. I believe that this is comparable to the best backup
solutions currently available to consumers, and cheaper[^6]. Both of the data stores I use--S3 and Dynamo--are functionally limitless
as far as an average single user is concerned, so there's no chance of filling up a drive.

#### Logging and Analytics
The prototype generates logs from Cloudfront, APIGateway, and Lambda. All the logs from Cloudfront and Lambda are stored in S3 and can be
queried using SQL syntax. The logs from APIGateway are delivered to AWS Cloudwatch, Amazon's logging platform. I've prototyped a system for
moving logs out of cloudwatch and into S3, but I haven't found enough use for the APIGateway logs yet to make it worthwhile. All of the logs stored
in S3 have sensible expiration times, so they won't stick around costing money forever. This log system design allows arbitrary analytics
to be set up on the collected data; the metric I use most frequently is a query that shows me the plausibly-human[^7] traffic to this site.
Crucially, the logging system is defined centrally in terraform, so that each function and cloudfront distribution is told where to send its logs, and
given the appropriate minimal permissions needed to do so.

#### Conclusion
This foundation seems good to me. I trust these subsystems, and I feel like I have enough maneuvering room that I can implement whatever features
turn out to be required. At various points over the last couple of weeks I've been able to quickly implement things, or test out things, that would
have been more difficult without having this pre-work complete. I've had the nice experience of actually being able to use the work that Raphael-in-the-past
did to save myself some time.

The next challenges in this process are a bit different. I'm going to be working on individual features and use-cases, and I'm also going to be
thinking about how to plan out the life-cycle of this system--how to make sure that peope who deploy it will be able to get bugfixes and
upgrades without losing their data or being forced into changes they don't want. I'll probably be writing about all of those things in the next few weeks.

[^1]: I have two different goals in mind when I say "cheapest." First, I would like operating this system
      to be cheap in absolute terms; I hope that for an "ordinary" use case (i.e. not someone who is famous or
      otherwise gets an exceptional amount of attention) it should cost less than $3 / month to operate. I'm optimistic
      that that's an acheivable goal based on my work so far. But in case it isn't, my secondary goal is simply
      to discover what the actual lower bound is--that is, I want to demonstrate an example single-user system
      that provides equivalent capabilities to its owner as, say, facebook-plus-venmo, and _see_ what it costs
      to operate, where the challenges are and what opportunities exist for improvement.

[^2]: By "reliable," I mean that the system tends to operate without errors, and with no required maintenance,
      to a degree comparable to the ordinary person's experience of a hosted service like facebook. As a very rough guide, we can observe
      that facebook appeared to have [at least 24 hours](https://www.theverge.com/2019/3/14/18265185/facebook-instagram-whatsapp-outage-2019-return-back)
      of degraded performance in 2019, which would be 99.7% uptime. I think this is a fairly modest target; it's common to aim for
      99.9% or even 99.99% (service-level agreements are often described in "nines," where "one nine" means 99.9% and "two nines" means 99.99%).
      The greater reliability you want, the more you have to invest, in design time, operating cost, and maintenance. The [_error budget_](https://sre.google/sre-book/embracing-risk/),
      articulated very nicely in google's site reliability engineer book, is a tool for managing these tradeoffs. Basically, an error budget
      is a proactive decision to _accept_ a certain percentage of adverse events as a cost of operation, and to only spend effort on additional
      reliability work if the number of adverse events _exceeds_ the budgeted number. In the case of this system, many of the big ongoing risks
      are about the possibility that AWS services might go down. This seems to happen once or twice a year and the results are frustrating but
      temporary. I intend that this system should make a good-faith effort not to take on unnecessary risks of downtime, but I'm not going
      to lose sleep over "inability to operate when S3 goes down."

[^3]: By "hostable" I mean:

      1. An average non-practitioner should be able to deploy the system using a public cloud provider or some other means,
      2. For a non-practitioner, the deployment process _will_ be unfamiliar and require attention, but it should be 
         comparable to other unfamiliar tasks that a person has to do in a year; it should be less complicated than
         preparing a meal like Thanksgiving dinner, and not require professional help. Over time it should get easier.
      3. There will be as little required maintenance as possible. The system design should include _no_ scheduled maintenance--
         that is, there should never be a case where a hard drive can fill up and need to be replaced or extended, or any other
         component in the system has an expected-finite lifetime. However, it is inevitable that features, bugs and vulnerabilities will
         emerge that require periodic updates; these should be as infrequent and painless as possible.
      
      The goal of these points is to define hostability specifically in terms of the abilities of a non-practitioner. This system is
      explicitly required, as its highest priority, to _not_ sacrifice hostability except as required by security.

[^4]: By "single user" I mean that by default, the system is designed to have all the previous properties--cheap, reliable, hostable--when
      deployed by _one_ non-practitioner who intends to use it themselves. One of my favorite pragmatic guides to operating social media
      systems is [Run Your Own Social](https://runyourown.social/), by Darius Kazemi. He describes his experience running a version of the
      [mastodon](https://mastodon.social/about) social network software for a group of his friends, and offers realism and advice about what that
      entails. His top-line advice is that the type of communal social network he describes should have no more than 50-100 users. He says:

      > To draw from recent history, witches.town was one of the more popular Mastodon servers in 2017 and 2018. In mid-2018 there were a 
      > series of disagreements between the primary administrator and the users...about moderation policy, and also the primary administrator
      > (who I believe actually owned the server and its domain) said they were burned out on running the server. In the end, the site was shut down.
      > According to archive.org it had about 2400 registered accounts in April 2018, shortly before the instance was deleted. If we look at instances
      > of similar size today we can extrapolate that there were perhaps 500 active users on the server at the time it went dark...

      > I posit that 500 active, invested community members will not be able to achieve a values-based harmony or consensus. It's simply too big to
      > be possible. My assertion is not backed up by any studies I have read but rather my personal experience in online and offline groups of all kinds.
      > You cannot wrangle consensus from 500 people. With that many active, committed community members you will necessarily have at least a few dedicated
      > members who feel investment and ownership in the community who are also extremely unhappy with the direction of the community. 

      I see no reason to doubt Mr. Kazemi. It is _because_ I find this account convincing that I explicitly do _not_ want to rely on the economies
      of scale that arise when multiple users all share a centralized system. I trust that the 50-100 users number is approximately right for a single 
      instance, but I'm not sure how well it works for the users themselves. Specifically, I think that in any group of 50-100 people, some of the people
      will be _centered_ in the group--they'll have most or all of their social needs met by others in the group--and others will be _on the edges_--they
      will fit better in _that_ group than in any other, but their values and interests will not necessarily align well with the average within the group.

      However, in a system where each individual owns their own platform, such edge / center differences need not exist. Each person would establish
      connections proactively between their own site and the sites of people they like. Each person would be _centered_ in their own social group.
      As with the "hostability" requirement, the "single user" requirement is not intended to _prevent_ people from sharing access to these systems,
      but to ensure that the system is designed so that they don't _have_ to.

[^5]: Two AWS services provide this system's public API: Cloudfront, AWS's CDN offering, and APIGateway, its networking product for providing
      access to lambda functions and other services from the public internet. APIGateway includes a built-in security feature for validating OAuth
      authorizations such as those given by Cognito, while Cloudfront provides a way for system-designer-supplied functions to validate requests and
      guard access.

[^6]: In the US, Apple's iCloud backup solution costs $0.99 / month for 50GB of storage. The same amount of data stored in the system I've prototyped
      would cost around $0.67 (50GB replicated 3 times at $0.004 per GB per month). There are admittedly other factors to consider--the storage for the
      non-archival versions of the data (hopefully smaller), and a comparison between Apple's durability strategy (where the data is backed up and how)
      and mine.

[^7]: By "plausibly human," I mean that the user-agent is plausibly indicative of a person with a browser and that the requests indicate reading
      a blog post, as opposed to fetching an image. Traffic analysis is a deep rabbit hole; I believe in "good enough." I sometimes see groups of
      10-20 requests that get through my filter but are obviously not human (like visiting 20 sequential blog posts at a rate of 1 every 10 seconds).
      For now I just live with this.
