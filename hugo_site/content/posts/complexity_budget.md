---
title: "Complexity Budgets"
author: "Raphael Luckom"
date: 2020-11-02T20:00:00-05:00
draft: false
---

I have a couple of really cool post ideas in the works. They use the concept of a _complexity budget_, 
which seems just a little too big to leave unstated or try to define in a footnote. So this is going to be a 
short post that describes what I mean by that without a ton of other context.

To interact with a human product in the way that its designer intended,
one needs some amount of context[^1]. This context--roughly "what
you need to keep in mind while you're using a thing"--is what I describe as
_complexity_. A famous and apocryphal quote about system design goes, 
"Everything should be made as simple as possible, but not simpler." The floor
alluded to in that quote--that if you simplify something too much, it no longer works--
is the idea of a complexity budget. System designers should try to make their systems
as simple as possible to interact with, as long as the simplification doesn't interfere
with important aspects of the system[^2].

This isn't a new idea, but it has applications and consequences worth
exploring. The first of these is that a complexity budget can be a reason to make a system-design
choice. One way to decide which of two features to add to a system is to estimate
which one delivers the most extra value with the least added complexity. Just as it can be economically
infeasible to build certain types of systems, it can be infeasible to build certain types of systems
where the complexity required to use them outweighs their benefit (you could call this one category
of economic infeasibility; I'm not sure it makes much difference).

A complexity budget applies to an _interaction with a thing_, not the thing itself. We can't say
what the complexity budget of "a spoon" is--are we talking about using it, making it, or something else?
Most systems have a few different obvious complexity budgets to consider. For instance, a coffee shop
includes a customer's experience--how easy it is to order, etc--and a barista's experience. These can
be broken down further in whatever way is most convenient for the system designer--it might be useful
to think about a complexity budget just for the graphic design for the menu.

In software, it can be easy to overlook one very important complexity budget: the complexity involved
in trying to understand, change, or update a system. This is often visible in services
that prioritize fast initial deployment over other design considerations. Such a system can be deployed
easily, but making changes or updating to a new version is a daunting prospect. A system can also
acquire complexity over time as pieces are added. When this happens, people who already know the system may
not be able to accurately perceive its complexity until they try to explain it to a beginner.
Finally, there is a complexity budget inherent in trying to make a new system--the system that gets produced
can't exceed the skills, capabilities, and attention of the team that builds it.

I use this idea a lot, both when exploring design ideas for new things and when trying to understand existing
systems. I'm working on a longer post exploring the history of some foundational concepts in
the contemporary internet, and there are several weird choices that make perfect sense when you
look at them in terms of their relationship to a complexity budget that was relevant when they were made.

[^1]: For the sake of argument, we will also say that it's possible to identify a kind of _local context_--context about a specific object or system that is sufficient to interact with it.

[^2]: I'll again plug Fred Brooks' "No Silver Bullet–Essence and Accident in Software Engineering" ([PDF](http://faculty.salisbury.edu/~xswang/Research/Papers/SERelated/no-silver-bullet.pdf)) as a great discussion of an overlapping idea.
