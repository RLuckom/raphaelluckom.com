---
title: "Practitioner Inn: State Floats"
author: "Raphael Luckom"
date: 2021-01-24T17:43:34
draft: false
meta:
  trail:
    - practitioner-journey
    - practitioner-inn
---

What a month! 

This is going to be a new type of post in the [practitioner-journey](/trails/practitioner-journey.html) series.
It's a rest between tasks, where I'll try to fill in some of the gaps in what we've done so far and describe
the steps ahead. I'm calling these posts the Practitioner Inn.

If you've made it through the first two exercises successfully, you've done pretty much everything it takes to 
run your own cloud infrastructure[^1]. In one sense, you're kinda done already--if you want to take a break
for about six months or so, when you get back I should have some really cool stuff that you can deploy just like
the static website or the billing alert. But if you'd like to stick around, we should start to look at the
general principles that guide us on our way. Let's start with the shape of the system as a whole:

![svg system diagram](/img/practitioner_inn/000/basic_system.svg)

This diagram is a _functional_ view--it shows the different elements in terms of _what they're for_. We see the
website, the visibility system, and the content management system (CMS). To put this in perspective of a system like
instagram, you're interacting with the website when you're looking at your friends' posts; you're interacting with the
CMS when you're authoring a new post; and you're interacting with the visibility system when you see the number of likes
that your post gets. Obviously these different systems can take many forms and they can overlap with each other--
platforms like Wordpress and facebook embed CMS functions directly in their website systems. We're allowed to make
those kinds of structural decisions based on the situation and our goals--there isn't an obvious best choice for
every situation.

Let's imagine that we've built this system and started using it. It has a similar feature set as facebook--we can
post text, images, and videos. We can comment on posted items. We can exchange direct messages with people[^2]. 
We've been using this system for six months or a year. Over that time, we've posted a lot of things, had a lot of
interactions, and we're starting to get a sense of which parts we like and which parts we don't. There are some
features we rely on, some that we don't ever use, and others that have turned out to be more trouble than they're worth.
We've _also_ seen new systems--ones that have come out since we finished ours--that have cool features that we want
but don't have yet. It's time to do a refresh.

Let's take that perspective--"we want to do a refresh"--and try to use the functional diagram above to decide what we're
going to do. Where can we make changes? Where is it risky to make changes? If we want to experiment with a new idea but
we don't want it to take up all our time, or cost a bunch of money, how should we design it and where should we put it?

That diagram is pretty bad at answering those questions, isn't it? It seems likely that no matter what changes we want to make,
the functional diagram of the system stays pretty much the same. We'll still want to be able to author things, publish
things, and interact with people. We might want to change _how_ the system enables us to do that, but these basic goals 
haven't changed since Myspace and Geocities. And since those early services, the upgrade path available to an average person
has included two options: you can take whatever new developments the service operators decide to offer, or you can migrate
to a newer service. If you want to migrate, you can either leave everything behind or you can try to find a way to bring
it with you. Often the service operator deliberately makes it difficult to bring things with you because you're important 
to their revenue stream. Even if you were using something like Wordpress, the situation wasn't _much_ better. Anyone who's
done it can tell you that after a year or so of fiddling with plugins, a site would get harder to upgrade and modify. And
since Wordpress is an all-or-nothing deal--it's either running on a server or it isn't--the question of how to 
maintain an evolving site can be tricky.

Before we accept this dynamic as a fundamental law of computer systems, let's see if we can imagine something better.
Is there a view of the system that would make it easier to answer questions about upgrades and modifications like I raised
earlier? Let's look at another way of diagramming the system--at the same high level of generality--and see if that helps.

![svg state diagram](/img/practitioner_inn/000/state_view.svg)

This diagram focuses on _state_ rather than _function_. Instead of dividing the system into different parts based on
what each part _does_, this view describes the system in terms of what each thing _is_. It also helps us answer the upgrade
questions much more easily. I claim that, when we use this state view of the system, everything in the top box is basically
irreplaceable, and should be preserved with the greatest care. Moving down to the other boxes, things get progressively
less critical--if we lose all our HTML pages or all our resized images, we can just regenerate them. It would suck to lose
all our log data, but we'd get over it. If some smug CS grad invents a better function for rendering markdown into HTML,
we can swap that in without worrying too much. If Amazon keeps union-busting, we should think nothing of moving all our
networking (and our money) to a more ethical company.

