---
title: "The Cloud is Just A Server"
author: "Raphael Luckom"
date: 2020-11-27T07:09:34-05:00
draft: false
meta:
  trail:
    - systems
    - cloud primitives
---

I reactivated my [twitter account](https://twitter.com/RLuckom) last week.
I don't really enjoy using Twitter, but I'll cheerfully acknowledge
the place it occupies in public discourse. For many communities in which I
want to participate, Twitter has justifiably outcompeted email and the phone system
as the venue where it's acceptable to start a conversation with someone you don't
already know[^1]. But just because it's obviously the best place to _start_ a conversation
doesn't mean it's the best place to _have_ a conversation[^2]. The message-length limits
and the futility of trying to create a shared context--replicating the kind of
smalltalk and emotional cues that keep IRL conversations from turning ugly--limit
my use of Twitter beyond the role of a kind of phone book for conversations and
participants.

I'd like to use this post to describe one conversation I've seen and add to it a little
context. The conversation is about How Best To Build A Website. It's perfect Twitter
fodder, because the correct answer depends entirely on context that can't be expressed
within the limits of a tweet. So, when the conversation happens on Twitter, everyone
chooses a side based on _their_ assumptions about the relevant context, and, from that
position, lobs arguments in the general direction of the other trenches. This dynamic
has all the fun and excitement of a good snowball fight, and the same probability of
advancing reasoned arguments.

Even in this kind of conversation, however, there are things to learn. I'd like to focus
on one snowball[^3] I recently saw whizzing above my particular trench. It's a video/gif
using Seinfeld to illustrate the complexity and uncertainty of trying to set up a website using
cloud services. Jerry wants to set up a simple blogging site for himself. Elaine has a static
site made with [hugo](https://gohugo.io/)[^4]; that's what Jerry wants. The customer service rep
smiles--of course! Nothing simpler!--and starts typing. Jerry chats with Elaine--he wants something
simple, cheap to maintain. He wants to publish from simple text files on Github[^5]. He wants
his site to stand up if his "500 followers on Twitter" all decide to visit at once[^6]. At last,
the customer service rep has found an option. It's got all the latest cloud technology, and
it's going to cost $7,590 per month. It runs on a container cluster[^7]. Jerry balks--a container cluster?
No! Just[^8] a place to store files where you can see them on a browser! Jerry doesn't need
any of an exhaustive list of buzzwords, and he knows--correctly--that his dream of publishing
recipes for sourdough bread on a blog shouldn't cost more than the price of a cup of coffee
per month. He says as much. The customer service rep looks at him pityingly, and delivers
the punch line: "You should just use Github Pages."

Let's focus on the real, true and indisputable message of this exchange: cloud services are currently
_too complicated_ for an outsider in Jerry's position to use wisely and effectively. I feel
very confident in that statement since no one who knows enough to contradict it is in Jerry's
position. The video gets that exactly right.

But it also conveys a skepticism about cloud services that's increasingly unwarranted. Let's
imagine an informed answer to Jerry's question. How do you set up a static site in the cloud?
The Amazon Web Services cloud offers [exactly this](https://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteHosting.html)
service. Google's cloud [does as well](https://cloud.google.com/storage/docs/hosting-static-website). So
does [Azure](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blob-static-website), Microsoft's cloud.
These services are _precisely_ comparable to the difficulty of putting a directory of static files
behind an Apache or Nginx server. And they are _cheap af_ (If you want to dispute this, as people sometimes do,
be ready to cite real-world use cases and do some math with very small numbers). The type of person who finds Github Pages simple but an AWS 
bucket complex is a software writer who's already familiar with git, but isn't familiar with
cloud orchestration tools. That's kind of a niche use-case--a non-software-writer would instead be drawn
to a service like [Medium](https://medium.com/), which provides similar capabilities with a less
wonky experience.

I see in cloud-skepticism a very similar pattern to computer-skepticism from before the 1990s,
and internet-skepticism from around 1993-2010. That is, the skeptics would say--accurately--that
first computers, and then the internet, would not be capable of _removing_ the complexity from
areas of human experience. The proponents of those technologies--at least, the ones who weren't 
trying to sell you something--would acknowledge complexity as a fact of life, but would argue
that computers and the internet should be evaluated carefully and fairly as tools that provided
previously-unavailable capabilities to their users. So it is with cloud technologies in 2020--they
are not _simple_ (and it's on people like me to fix that) but they represent--in availability, reliability,
safety, control, and cost--tools that have never before been practically available to small publishers.
We--people like me, who see a kind of Unix-y elegance in these tools--need to do a better job of making their good parts
widely available and stringing caution tape around some of the pointier hazards. But there's a lot
of potential, and it would be a mistake to discount it.

[^1]: There are good reasons for this. Phone conversations have a kind of immediacy that's unnecessary and uncomfortable for a "letter of introduction" scenario. Email solves that problem, but doesn't have Twitter's ability for conversations to smoothly incorporate unexpected participants. Whatever gripes I have with Twitter as a service, these are genuinely useful properties.

[^2]: When I use the word _conversation_ in this context, I'm not referring to a single exchange, like what might once have occurred at a restaurant table. Instead, I'm talking about some identifiable core topic that reliably provokes people to line up on one of some number of sides. In that sense, the conversation is something that can appear in any venue at any time, but it does not move forward reliably--the state of the conversation depends on the context of the people who are in the venue. This meaning of _conversation_ is very similar to the meaning of _debate_ in phrases like "the healthcare debate."

[^3]: this [video](https://twitter.com/DennisCode/status/1331695899672596480/video/1)

[^4]: Hugo is a _static site generator_. A static site is one where all of the pages are [static web pages](https://en.wikipedia.org/wiki/Static_web_page)--there is no application server generating pages in response to specific requests. This is possibly the simplest type of site to run, and it is the easiest to maintain. Therefore, static sites are very interesting as a way of getting non-technical people access to highly reliable internet publishing.

[^5]: [Github ](https://github.com/) is a website and online service for sharing source code. One [feature](https://pages.github.com/), popular with software writers, is the ability to _store_ a static site--as source code--in Github, _and_ have Github publish the site. A (deeply embarrasing and out of date) example of this is [my Github-hosted page](http://rluckom.github.io/), which is stored in [a code repository with the same name](https://github.com/RLuckom/RLuckom.github.io). It's worth pointing out that while this feature of Github is indeed an extremely reliable, cheap, and low-commitment way to publish a web site, it requires a familiarity with various coding tools ([git](https://git-scm.com/), [jeckyll](https://jekyllrb.com/docs/)) that have not yet caught on outside of software-writing communities.

[^6]: I think this might be both a joke and not-a-joke. 500 simultaneous viewers is peanuts as far as web traffic is concerned, so in one sense it's silly to talk about "scaling" to that number. On the other hand, there are some content management systems that it's tempting to deploy on underpowered infrastructure, because you need to set them up based on the amount of traffic you expect to get. In these systems, you would need to pay for the ability to handle 500 simultaneous viewers _all the time_, which can lead to high monthly bills. The alternative that static sites provide is basically a pay-per-request model, so if you get 500 requests one minute and 7 the next, your bill would be for 507 requests (rather than two minutes charged at 500-request-capacity). The cost-per-request is typically a very small fraction of a penny, on the order of $0.00001.

[^7]: Probably easiest to think of this as a whole network of computers working together. Expensive, complicated to set up and extremely overkill for a static site.

[^8]: The word "just" is a particular bugbear of mine, and the world would be a better place if system designers deleted it from their vocabularies. To refer to anything as _just_ x or _just_ y is a technique for disguising a context-dependent argument as a statement of fact. Democracy isn't complicated--it's _just_ a system for making decisions in a group. Healthcare isn't complicated--it's _just_ using knowledge about the human body to help people get better from stuff.
