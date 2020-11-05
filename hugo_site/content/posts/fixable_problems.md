---
title: "Fixable Problems"
author: "Raphael Luckom"
date: 2020-10-21T20:09:34-05:00
draft: false
---

It's Wednesday night. So far it's been a good week--I've found my way back
into the working cadence that I like. This is what I hoped I'd eventually
be able to do--take a real shot at making my skills as valuable to me,
the human, as they would be to an employer.

It's taken longer than I hoped to get here. I left my job at the end of July--
though I don't think I was leaving _that job_, which was pretty new, so much as I was
stepping off the commercial-software-development treadmill for a bit of a rest[^1].
As I've [mentioned](https://www.raphaelluckom.com/posts/october_check_in.html), I had planned to explore ways to support myself through various
kinds of traditional crafts. I started moving in that direction--working on designing
standard-ish objects that I would be able to make and sell--but a feeling of unfinished
business remained. It seemed hypocritical to take the money I was paid for 
working in the systems that are eating the world, then wander off to a quiet
spot and work on my pottery and sewing like the accounts were balanced. Besides that,
I _like_ programming. It has the same kind of appeal as doing a crossword puzzle or
playing Tetris, but when you're finished, there's something new in the world. It makes
me sad to see how much of the effort spent programming--like the effort spent doing
most commercial and leisure activities--redounds to the benefit of a tiny minority of extremely wealthy
people. It makes me sad that out of that, somehow, _programming_ is what gets a bad name--
as if it's the intellectual activity of writing code that gentrifies neighborhoods or
moves factories overseas, and not billions of tiny acts of unthinking capitulation to the
logic of markets. I didn't want to leave on that note.

If I've been short on specifics for the past couple months, it's because I didn't have
specifics to share. I knew my intended direction of travel but not my route, and certainly
not when or where exactly I might arrive. Those things are a little clearer to me now--at least,
I can describe some of the concrete details of what I'm working on day-to-day. What
I'm about to talk about should be considered work-in-progress, and I reserve the right
to about-face on any of it if my perspective changes.

I've been working on three specific projects. The first one is the cloud infrastructure
that lives in [github](https://github.com/RLuckom/raphaelluckom.com/tree/master/terraform) alongside
the code for this website. A lot of that work has been on "overbuilding" some of the more basic
components--things like log management[^2] and permission management[^3]. My number one rule
for system design is that the _right_ way to do something _must_ be made the easiest way, because
the easiest way is what people are going to do, whether it's the right way or not. Since my ultimate
goal is that you, reader, will be able to deploy and maintain your own system like the one I am building
for myself, I would not like to embarrass myself by giving you something that is going to break[^4].

The other two projects I've been working on are a pair of code libraries: [exploranda-core](https://github.com/RLuckom/exploranda-core)
and [donut-days](https://github.com/RLuckom/donut-days)[^5]. The purpose of those libraries is to
make it easy to put any system together at the speed at which you can describe it, without being
tied to any particular vendor or platform. I've been using AWS, but I'm making sure that nothing 
I'm building _relies_ on AWS and not also offered by competing vendors.

Because my goal is that _anyone_ should be able to build whatever system happens to be right for them,
I need to start with some example systems that I can build and simplify until they meet my standards.
The first of these projects is a personal image management system. I want to combine the use-cases
of storing and organizing a lifetime's worth of images with the basic social-media use-case
of sharing images publicly or with your friends. This is something that I need for myself
and a good entrypoint into the set of services that many people require. One way that I look
at these example services is in terms of _capabilities_. Image-management requires the capability
to send and receive data, to work from mobile devices and computers, to publish on the internet,
and to search, read, and edit metadata (when a picture was taken, what's in it, etc). The difficulty
of doing all these things well is part of what makes for-profit social media such an attractive
proposition. Other capabilities that are _not_ included in image management, but which I intend
to address in the fullness of time, are sending and receiving payments and true _federated identity_[^6].

I don't mean that I'm going to invent a new identity system, and I'm
just _profoundly_ uninterested in cryptocurrency. My confidence actually comes from
how obvious and boring the solutions to these problems really are. There are plenty
of payment processors who offer access to the regular credit card and banking systems at
reasonable rates[^7]. Likewise, there are extremely well-understood and trustworthy ways of verifying identity,
suitable for social media use, that do not rely on Facebook's or Google's login system[^8].
It was a big deal when facebook started doing facial recognition on images in 2010. Now
there are simple ways to do it on a raspberry pi. Paypal is old enough to vote. Technology
has not stopped moving in any of these areas just because people already got rich off them.
But the benefits of technology _do_ seem to have stopped making their way to ordinary people
quite like they were doing at the middle and end of the last century. And _that_ is a fixable
problem, if enough people care about it.

[^1]: The opportunity to do this is so obviously key to my mental and physical health that I think it should be guaranteed to everyone, whenever they need. Whatever obstacles exist to that becoming a reality, shortage of resources does not seem to be one.

[^2]: Well-behaved software keeps records of what it does. These records are written to text files called logs. How to manage these logs--how to balance "being able to understand the system" with "not being overwhelmed" and "not paying too much"--is an art form.

[^3]: The [principle of least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege) states that a system component should only be given permission to do the specific things it _needs_ to do. For instance, an application that only needs to _read_ from a database should not be given permission to _write_ to that database, or to read from any different database. In practice, it's common for an engineer to develop in a permissive environment (for instance, to give their program full access to a test database) and then try to restrict access down to the minimum when it's time to deploy to production. I do not find this approach to work well--on the technical side, it can be hard to determine the required set of privileges without significant trial and error, and on the human side, people sometimes cut corners when they're rushing things into production. These factors work against someone trying to do least-privilege after the fact. I described a central part of my least-privilege strategy in [an earlier post](https://www.raphaelluckom.com/posts/a_terraform_pattern.html)

[^4]: I'm all set for ways to embarrass myself without adding any more.

[^5]: I'll think of some kind of prize for the first person who successfully figures out the reason for that name.

[^6]: It's not immediately obvious, but _login_ is one of the core features of every for-profit social media system. The ability to like or comment on a post relies on the fact that the system knows who you are--part of what's important about getting likes is that you can see who they're from, and you know (usually) that it wasn't just a bot clicking on the like button a bunch of times. The fact that a celebrity's social media accounts are reliably _theirs_, not those of an impostor, are why those accounts are valuable. No popular social media system uses a way of getting those assurances without relying on a central system (the "federated" part). There _are_ well-known ways to do it, but they haven't yet been widely applied to social media. The big money is in getting everyone under _your_ roof, not giving everyone their own.

[^7]: I'm defining "reasonable" here as "better than what you can get from rent-seeking market owners," not in a universal sense.

[^8]: I'll give you a hint: you don't have any trouble finding the right website for your bank.