This leads us to the first principle that will guide all of our design efforts: _state floats_. We will always identify
which things within the system are artifacts of our attention--the things that we make ourselves as humans. Protecting 
and preserving those things is our top priority. If our tastes change--if we write a bunch of Twilight fanfiction that we end
up embarassed about--we should be able to delete all the HTML pages that reference it without having to permanently delete the 
original text sources and disown the person we were when we wrote it. If we want to try out a new feature, we should be able 
to set it up alongside the existing system without getting our shoelaces tangled.

The next few exercises in this series are going to introduce an example blogging system--the one that powers this very website.
We're going to see how _both_ of the diagrams in this post--the functional one up top and the state-focused one we've just seen--
are useful ways to think about these systems in different contexts. We'll get into the specific building blocks out of which
these systems are made, and we'll pay special attention to techniques for making _incremental progress_--ways of improving
our system slowly over time without having to blow it up and start over. If we're lucky, we'll hit a tipping point where the
systems we're making stop being purely experimental and become real, useful parts of our online presence.

[^1]: I keep having conversations with technologists who tell me that "infrastructure" is a scary word. I think
      I understand that perspective, and I _hate_ it. Imagine telling someone who wants to teach woodworking that 
      "careful measuring scares people" or telling someone who wants to teach home cooking that "chemistry scares
      people." Those things are true, of course--every human craft is based on an intimidating foundation of 
      practitioner knowledge--but there's no honest way around that. I know of two strategies
      for managing that complexity. One is to encapsulate everything that's _functionally important_ in
      a few sets of simple instructions, and leave the foundational knowledge out of it. This approach is good for people
      who aren't interested in the foundations but need some of the benefits--it's like teaching someone who doesn't 
      enjoy cooking how to make a few easy, well-balanced meals. You can distinguish between their lack of interest
      (which is a personal preference that deserves respect) and their functional need for adequate nutrition (which
      justifies a minimal amount of inconvenience _despite_ their lack of interest). The other strategy is to deliberately
      address the foundational knowledge--to present exercises that introduce new practitioners to the internal logic
      of the craft, its perspectives, goals, and strategies. This way takes longer and builds deeper fluency, but it's
      not for everyone; it discourages people who don't have innate interest in the subject.

      There are some _really sucky_ things about the world right now. One of those things is the fact that massive
      computer systems are twisting the hell out of our society's social and intellectual life. We've spent 70 years testing 
      the hypothesis that technical people like me could "protect" "non-technical" people from needing some amount of 
      practitioner-knowledge in this field. We do this by making choices, on behalf of _everyone in the world_, about how these
      systems should work. When we make enough of those choices as best we can, we end up with systems like facebook and
      twitter, which embody a deep respect for the principle that system designers should [not ask users to think](https://en.wikipedia.org/wiki/Don%27t_Make_Me_Think).
      I don't have a problem with that goal per se, but I'd like to see it evaluated honestly on the basis of its results.
      Is it going well? If it's _not_ going well, does it seem like we've at least been moving in the right direction and
      a few tweaks will get us there? If not, we should seriously consider changing course. I say this by way of apology. 
      The best minds of the last half-century have been working on this. It would be glib to say that they've gotten
      nowhere, but it's precisely accurate to say that they've gotten _here_, where we all are now. My read of the situation
      is that we _need_ more people to understand this stuff. If that's not an achievable goal, we might be screwed. History
      doesn't have an emergency-stop button.

      So to return to my options with this series: I can either try to present a few easy recipes for healthy alternatives
      to the junk-food systems we're all using now, or I can start with the fundamentals and hope enough people stick
      around long enough to make something useful out of it. To be honest, I'd _prefer_ the former. It's easier to explain
      how to install an app than how to build one. It's also more respectful of people who want to be healthy but aren't
      interested in this craft--again, it sucks that those people are having their lives affected by our mess, and we should
      minimize the inconvenience required to alleviate that. But we don't yet know what the healthy alternatives are, and
      it seems likely that their features change over time, as we discover their strengths and weaknesses. We've also seen that
      there are powerful corrupting forces that take hold when large systems are placed under centalized control and under
      capitalist logic. So for now we're stuck with fundamentals. If we're diligent and a bit lucky, six months from now
      we might be in a position to publish a few short recipes that anyone can use without really understanding them. But
      I can't get there on my own. I need people who aren't yet practitioners, but who can be courageous in the face of scary
      words like "infrastructure."

[^2]: Am I missing anything? This seems like a kinda small feature set.
