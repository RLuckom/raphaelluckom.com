---
title: "Complexity And Motivation"
author: "Raphael Luckom"
date: 2020-11-25T20:00:00-05:00
draft: false
---

In previous posts, I've talked about some complex topics. I've also written
about the idea of a [complexity budget](https://www.raphaelluckom.com/posts/complexity_budget.html)
as a way of thinking about system design. Whenever I build something,
I pay close attention to the complexity that a user will see. Especially when
I expect that _I_ will be the user. This post is not going to focus specifically
on software; instead, I want to ask what kind of complexity it's 
_reasonable_ to ask the person using a system to deal with. 
To do this, we're going to look at some systems that are used by lots of people,
and try to decide how their complexity affects their use and effectiveness.

Let's start with an invention that is about as elegant and conceptually beautiful as they come:
the [rumble strip](https://en.wikipedia.org/wiki/Rumble_strip). Rumble
strips are patterns of depressions that cause vehicles driving over
them to vibrate, alerting the driver to a dangerous condition, such as
drifting out of a lane. A [study](https://rosap.ntl.bts.gov/view/dot/24883) 
of rumble strips in Montana in 2003 concluded that the best-case scenario studied--rumble
strips installed on the shoulders of interstate highways--reduced accident
occurence and severity by 14%, and prevented over _19 times_ as much
damage as they cost to install[^1].

We can look at the complexity budget of rumble strips in two contexts: installing
them and using them. The complexity of installing them--making regularly spaced
depressions in road surfaces--is very small. They can easily be installed in both
new roads and existing roads. They require no extra materials to be added to the road.
Their maintenance is limited to patching the road surface and infrequent sweeping to remove sand.
When it comes to _using_ the rumble strip--there's nothing like it. They are designed
to be usable by people who are _falling asleep_. What else need be said? The difference 
to a driver, between using a road with a shoulder rumble strip and using a road without one,
is nil. There is simply no cognitive burden. Since using the rumble strip requires
no investment on the part of a driver, it's not really possible to _not_ use them.
Rumble strips alert 100% of the drivers who drive over them, compared to "no
rumble strip."

We can find many examples of safety equipment that only requires a small
cognitive burden for a large benefit. Devices like seat belts and
helmets need a small investment of attention at the beginning of a trip, but
don't need constant attention to remain effective while in use. In [2016](https://crashstats.nhtsa.dot.gov/Api/Public/ViewPublication/812351),
seat belt use in the US was at 90.1%; it has been increasing since the 1970s
as a result of auto regulations and reminder features. Reminder features
include chimes that sound when the car is turned on, and in some cases restrictions that don't allow
the car to be shifted out of park until the seatbelts are fastened. We can
look at these measures as introducing a competing cognitive burden; fastening
your seat belt is less of a hassle than dealing with the alternative. This gives
us an interesting point of comparison--when we go from something that's completely
passive and unavoidable (rumble strips) to something that shouldn't be avoided
and is sometimes difficult to avoid but can be avoided if you try hard enough, we _still_ lose almost 10% of people. Some of them
are probably in vehicles without reminder systems, but others are probably ignoring
the reminders[^2].

We've seen two examples of systems that are extremely simple to use and highly
effective and cost-efficient. We've seen that if a system is at all avoidable,
a small-but-disturbing percentage of people will deliberately avoid it, even
if that means putting themselves at risk. So far, the evidence tends to support
the great philosopher B. B. Rodriguez when he [describes humans](https://morbotron.com/meme/S01E05/1171951.jpg?b64lines=IEh1bWFucyBhcmUgbm8gdGhyZWF0CiB0byB1cy4gVGhleSdyZSBzdHVwaWQsCiBwdXRyaWQgY293YXJkcy4=)
as "stupid, putrid cowards." For system designers, this is a bit of a low point.
Against those kinds of numbers, how could we hope to design _any_ system
that both 1) does something useful; and 2) won't trip any of the hair-trigger
heuristics people have for refusing to do things that require them to think
or expend effort?

For a surprisingly optimistic answer, let's look at an example of an internet technology
that is both conceptually complex and widely used. In August of 2007, a software engineer
named Chris Messina, working at a well-known social media company, posted a 
[blog entry](https://factoryjoe.com/2007/08/25/groups-for-twitter-or-a-proposal-for-twitter-tag-channels/)
describing a feature he thought people would want to use. It was something between
a friend-group and what [IRC](https://en.wikipedia.org/wiki/Internet_Relay_Chat) and other
chat programs call a _channel_. He described its benefits this way:

> Every time someone uses a channel tag to mark a status, not only do we know 
> something specific about that status, but others can eavesdrop on the context 
> of it and then join in the channel and contribute as well. Rather than trying 
> to ping-pong discussion between one or more individuals with daisy-chained @replies, 
> using a simple #reply means that people not in the @reply queue will be able to 
> follow along, as people do with Flickr or Delicious tags. Furthermore, topics that
> enter into existing channels will become visible to those who have previously joined
> in the discussion. And, perhaps best of all, anyone can choose to leave or remove 
> topics that don’t interest them.

This was the beginning of the Twitter [hashtag](https://en.wikipedia.org/wiki/Hashtag#Origin_and_uses). Or, it _sort of_ was.
At first, Twitter didn't treat hashtags differently than other text--they were simply a convention
people used to indicate topics, keywords, conversations and events. This use became widespread,
and in 2009, Twitter began formatting hashtags within tweets as links pointing to the search results
for the hashtag. Another way to say the same thing is that the hashtag, as a feature of a social
network, _fell into Twitter's lap_. A creative engineer thought of a cool idea, the company didn't
invest in in for _two years_, and during that time the people using the service kept it alive,
establishing it as a convention that would become not only a defining feature of Twitter,
but one of the most basic parts of internet speech. 

Let's use a thought experiment to estimate the cognitive load of hashtags for early users. First, try to 
define "hashtag" in a way that seems accurate. Go ahead, read Chris Messina's blog post. Look at the Wikipedia
page. Ask people you know how _they'd_ define it. Now imagine that you're trying to sell that idea to a
product manager in 2007, before there are any examples of it in the wild. Imagine trying to explain
why that product manager should have faith that the social-media-using public will not just
_understand_ that system, but will use it so enthusiastically that it acquires meaning even
in offline use. Do you have _any_ chance of convincing her to spend her team's time
on an idea that relies so heavily on the creativity and comprehension of people who use social media?
Of course not. And yet all of those expectations would have been justified.

I honestly don't know what made the hashtag successful. I'm not sure I _can_ know, because I can't
project myself back to a world where it doesn't exist. There are a couple of obvious things to notice, though:

1. There's nothing more to a hashtag than meets the eye. If you've seen a 
   hashtag you can make a new one, in a way that isn't true of something like a website. 
2. Even if you don't know what a _hashtag_ is, you can understand part of its 
   meaning as long as you understand the language. Once you see that `#` denotes 
   _some_ modification of a recognizable term, the ordinary process of humans creating language will keep
   it going if it's useful. 
3. It didn't require sponsorship, permission, or any infrastructure that didn't already exist. 
4. It's useful at any scale--if Chris Messina and his friends were the only ones to ever use it, 
   it still would have done its job enriching their conversations with searchable keywords.

I really hoped that by the time I got to the end of this, I'd have some insight about
when people will rise to meet the complexity of a new idea. Specifically, I wanted
to be able to articulate why it's a mistake, when designing a system, to always
make the most pessimistic assumptions about people's abilities and motivations. 
Sometimes that pessimism becomes a self-fulfilling prophecy, as people who feel
patronized by pessimistic assumptions act out their resentment by working against
the system. Conversely, sometimes ordinary people will enthusiastically embrace
wonky ideas if you give them a flexible UI and a tiny suggestion. Sometimes
people will surprise you.

[^1]: The linked report includes a description of the formula by which the economic cost of accidents--including injuries to people--is calculated. The idea of assigning a dollar value to injury and loss of life is grim, but I think there's a good case for trying to measure the effects somehow, even if it's necessarily imperfect.

[^2]: We could probably also assume that some of that 9.9% of people who don't wear seatbelts are those whose resentment for being told what to do is so strong that they'll put themselves at risk just to spite authority. It's fair to consider _that_ a dimension of cognitive burden as well.
