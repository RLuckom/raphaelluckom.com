---
title: "Deciding What Comes Next"
author: "Raphael Luckom"
date: 2020-12-19T16:06:34
draft: false
meta:
  trail:
    - check-in
---

When I quit my last job in August, I was feeling burned out. Part of that feeling, for me,
was the fear that I might be fundamentally unsuited to life as a human. It had been about 12
years and eight jobs since I'd started supporting myself after college. In each job, there had come
a moment when the illusion of meaning had become unsupportable--when I could no longer believe
that I was contributing to anything besides some powerful interest's quest for advantage and enrichment.
And yet, each time that moment came--every time I looked bleakly down the next 30 years of my professional
future and couldn't stomach it--the odds increased that the problem was me, and not the world. That
self-doubt added a layer of pressure and suspense to my decision. Would it turn out, when I was 
finally on my own, that I had never been anything other than a parasite, coasting on dissipation 
and unearned privilege, useful only as ballast on one side or other of a culture war?

The reason that I am writing this now is that I'm trying to decide on the next place to focus my attention. The
milestone I reached on Thursday--hosting this blog using my own tools--has removed some of the pressure I felt
to prove myself as a non-impostor writer of software. There are plenty of areas for improvement, but none of them
quite rise to the level of threatening my self-image as a competent maker of things. Since there is no single thing
that my insecurity is directing me to do, I have been writing down every option I can think of for the last few days.
I'm going to describe some of them here, both as a reflective exercise and as an invitation for your thoughts.

The most obvious set of things I could do next is to fix the million little rough edges in this site. Things are
misaligned, I somehow managed to get "single column of text" to not display well on mobile, the feeds are still
using markdown instead of HTML, there's no "home page" to speak of, etc. Some of those things are irritating me enough
just thinking about them that I'm sure I'll find a moment to clear them up. Others--like spending time crafting a home page--
feel like things that I would be doing for appearances. I find that there are certain "best practices" which, if I try to satisfy
them too early in the process of learning something, are harmful to my development[^2].

Another direction I could take would be to package up what I've made into a form that others could use. That would
involve restructuring some of the code, improving my test framework and writing a number of tests, writing a lot
of documentation, and committing to support at least the first few people who decided to give it a try. It would also
mean potentially calling a halt on new feature development for the sake of consolidating what I have already. The decisions
I'd need to make as part of that effort would have lasting consequences, because once software gets out in the wild,
making big changes to it risks angering people using the original versions unless the upgrade to the new version
is both technically easy and ideologically compatible with the original. So far, no one is beating down my door
wanting their own instance of this system, so I'm unlikely to make packaging it my primary focus[^3].

There's one other big category of technical work that I could choose to take on: adding new features. I haven't
yet integrated indieweb innovations like [microformats](http://microformats.org/wiki/Main_Page) or [webmentions](https://www.w3.org/TR/webmention/),
which I'm excited to do now that I have this base of functionality. I'm also interested in building the kinds of fun
[interactive visual components](http://rluckom.github.io/jsGameOfLife/) that I've always loved. And other efforts--like
finding a way to integrate payment processing, so that independent creators could use a system like this as a storefront--
seem like they'd be valuable ways to contribute to the world.

One of the less-technical directions that I'm considering is to take a little time to focus on different arts and crafts.
A friend recently commissioned me to sew her an embroidery organizer after seeing one I made for my wife. I find those kinds
of crafts to be highly emotionally fulfilling, and it would help to ground me and give me a fresh perspective if I took a break
from this kind of system design to do more artistic work. If I started to find success at something like that, it would also
help me prioritize the remaining work I have to do here, since I would have use cases (product display, selling) to support.

Finally, one of my [recent posts](https://raphaelluckom.com/posts/early_december_check_in.html) got me thinking about the difficulty
of meaningfully involving communities that aren't primarily technical in work like this. The basic thought here is that "alternative social media"
_already exists_ in a wide range of forms, but none of them has attracted adoption on a scale that meaningfully threatens 
corporate social media. I believe that many of the reasons for this lie outside the field of computer science, and that if
I want to try to solve them, I'm going to need to study the works of social scientists, philosophers, activists, and advocates,
and find ways to ask other users of social media directly about their values and experiences.

I didn't write this to pave the way for a decision that I've already got planned--I'm probably going to spend the next couple
of weeks pinballing back and forth among all of these options until something clicks and grabs my attention. Please feel free to
get in touch if you have thoughts or questions, especially if there's something you'd be interested in collaborating on.

[^1]: These titles appeared on my various employment agreements; I give them here without confidence, endorsement, or further comment.

[^2]: Sometime I hope to do a series on throwing pottery, because it's one of my favorite physically-embodied art forms.
      There are several practices in ceramics that I deliberately ignored while I was learning--things like properly
      wedging my clay, compressing the rims of pieces I was throwing, and using various measurements to do things consistently.
      I started out by rejecting each of those practices, and then eventually incorporated each one into my process when I came
      to see its benefits. If I had adopted them from the beginning because I was told to, I doubt that I would have the
      deeper, internally-consistent understanding of the practice that I have today.

[^3]: One of the pieces of wisdom I was given by a good friend and manager is to pay attention to whether a task is likely
      to get harder if I wait until later to do it. There are some aspects of system building that _do_ get harder if you
      procrastinate--if you get too far ahead of your tests, or if you let a system grow too long by accretion without 
      forcing yourself to redeploy it from scratch--then it gets much harder to catch up later than it would have to do it right
      in the first place. So there are aspects of the "packaging" work that feel high-priority regardless of whether I actually
      think anyone else is interested in using this _now_.
