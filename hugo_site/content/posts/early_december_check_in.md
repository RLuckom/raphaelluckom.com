---
title: "Early December Check-in"
author: "Raphael Luckom"
date: 2020-12-08T12:09:34-05:00
draft: false
---
**The Story So Far:**
In August I described what I've come to call [assertional making](https://www.raphaelluckom.com/posts/not_draft.html). At the time,
I thought that I would follow that path through crafts--maybe ceramics or sewing--to find both a quieter way of life for myself
and a pattern, accessible to anyone, for escaping exploitive labor conditions. But I felt my personal history hanging over my head
the whole time. "Right," my intrusive thoughts would say, "you failed as a programmer, so now you're going to find something else to
learn the easiest 80% of, claim you're being oppressed, and then leave _that_ in a huff." If, after five years as a programmer, I wasn't
able to build the system that _I_ wanted to use to sell ceramics or post my thoughts or talk to my friends, then why would I expect
to have better luck starting over with something else? What would it say about my idea of assertional making if I couldn't apply it
to programming, where I have the most skill? 

So my focus shifted, and I started to build myself a web system that reflects my values.
I read more widely about some of the [history](https://www.raphaelluckom.com/posts/internet_history_000.html) behind those systems
and the ideas like [privacy](https://www.raphaelluckom.com/posts/on_privacy_000.html) and [security](https://www.raphaelluckom.com/posts/on_security_000.html)
that I had previously examined only at a surface level. The first component I built was a [system for storing photographs](https://www.raphaelluckom.com/posts/early_november_check_in.html)
and publishing them online. On top of that, I started building the first little pieces of an instagram clone--still using only cheap,
generic cloud components. I had gotten as far as "ok, how should I add comments?" when I was introduced to the [IndieWeb](https://indieweb.org/),
community, which had already published a [suite of protocols](https://www.w3.org/TR/social-web-protocols/) to handle exactly the challenges I was facing.
After digging in to those materials, I further [refined my focus](https://www.raphaelluckom.com/posts/mid_november_check_in.html), backing
away from the instagram-clone idea and instead spending my time and [complexity](https://www.raphaelluckom.com/posts/complexity_budget.html) budgets
on taking advantage of the existing IndieWeb building blocks. For the past couple of days I've been working
on layout and styling for the next version of this site; today, the first big upgrade feels almost within reach.

My intrusive thoughts continue to remind me of the danger of this process--the way that altruism slowly transforms into self-interest. "Before,"
they say, "when you were trying to find a way that anyone could make a living, you were at least _attempting_ to make something for people
besides yourself to use. Now you're doing what, exactly? Is building this system actually helping anyone but _you_?" These thoughts are part
of why I write this blog. Even if the technical work that I'm doing doesn't go anywhere, these essays are their own kind of contribution.
And as my focus shifts, the type of useful information I can share shifts too. Today I want to write about reinvention.

There's a certain type of veteran programmer, visible in every software-writing community, who is not just resistant to change but
sees it as a direct insult to everything that has gone before. If only people would stop _reinventing_ things,
this person thinks, we could finally perfect the adequate tools we already have--make them better, make them cheaper, make them more reliable--
and then we could move on from this pointless and endless repackaging of the old to something truly new and useful. This person is first
a comfort to the beginner, who wants to believe that the currently-available learning materials contain everything worth knowing. They
are an antagonist to intermediate programmers, whose earnest attempts to make new things are so often the targets of their ire. To an expert
programmer, anti-change zealotry exists as an enticing choice--a way, now that a particular personal end has been reached[^1], of standing
against the whole world when it irrationally insists on continuing to move. Zach Tellman, in his beautiful 2016 essay [standing in the shadow of giants](https://ideolalia.com/essays/standing-in-the-shadow-of-giants.html)
captures the dynamic perfectly from a different angle:

> Another problem with the open source mythos is that we’re told communities just happen. If we write it, they will come. 
> But left alone, a community will be shaped by whoever shows up first, and most of the early adopters will be people looking 
> to leave their mark. Their chief values will be autonomy and productivity, and the culture they create will reflect that.

> Typically, this results in a small inner circle, often sharing the same physical location. Conversations will be informal, 
> unrecorded, and highly productive. Decisions will have a clear rationale to everyone within the circle, and seem arbitrary 
> to everyone else. This circle is typically composed of the people who showed up first. Anyone showing up too late, trying to 
> claim their own sliver of ownership, will be rebuffed without any clear recourse. These latecomers will typically move on, 
> in search of something less populated.

As Tellman observes, the social dynamics of this system have only the loosest association with whatever problem the technology was
supposed to solve. He identifies the idea of _ownership_, and the corresponding feelings of power and self-determination, as the
motivation that brings in "early adopters" and then turns them into gatekeepers holding the fort against those who "[show] up too late
[and try] to claim their own sliver of ownership." The _migration_, in Tellman's view--what I described above as the constant stream of
reinventions and repackagings of existing ideas--is explained by the human social[^2] processes through which technical communities evolve.

This has profound implications for anyone like me, who seeks to build new systems or re-form existing ones. Its biggest implication[^3]
is a warning against the belief that there is any missing idea which, once supplied by a gifted thinker, will be enough to repair the world.
That's not because someone has already had every idea--rather, it's because _having ideas_, and the feeling that comes with having them and exploring them,
is such a powerful human motivator that people would rather trailblaze, as an activity, than operate within the confines of existing systems, even
if those systems work well.

New social media systems--distributed and otherwise--have particular vulnerabilities to these dynamics. Since the people who build those systems,
and who use them earliest, are Tellman's "[people] who show up first," and whose "chief values will be autonomy and productivity,"
the community enabled by each system becomes a reflection of those values. When you find the meeting-place that any new social media experiment
uses for its social expression, you will never find it populated _mainly_ by ceramics enthusiasts, or by poets, or by sports fans. Those
groups may be represented, but the primary enthusiasm of the community as a whole will be _conducting social media experiments_. This
shared enthusiasm is then encountered by those who show up later, expecting that they may simply lay claim to a part of the new system, as a 
ceramics community lays claim to a facebook group or podcast fans lay claim to a subreddit. But this influx of people appears to the OGs as 
an invasion, dangerously bent on disrupting the focus of the community and preventing it from realizing its original values. The indignant 
reaction of these OGs to the perceived assault on their culture quickly turns into a reputation for eccentricity, elitism and insularity,
which further discourages new people from joining. Some of those new people may then go on to form their own experimental communities,
perpetuating the cycle.

So what is to be done about this? How can we build the systems that we want to use, if part of what we want is for people who are _not like us_
to want to use them as well? The question blurs into metaphysics, like the George Seferis quote[^4] "What can a flame remember?
If it remembers a little less than is necessary, it goes out; if it remembers a little more than is necessary, it goes out. If only it could
teach us, while it burns, to remember correctly." If our accessible-to-everyone systems are too recognizably _ours_, others won't use them. But if
they are not recognizably _anyone's_, like the internet itself, no one will defend them from colonization by the most powerful state and corporate landlords.
The obvious grammatical solution--that the most important and ubiquitous systems must recognizably belong to _each person individually_, to shape,
compromise, adapt, and defend, as they are moved--is much easier said than done. 


[^1]: That is, the end of the expert's ability to find what they consider to be _new_ technical knowledge, rather than repackagings of ideas they have previously encountered.
[^2]: And financial.
[^3]: like those unmistakably Taoist lines from Ecclesiastes, "What has been will be again / what has been done will be done again; / there is nothing new under the sun"
[^4]: The fan group of a moderately-popular podcast would vastly outnumber the active participants in any experimental social media system.
[^4]: From "Mr Stratis Thalassinos Describes A Man," translated from the original Greek by Edmund Keeley and Philip Sherrard
