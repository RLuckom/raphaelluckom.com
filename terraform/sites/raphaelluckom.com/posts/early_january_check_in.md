---
title: "Early January Check-in"
author: "Raphael Luckom"
date: 2021-01-10T17:07:34
draft: false
meta:
  trail:
    - check-in
---
I try to do at least two of these check-in posts every month. They offer a chance to
reflect on how I've actually been spending my work time, and let me revise and restate
my goals.

The beginning of January has been about focusing outward. I left 2020 writing posts about
[how I see my role](https://raphaelluckom.com/posts/my_role.html), [my teaching goals](https://raphaelluckom.com/posts/toward_legible_computing.html),
and a proposal regarding the [values social media should reflect](https://raphaelluckom.com/posts/on_security_001.html).
All of these posts share a basic premise: the fastest path to better social media is for
each person to commit a small amount of their time and effort toward building it. Because I'm not
the first to use this argument, I need to back it up with specifics if I want to be taken seriously.
I started doing so in my second post of 2021, in which I introduce my [practitioner journey](https://raphaelluckom.com/posts/practitioner_journey.html)
series--hands-on exercises that guide people of any skill level through the process of setting up their
own cloud services. 

The first post in the practitioner journey series was a whirlwind tour of setting up an AWS account,
preparing a development environment, and using terraform to create the infrastructure for a minimal 
static website. I once worked with a project manager who described this as the "steel thread" approach
to product development--using the analogy of building a bridge between two mountain peaks, we want to
start with  _something_ that works end-to-end and improve it. In this case, the first piece of end-to-end
functionality is a plausible way for anyone to deploy any service that can be built using terraform
and AWS. It's not as friendly as it needs to be, and we still need to build the actual services for everyone
to deploy. But it was a useful two-day effort, laying foundations on which I'm excited to continue building.
I hope that people will try it out for themselves and come along, but that's out of my hands.

This is also a good time to look a little farther out at the specifics of the systems we're going to build.
I'm going to use the rest of this post to sketch out what I see as the important areas:

#### Account Housekeeping and Analytics

Since everyone following along is going to need an AWS account[^1], we should build ourselves some
guard rails against the foreseeable risks. The first will be defending against cost overages
by creating alarms to notify us if our bills start to grow above a small amount. Over time, these alarms will also
be able to trigger more direct actions, like automatically shutting down out-of-control processes.

Besides needing guard rails, managing our own infrastructure means that no one else will be able to
tell us how well it's working. This function is called _analytics_ or _visibility_. One common way for
independent sites to meet this challenge is by using third-party trackers, like [google analytics](https://en.wikipedia.org/wiki/Google_Analytics).
The advantage of these solutions is that they are simple to deploy and provide useful data. The disadvantage,
which is disqualifying in our use case, is that they invite the advertising surveillance apparatus of the big
social media companies into our independent sites. We're going to play this one by standard vampire rules: never
invite them in. Self-hosting useful analytics using only the cheapest cloud components is going to take me a
little while, but that's my job these days. I've been looking at that challenge in the background for a
few weeks, and I'm not worried.

#### Core Capabilities

Existing social media platforms have done a pretty good job of identifying a small set of necessary features
and a slightly larger set of pathological cases to avoid. In no particular order:

1. **Authentication between personal spaces.** We are proposing to shatter a service like facebook into individually-hosted
   services owned by each user, so we can't take one unified login system for granted. Instead of logging in to one
   central site and interacting with our friends' pages on that site, we need a way to distribute varying levels of
   access within a constellation of independently-operated systems. As I've claimed before, [indieauth](https://indieauth.net)
   was designed exactly for this use case, so the way is pretty clear.
2. **Media organization and distribution.** One of the basic features of every social media platform is simply _storing and distributing_
   things like text, images, and videos. A useful self-hosted alternative needs those capabilities as well. In the case
   of big media files, like video, it's common for independent sites to use embedded players and host their video
   on platforms like youtube and vimeo. I think we can do better. Video content-delivery pipelines are a mature
   technology [available on pay-as-you-go terms](https://aws.amazon.com/mediaconvert/). If it's possible for anyone to have
   this capability themselves at the expense of me doing a couple of weeks of work to package it all up, that's a pretty
   good deal.

These capabilities and others form the underwater part of the iceberg--they will take a while to get right and for most
of that time it'll seem like not much progress is being made. Once they reach a certain critical mass, things will start to happen
_fast_.

#### Outreach

As social media practitioners, we need to reckon with the failure of this profession to treat non-practitioners
with respect. That doesn't just mean providing free access to the things we design and build--it also means inviting
non-practitioners into the design process. I imagine this working in two basic ways:

1. **Asking for input:** We should be open to suggestions from non-practitioners who want a system like the one we are building
   and have opinions about how it should operate. For me, that means that I'm open to conversations over email and various public
   forums[^2].
2. **Reconfigurability:** It would be neither realistic nor wise for us to assume that we will be able to hear, understand,
   and fulfill every reasonable request[^3]. One reason that I'm trying to make this entire process reproducible, from
   design to deployment, is so that others can use these ideas without requiring my assent. From an architectural
   perspective, prioritizing reusability means using an extensible  _building block_ approach within the system design,
   not just offering a single product with a configurable experience.

#### Application Libraries

If we succeed in the first three areas--in making a robust, highly configurable system with a few generic core capabilities--
we should expect that a whole ecosystem of different applications will arise. We should facilitate this process
of experimentation and communal problem-solving by establishing safe ways to publish and share these applications. In
the software-writing community, this kind of service is often called a software repository or a package manager; in
walled-garden ecosystems, it's called an app store. To be honest, I don't feel like saying much more about this right
now, because there's a lot to do before it becomes relevant. But it at least needs to provide a secure way to distribute
code and communicate the code's source and commercial / ethical posture.

#### Conclusion

It's 2021. Not just that; it's the _very beginning_ of 2021. Recent events demonstrate that the spirit of 2020 isn't going to leave
on its own. There's work to do.

[^1]: For the rationale behind this decision, see [this footnote](https://raphaelluckom.com/posts/practitioner_journey.html#fn2) on the previous post.

[^2]: Feel free to get my attention on [Twitter](https://twitter.com/RLuckom), but since I'm unable to effectively use microblogging
      for nuanced discussion, expect me to move the conversation to a different venue after it starts.

[^3]: I try to stay mindful of the vulnerability of this project to the trap of [saviorism](https://www.theatlantic.com/international/archive/2012/03/the-white-savior-industrial-complex/254843/),
      in which privileged people like me imagine that we have a special ability to solve other people's problems
      using our implied-to-be-superior resources or perspective.
