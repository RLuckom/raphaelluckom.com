---
title: "On Almond-Shaped Systems"
author: "Raphael Luckom"
date: 2020-10-17T07:09:34-05:00
draft: false
---

When is a shape not a shape? All the time, as it happens. There's no
physical square in a square deal, there's no pyramid in a pyramid scheme,
there's no specific surface implied by a "flat organization." But the shapes
aren't exactly absent, either--in each case, they _do_ describe something
meaningful about the subject. The shape is a shorthand for a different
set of properties--equality, regularity, stability (square), hierarchy, exploitation (pyramid), lack of hierarchy,
equal access (flat)--that fit the way we experience (or wish to portray) a
system or process. 

When I google "almond shape," the main thing I get is a fascinating array
of articles about comparative fingernail shapes, so I consider myself to
be in good company in my interest. I think of the _almond shape_ in system design as a way of enabling a person
to meaningfully control the system without needing to maintain focus on each of
its parts. The most basic example of this is the simple shopping bag or handbag,
where a human-adapted control surface--the handles or the apex of a shoulder strap--
allows a person to carry and control a volume of objects that no human control
surface (a hand or shoulder) would be able to manage. 

{{<figure src="https://media.raphaelluckom.com/images/2a5110b7-a6e6-4574-8c0b-2197edbc6607-1000.JPG" caption="Hand stitched shopping bag loosely based on the Japanese _azuma bukuro_ pattern, made from cloth napkins and scrap fabric. This pattern is really neat because the construction encourages the bag to stretch, even when made of non-stretchy fabric" alt="A yellow and white cloth shoulder bag with a teal shoulder strap on an oak table">}}

This idea of a _human-adapted control surface_ (HACS) for a system that would
otherwise exceed some human capacity is found in many places. I would use the term
_almond-shaped_ to describe a human-adapted control surface in a system that _does not
require the exclusive attention of anyone other than its user_. Not every HACS fits
this definition. For instance, the captain of a sailing ship or the CEO of a corporation
has access to various control surfaces with which they can steer their system,
but the system itself is obviously triangle or pyramid shaped. A CEO's "control surfaces"
consist of the concentration of the human capability of their organization into
a more or less efficient extension of their will. Those surfaces work _through_ and _because
of_ the other people who provide their capabilities to the system. Contrast that with a smaller
sailboat or a shop, systems designed for operation by a single individual.

An important caveat here is that almond-shaped systems don't exactly imply "self-reliance,"
especially not in the quasi-religious sense of a survivalist or transcendentalist. If
we look at the example of a small shop, we understand that the proprietor isn't really
_alone_--they need the support of suppliers, customers, and service providers. The difference
is that the shopkeeper is the only person whose _exclusive_ attention is required--customers
come and go, suppliers have many of their own customers, the plumber who comes to fix a sink
doesn't need any special interest in the business to do a good job. An almond-shaped system
allows a person to use their care and attention efficiently toward their goals, but
it doesn't put one person's care and attention "in charge" of anyone else's.

There are examples of almond-shaped computer system design that have been highly effective.
In the late 20th century--very roughly 1980-1995[^1]--the PC itself was an almond-shaped system. 
You bought the computer and the software you needed, plugged it into
a source of electricity, and even people who were not "programmers" could operate it by themselves
without the manufacturer or anyone else needing to continue supporting it.
The _shape_ of this system has the same properties as a shopping bag--the _overall_ complexity
seen by the computer user isn't the complexity of every technical detail of the computer, just as the
"carry-ability" of a shopping bag isn't the combined "carry-ability" of each item within it.
The system provides human-adapted control surfaces that allow one person to conveniently
control the system as a whole, without needing to focus on (or even understand) all of
its parts.

There are still examples of almond-shaped systems that are massively successful on the
internet. One of the largest is Wordpress, the content-management system that runs a staggering
percentage of the world's websites. I would describe Wordpress as almond-shaped because
it has always focused on allowing a single user to install the software on
a web server and use a control plane (the admin UI) to run a highly advanced website platform
without needing others to continually keep the service working. I don't
have a use for Wordpress, but its scope and attention to human factors (especially in
its admin panel) never fail to impress me[^2].

Conversely, I know of no almond-shaped systems that would be widely described as "social
media" systems[^3]. To use facebook or instagram or twitter requires the constant attention
of the workforces of those companies--if those companies went away tomorrow, everyone's accounts
would go away with them. This is a very important distinction--if you get a copy of the
Wordpress software, you can keep your Wordpress site running even if the Wordpress organization
disappears. There is no analogous way for you to publish "your" facebook content without
the existence of the facebook organization. The closest thing I know of to an almond-shaped
social media platform is [diaspora](https://en.wikipedia.org/wiki/Diaspora_(social_network)), 
an ambitious distributed, user-controlled social network first released in 2010[^4].

Not all challenges call for an almond-shaped system. Wikipedia is far from almond-shaped;
so are public phone networks. There are times when you _need_ a centralized authority to
provide a structure within which people collaboratively solve a problem. In the case of Wikipedia, it's
useful that every term only has _one_ page--that means that even if the term is controversial,
Wikipedia has a fighting chance of presenting a synthesis of the competing views. Wikipedia's position
as a dominant player in "public representations of stuff" means that it attracts people from
all sides of a controversy to engage in the process of representation. If everyone had their own
Wikipedia, the sum of those individual services would be much less useful than the monolithic
service that we currently have. Likewise, it would not be an improvement for everyone to start
doing their own iron smelting or bicycle manufacturing. Various industrial processes work most efficiently
when they can take advantage of economies of scale--and the economies of scale tend to require
a hierarchical organization of labor.

This is one on-ramp to a bigger discussion about what social media is and should be. We can
see that social media systems are not almond-shaped. We can also see that
it's not because almond-shaped systems are uncompetitive--there are successful almond-shaped
systems everywhere. So what exactly is social media _about_ that makes it a bad fit
for an almond-shaped system? Could an almond-shaped system do some things better than the existing
platforms? Are there things that would be worse?

As someone who [doesn't fit well](https://www.raphaelluckom.com/posts/not_draft.html) into many of the assumptions made by non-almond-shaped
systems, and loves to adapt things to my own imagination, I'm obviously a big fan of the almond shape.
It's the starting point for most of my projects, and my [current one](https://www.raphaelluckom.com/posts/october_check_in.html) is no exception.
My sense is that it's about time for the system design pendulum to start swinging back in that direction,
but even if it doesn't I find it a useful way to look at things.

[^1]: The early end of this range corresponds with the [appearance of mass-manufactured PCs](https://en.wikipedia.org/wiki/ZX80) while the later end corresponds to the [rise of AOL](https://en.wikipedia.org/wiki/AOL)

[^2]: If you ever hear a "skilled" programmer complain about Wordpress, imagine listening to a 15th-century scribe's opinion of the printing press.

[^3]: I don't think most people would describe Wordpress as "social media," though I think it can be.

[^4]: I would not consider Diaspora almond-shaped under my definition because the "pods" on which users have accounts are set up and maintained by people with special knowledge of how to run big computer systems. But it's close and I'm sure a counterargument is possible.
