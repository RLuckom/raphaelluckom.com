---
title: "Mid April Check-in"
author: "Raphael Luckom"
date: 2021-04-17T13:26:00
draft: false
meta:
  trail:
    - check-in
---
It's the middle of April, and I'm watching a sullen freezing rain come down on the mulch beds,
where some enterprising hyacinths came up a week ago, bloomed, and promptly fell over.
I'm in housekeeping mode again. Every time I make a new entry in the [practitioner-journey](https://raphaelluckom.com/trails/practitioner-journey.html)
series, it takes at least a week, after I think the work is complete, of tidying up--removing
redundant or unused pieces of code, improving the flow of configuration data through the system
so that the [control surface](https://raphaelluckom.com/posts/almond_shape.html) is as sensible
and uncomplicated as possible. I imagine it as a kind of tree diagram, but built from the bottom instead
of the top, so that at each new layer there is a step of gathering threads from the previous layer
and binding them together.

This way of working is difficult with more than one person. I find that collaborations work best when each
participant has _local control_--when they are free to use the means, techniques, and designs most comfortable
to them to achieve their assigned goals. This puts a lot of pressure on the system designer to get the
interfaces between components exactly right on the first try--ideally, you would specify how each subsystem
behaves, and then let individual software writers or teams go off on their own and do the work, using their
deeper understanding and perspective to solve the challenges that arise in the most locally-appropriate way[^1].
But when you build from the bottom up, you can't exactly know what the top of the tree is going to look like,
so it's hard to give subsystem writers good requirements. I've tried to build like this in corporate environments,
and I've come to the conclusion that it's not really fair if there are more than one or two people involved.
There is too much risk, at the "gathering threads" step, that someone's contribution will turn out not to fit quite
right, and need to be rewritten or discarded. This isn't a matter of skill or understanding--even when I'm building
by myself, I sometimes undo in a week much of what I did the previous week. And it's not a bad thing; any software writer
will tell you how satisfying it feels to delete code that isn't needed anymore. But when you split up this dynamic
among multiple people--when the person who decides to delete or restructure the code is making that decision about
someone else's contribution, internal tensions arise that are very difficult to mitigate. And the flexibility those
decisions require--the ability to about-face on something that seemed critical yesterday--carries a high cost for
people in leadership roles, whose most in-demand service is protecting their teams from just that kind of uncertainty.

If this is a problem for practitioners trying to work together, it's a much worse problem when building for
non-practitioners. If you've built a system on the promise of minimal maintenance, but each upgrade is a slog
through pages of fiddly and risky adjustments[^2], you quickly burn through the patience and goodwill of even the
most indulgent non-practitioners. Not all types of collaboration are vulnerable to this failure mode--things like
soliciting feedback and offering perspectives--the work of determining the _values_ of the system and the alignments
between those values and its design--can often effectively run in parallel with this bottom-up approach, even with
many participants.

The best solution to this problem that I've found so far is: when you plan to use a bottom-up approach for some piece
of a system, try to define it as explicitly as possible and do _not_ invite collaboration until that part of the system
stabilizes. So far that's been my strategy with this system; I haven't invited code contributions from practitioners[^3]
yet, because I couldn't articulate exactly what I wanted or how I expected such contributions to integrate with what I was doing.
Likewise, I haven't offered any of my published designs as suitable for daily use and reliance by non-practitioners; I
can't realistically commit to the level of operational smoothness that is my standard for such things. Instead, I've published
my partial designs as exercises for people interested in understanding this work, and as a way to test the transmittability
of my deployment system.

I'm beginning to feel that the "bottom-up" stage of building this system may be coming to a close. In my most recent
[design outline](https://raphaelluckom.com/posts/system_notes_001.html), I was able to convince myself that I was within sight
of the basic system elements I outlined in my [Anatomy of a Web App](https://raphaelluckom.com/posts/anatomy_of_a_web_service.html)
post--the utilities and capabilities required as part of a functioning system, regardless of the system's intended purpose.
With the end of this phase comes an opportunity to revisit the potential for collaboration, and the feasibility of providing
system designs that can be relied on by non-practitioners.

Over the next few weeks I'm going to be working on this (hopefully final, for this phase) thread-gathering exercise. There are
four subsystems that I haven't yet released in any exercise that will all have to be included in the next exercise: the visibility
subsystem, the user management subsystem, the archive subsystem, and the admin site subsystem. Once these are ready for release,
I will be able to combine them with the blog subsystem from the last exercise to demonstrate a sustainable complete solution. 
And with _that_ done, I'll have a good perspective on what interfaces can be provided for other practitioners to contribute
their own work.

[^1]: The opportunity to freely make decisions about local appropriateness, and to observe (and have to live with)
      the results of those decisions, is a prerequisite for learning system design. Leaders who deny this opportunity
      to their teams, and _especially_ those who deny it to beginning practitioners, do a deep and lasting disservice
      to software-writing communities and the societies that live with their products.

      This conversation is not complete, however, without an acknowledgement that "local appropriateness" can _also_
      be used to disenfranchise members of oppressed groups. For an example of this unique combination
      of scurrilous bad faith, casual dehumanization, and petty jealousy, we can refer to "A Call For Unity"([PDF](https://web.archive.org/web/20181229055408/https://moodle.tiu.edu/pluginfile.php/57183/mod_resource/content/1/StatementAndResponseKingBirmingham1.pdf))--the
      open letter published by Birmingham clergy against the civil rights demonstrations conducted there in 1963:

      > We further strongly urge our own Negro community to withdraw support from these demonstrations, and to unite locally 
      > in working peacefully for a better Birmingham. When rights are consistently denied, a cause should be pressed in 
      > the courts and in negotiations among local leaders, and not in the streets. We appeal to both our white and Negro 
      > citizenry to observe the principles of law and order and common sense.

      The response to this was Dr. King's famous [Letter from Birmingham Jail](https://www.africa.upenn.edu/Articles_Gen/Letter_Birmingham.html),
      which is, as far as I'm concerned, the last word on this malicious usurpation of virtue and misrepresentation of locality.
      That the work of software writers is technical, and its social impacts far removed, is no excuse, at any level, to ignore this.

[^2]: that is, changes in how the things you've _already installed_ so that they work with the things you're
      _trying to_ install.

[^3]: I've repeatedly invited contributions of perspectives on the values I'm proposing. I've gotten comparatively few,
      and the ones I've had are from fairly close to my own perpective. So I wouldn't describe it as a great success.
