---
title: "What if infrastructure is actually small?"
author: "Raphael Luckom"
date: 2021-03-31T11:45:22
draft: false
meta:
  trail:
    - systems
---

My least-favorite phrase to hear in a design meeting is "why didn't you just." It's an extremely
efficient phrase--it packs both a dismissal of a specific idea _and_ an insinuation of more generalized
incompetence into just four words, without being overtly offensive. I hate it. So it might be surprising
when I say that there is a "why didn't you just" at the very heart of my project now. I've had, if not a
front-row seat to the recent seasons of Extractive Corporatist Theater, then at least a box
with an unobstructed view and the potential for an invitation to the afterparty. And a lot of what's gone
through my head, looking at--well, a lot of things, but social media in particular--has been: these services
aren't good and no one really seems to like them. _Why don't people just notice that they're only using a couple
of really inexpensive services and buy those services directly_?

One self-interested reason to avoid saying "why didn't you just" is because one often looks like an idiot when the
reason is supplied. And after about 7 months of working, as a competent-but-mediocre practitioner, on finding a way to buy
"just" the services that people actually use in social media--well, let's say that I understand why the average
non-practitioner doesn't "just" set this up for herself one night after dinner.

That said, as an answer to the question, "why don't people just operate their own social media," the response "because
it's honestly too complex to set up" is kinda the best answer that someone like me could have hoped for. If the answer was,
"because people _like_ being surveiled and exploited," or "it's too expensive for the average person" or "it's not technically 
possible to buy these services in small quantities," then that might be a conversation-ender. But complexity is a matter of
packaging. A TV is complex. A cell phone is complex. The equipment required to produce a salable bag of potato chips is complex.
Nevertheless, these artifacts--by evolving into what I would call [almond-shaped systems](https://raphaelluckom.com/posts/almond_shape.html),
have made themselves broadly accessible and commercially successful.

So why hasn't this happened for hosted internet services like social media? There are three cultural reasons that I can see. First,
infrastructure is an afterthought in many software-writing environments. It is often, along with security and QA, considered
a "support role" without much visibility or social cachet. There is a sense that if you are too focused on infrastructure
then you must not be building the useful things[^1], so within software-writing as a practice, infrastructure tends to be overlooked.
The second reason is that "giving your customers something that they can own forever" is widely recognized as a terrible
business strategy--one example of this is how the Singer sewing machine company had a policy of destroying old machines
that it received in exchange for new ones[^2]. The third reason is the distastefulness, to people who might otherwise be interested,
of using the major cloud vendors, especially Amazon and Google, as suppliers. When you take these things together, you get
a situation where individual practitioners, motivated by creativity and interest, see this kind of solution as "enterprise-y" and unsexy, 
businesses, motivated by profit, see it as pointless or suicidal, and people concerned with social justice won't buy the argument
that, as a pragmatic move, using these services directly would vastly improve their negotiating power against the likes of facebook,
whose entire business model depends on a captive audience not considering alternatives. And I don't mean to say that these are 
unreasonable positions for any of those actors to take--as a practitioner, a person who understands both economics and sustainability,
and a person who cares about social justice, I can see how each social position--practitioners, businesses, activists--is drawn
to its particular conclusion. I can't argue with the conclusions within those frames; all I can do is suggest that those
frames are too limited for a solution to emerge solely within any of them.

I think of this as the problem of "perceived bigness." From an individual practitioner point of view, industrial-scale cloud services,
however cheap they may be in operation[^3], are just too big and unwieldy to want to use. For a commercial enterprise, the idea of
doing a bunch of work that is _designed_ to leave you without a guaranteed revenue stream is insurmountable. For activists, the distastefulness
of using massive corporations to oppose exploitative capitalism is too great to overcome, despite "using the adversary's size against them"
being the classic successful strategy of effective asymmetric resistance movements.

But what if the kernel at the heart of all of this is not big, but small? What if the thing that makes these systems too big
and enterprise-y for individual practitioners is demonstrably a matter of perspective[^4]? What if most of the complexity
that makes facebook a behemoth is not the complexity of _services offered_, but rather the complexity of _maintaining exploitative revenue streams_,
which we as users don't need or find useful? What if the moral concession, in terms of using huge cloud providers directly, is demonstrably 
much _less_ than the concession involved in allowing oneself to be monetized by those same corporations in the status quo[^5]? If those 
things are the case, and self-run services could be  _higher quality_ and _more efficient_ than centralized corporate services, then what 
we really need is not to meet the incumbents in pitched battle on their turf, but rather to provide an easy path for their captive audiences
to escape, like drilling a small hole at the bottom of a dam, and let time and pressure take care of the rest.

[^1]: to which I would respond that you could have saved the ancient Egyptians a lot of trouble if you explained to them
      that they really only needed to build the _outermost layer_ of the pyramids.

[^2]: Two sources for this that I trust are Tim Hunkin's [The Secret Life of the Sewing Machine](https://youtu.be/g_qLCdrbU78?t=1402)
      and [enthusiast reports](https://cegrundler.com/tag/sewing-machine/).

[^3]: It's the end of March, and my bill for this month of fairly consistend development is $1.86.

[^4]: Specifically, [this perspective](https://raphaelluckom.com/posts/the_cloud_is_just_a_server.html).

[^5]: I approach this assertion in two ways. First, there is an advertising metric called Cost Per Click. This is the amount that an
      advertiser can expect to pay a platform like facebook per click on an ad from a target consumer. A brief search for "facebook cost per click"
      suggests that "over $1.50 " is pretty common. That means that the cost of running _the entire system_ I'm working on is likely equivalent
      to the revenue facebook gets from a user clicking on two or three ads. And because CPC is not the only way ads are billed, it seems likely that
      using other metrics would produce similar results. 

      Of course, that analysis is about social media platforms, not cloud providers. Since I'm advocating _paying_ AWS, I shouldn't rely on
      "taking money away from facebook" as a balancing factor; those are not the same entity. But I believe that the overall use of cloud services
      (and their attendant social and environmental costs) would _decrease_ if people used these services more directly. When you start to see
      the amount of processing directed at [real-time ad auctions](https://en.wikipedia.org/wiki/Real-time_bidding), [large language models](https://www.washington.edu/news/2021/03/10/large-computer-language-models-carry-environmental-social-risks/), and
      generally creepy predictive analytics on huge user bases, it seems plausible to imagine that _most_ of the demand for computing resources
      in the world is second- and higher-order pursuit of revenue by large corporations, not actual utility to users. If users bought their own services
      at wholesale prices and denied a foothold to these exploitative processes, I doubt there would be such demand for computing in general.
