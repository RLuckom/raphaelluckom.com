---
title: "Early April Check-In: Potentials for Economic Networks Using Personal Social Media"
author: "Raphael Luckom"
date: 2021-04-04T09:45:22
draft: false
meta:
  trail:
    - check-in
---
One of my original goals with this project was to build a site that let me sell pottery and crafts,
and which could be set up easily by anyone for their own use. Historically, the ability to participate
in markets[^1] has been a major part of individuals' ability to determine their own lifeways[^2]. In this post,
I want to look at some ideas around sending and receiving payments, with an eye toward which ones might find
a place within this project.

Before I started building this system, I had used two other platforms for (trying to) sell items I made. First,
I used Etsy. I didn't make any sales and I was generally unhappy with it as a service. It felt like I would have
to do the same amount of marketing work to get people to visit my etsy store as I would have to do if I was hosting my own
site. If I was going to do all that work anyway, why not just set up my own site? Following that logic, I built a site
using Shopify. I quite liked using Shopify--it allowed me to customize my store in useful ways; it had sensible
screens for showing me the state of my account, and it gave me much more of a feeling of ownership than Etsy had; I
didn't feel like Shopify was obviously using the marketing effort I put into my site to promote its own platform.
But it cost $30 a month, and I made one sale, totalling $40, for the several months I used it. So my overall impression
was that it's a tool that may make sense for an maker who has either an established customer base or the time and
motivation to build one, but it's probably not a good first choice for casual makers who might sell a few things every year.

That category--"casual makers who might sell a few things every year"--is very interesting to me. For one thing,
it seems to be a very common category among makers. Before covid, when I was spending a lot of time in a clay studio,
there were a few people who put a lot of systematic effort into selling their work. These people would structure
their time intentionally; they would focus on making enough product to meet different selling events and seasons;
they would reserve space at markets and spend their weekends selling. It was a fair amount of effort, and while I never saw anyone get
rich that way, it seemed like many of those practitioners were satisfied and enjoying the process. But there was also
another group of practitioners, among whom I counted myself: people who occasionally produced something
good enough to sell, but who weren't ready to commit the marketing and organizational effort it would take to
reach profitability[^3]. For those people--some of us perennially on the edge of trying to sell our work systematically--there
seemed to be a kind of wall. I _thought_ my work was good enough to sell, but I didn't know if the demand would
be worth it. And if I wanted to test the level of demand, I had to put in what seemed like a lot of marketing effort
that might all disappear if I changed my mind or wasn't successful.

Another category of makers who don't seem to be well-served by existing payment solutions are journalists, educators, entertainers,
and others whose products consist of media like text, images, videos and sounds. For these makers there are subscription
services like Patreon, distributors like Spotify, and advertising platforms like youtube. I haven't used any of these to
try to make money[^4], but my understanding is that it's very hard for an individual--particularly one not yet established--to
build a substantial revenue stream using them.

My intuition tells me that this doesn't have to be the case. Specifically, if I imagine that I was directly charged
a small amount per item that I read, watched, or listened to--a penny or a fraction of a penny--and if most of that amount--maybe
anything above 70%--went to the person or organization who produced the content, then I think that person or organization would see more
revenue, per-view and overall, than in the current system where they're paid in what seems like a much less fair way[^5]. But in
practice, systems for what I would call _grassroots micropayments_--very small payments from one person to another--haven't emerged. One of
the reasons why not is transaction costs; the financial system includes some very effective gatekeepers whose prices per-transaction
are often in the tens of cents, making the lowest feasible transaction sizes fairly large[^6]. Another reason why not is
the perceived difficulty setting up such a system: would it be something like Venmo, where everyone can be both a payer
and a payee? How would we keep track of who owed what? Would you have to sign in on every device so you could be billed
correctly?

Notice how all of these questions are pretty easy to answer if we assume that you're running your own social media site.
Let's go through them one by one:

1. Would it be something like Venmo, where everyone could be a payer and a payee? Yes. a URI (for instance but not necessarily,
   a person's profile page) could be used as an "address" that money could be sent from or to[^7].

2. How would we keep track of who owed what? You would sign in once, to your site. In your feed, you would see items from
   everyone to whose content you subscribe. In order to get some of that content, your server would do a tiny transaction with
   the sites of those other people. And they might do the same when getting content from yours. Naturally, this would not be
   the _default_ type of interaction; just as now, most feed items between friends would not be monetized. But some people
   could offer content for sale to the public as well as for free. 

3. Would you have to sign in on every device to be billed correctly? Yes, but you'd just need to sign in to your own site. 
   As long as you view content through that interface, the content creators have a way to get paid--your site would pay
   them directly through microtransactions. You could connect to your site any way you want--on your phone, on your laptop,
   a set-top box. Doesn't matter.

What starts to become apparent is how _different_ the market might look to someone who has their own services on the network,
acting directly in their own interest[^8]. More and more of the tiny intrusions on one's personal life online would start to look
like robocalls--unhuman, unwelcome, and unnecessary. Another side effect of this structure might be fewer stores of aggregated
data about individuals[^9].

So what would it take to make that happen? I suspect that a network-hosted peer-to-peer system that was profitable for artists and small craftspeople
would need to be fairly dense--it would work best if it was as ubiquitous as something like facebook. You wouldn't want it to be centrally
run, and you _definitely_ wouldn't want VCs in the picture, so I don't think we're talking about a startup. It needs to be as close
as possible to a one-click install. It needs to be reliable and secure _even when operated by non-software-practitioners_[^10]. We
need to take precautions against forseeable second-order effects of people using the system; if we told everyone on Earth to buy
themselves a Raspberry Pi, I think things might go poorly. Big cloud providers demonstrably have that scale, though; they're already
hosting most of these services as they exist now.

I thought this post was going to be a description of the different types of payment processors I've found, but as usual I went
way off track and that will have to wait. And as usual, I'm glad for the opportunity to take that detour--it's an aspect of this
project that's fun to think about.

[^1]: Defined broadly, as "the way that a society tends to distribute resources."

[^2]: One example of this is that various emancipatory programs have focused explicitly on the rights
      of marginalized groups to own property. I'm trying to walk a fine line in this--I don't mean to
      assert that _capitalism_ is essential for self-determination. Instead, I mean to suggest that every
      society will evolve a system for handling competition over resources, and that one's ability to participate
      in that system on an equal footing with the other members of society is part of the society being equitable 
      overall. So _if_ a society uses capitalism, then I hold that it is strictly better for _everyone_ to have
      equivalent access to market services than for _some people_ to have privileged access. Whether capitalism is
      the _correct_ system is a question that I'd prefer to set aside in this conversation.

[^3]: A few practitioners might dislike the idea of giving people like that easier access to markets. In my time,
      I've heard several variations on the theme of "hobbyists giving away their work, or selling it too cheaply, make it
      even harder for professionals to make a living and appropriately set consumers' expectations." I'm sympathetic
      to that problem, but the implied solution, "discourage new people from participating except on terms acceptable
      to professional practitioners," strikes me as unpleasantly gatekeep-y. And within that perspective is a kind of
      defeatism--an acceptance of the state of affairs in which people who make products with human attention will
      always be competing for the table scraps left over by industrial production. I believe that state of affairs
      need not be the default, and I am actively working to change it. There _can_ be enough to go around, even if there isn't
      right now, and I think that working to increase the amount that goes around is a better use of my time than allocating
      existing pittances slightly more efficiently.

[^4]: I have a few videos on youtube but haven't tried to monetize them.

[^5]: The [market share](https://musically.com/2019/09/11/deezer-steps-up-its-efforts-to-introduce-user-centric-payments/) calculation
      according to which streaming services pay musicians seems pretty unfair to me. If we imagine that a streaming service only has
      two artists, me and another person, and then we imagine that my track gets 100 plays in a month, I would get paid a different
      amount depending on how many plays _the other_ artist's track got. Since artists then compete over market share for pieces of a
      total amount (capped by the service's subscription price multiplied by its subscriber count) individual artists aren't functionally
      able to set their own prices or even expand their audiences except by comparison to other artists. This is the kind of silly state
      of afairs about which someone eventually throws up their hands and says "well, that's just the way it is." Except there's no reason
      why it has to be.

[^6]: _Could this be a job for cryptocurrency_, I hear someone asking? No. Cryptocurrency is in Time Out. First, those things have insane
      ecological impact. Second, most of them process transactions _very slowly_. Third, they keep sprouting bugs that prevent them from
      delivering even the fairly modest features they are designed to have. There are likely some neat technical ways to meet the challenges
      micropayments present, but most of them probably don't involve a distributed ledger.

[^7]: This is a slight oversimplification. One solution (which I'm borrowing from the IndieWeb community) is that you would post a computer-readable
      link within the HTML served from the "address" URI. So you would go to a person's profile page, and there would be a link there, which
      your social media system could read automatically, which would say something like "My Venmo is @..." You would give your social media system
      the ability to pay others on your behalf. When you subscribed to content from a creator who charged for it, your social media system would go to
      their page, pay the subscription price (it could be monthly or per-item, doesn't matter) and then your system would be allowed to download the content
      to show to you. How do we prevent copyright infringement? Mostly, I don't think I'd try to. What we see from big copyright policing systems
      is that they mostly protect the interests of wealthy rent-seekers, not small creators. So copyright owners would need to go after infringers individually;
      they wouldn't be given a preemptive guaranteed stranglehold over all expression, as they are on big platforms like youtube.

[^8]: I'm not suggesting that these types of systems would escape regulation; they would not. However, I choose to believe that systems
      like this would connect people a little more closely to their own interests. For instance, I would expect that if this type
      of system ever became widespread, the payment processing industry would try to insert itself into every microtransaction, and that
      it would use some sort of fear-based campaign to push legislation allowing it to do so. I would _hope_ that, in a situation where
      enough people could _see_ that revenue being siphoned from themselves and their neighbors, it would be harder to obfuscate that type
      of rent-seeking. I understand that that may be a naive hope, but in any case I doubt things could get much worse than we currently see. 
      My point of reference for attempts like that--the [Eldred V Ashcroft](https://en.wikipedia.org/wiki/Eldred_v._Ashcroft) case in the
      Supreme Court, which supported an extension of the copyright term that Disney got from Congress because it was about to lose control
      of Mickey Mouse--suggests that in the current political climate, those attempts tend to be _successful_.

[^9]: This one could go either way, of course. If I'm sending a microtransaction for lots of the things I see on social media, then
      depending on how that system is structured, my payment processor might be getting a level of information I don't want them to
      have. I think there are some ways around this; this is where I'd start asking the formal methods and voting system design people
      if they could help out. This is an area where "being explicit about which tradeoffs we want to make" is more realistic than "finding a way
      to get everything we want."

[^10]: Like cars, cell phones, credit cards, chainsaws, blowtorches, fireworks, and all of the other useful-but-also-dangerous things we regularly
       sell to any adult with a pulse.
