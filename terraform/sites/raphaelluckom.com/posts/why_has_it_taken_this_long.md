---
title: "Why is this taking so long?"
author: "Raphael Luckom"
date: 2021-05-14T16:38:22
draft: false
meta:
  trail:
    - labor
---
There's one question that my intrusive thoughts like asking more than any other: "Why is this
taking you so long? It's been what, eight months, and you're _just_ starting to get a blog together?
Why didn't you just... you know... _anything else_?" This bothered me a lot in the first few months;
at first, I thought this would be a two-month project, max, and as two months turned into four and then five
I started to feel increasingly frustrated. But as I examined the question, a surprising answer started to
take shape: no one else is doing what I'm doing. This is an extraordinary claim, I know, and extraordinary
claims require extraordinary evidence (or at least careful qualification). In this post I'm going to
describe what I mean by it and why I think it's true.

#### What am I doing that no one else is doing?
My system is designed to have _all_ of the following properties:

1. All of the application logic, and all the operational data generated, is under the direct control of the system owner.
2. The system owner pays directly for the resources used by the site; there is no business model that assumes the owner's time, content, or attention can be monetized. There is also no external entity (besides AWS) that could fold or lose interest, taking the site with it.
3. The system owner has full control of the domain.
4. The system hosts its own administration UI, and its operation doesn't rely on any developer tools that would be unfamiliar to a non-practitioner.
5. The deployment process for the system is unambiguous--to deploy the system, the system owner needs to follow directions and supply information but doesn't need to make decisions.
6. The system can handle any amount of traffic.
7. The system doesn't require any self-managed servers, either virtual or physical.
8. All user data (as opposed to operational data like logs) is durably backed up.
9. The system is designed to be extensible; its utility services, like logging, backups, and admin UI, are available for use by future plugins.
10. All web traffic to the system (public and private) is encrypted with TLS.
11. It is designed for a _single_ user / owner / operator. If I was a facebook VP, this is the part that would send chills down my spine, so much so that I'm going to leave its significance as an exercise for the reader.

It's the sum of these properties, not any of them individually, that is unique. In the next sections, I'm going to survey
comparable publicly-available systems and show how their speed-of-development comes at the cost of one or more of
these items. But before going on, feel free to try the exercise yourself: look up any of the platforms you can think of
and see if they meet these requirements. If you find one that does, I'd be eager to hear about it.

Please note that I don't mean to criticize the systems below--they are all well-adapted to their use cases, or else I wouldn't
bother mentioning them. They're _good_ tools in the same way that a saw is a _good_ tool, even if you currently need a hammer.
I've enjoyed using many of them personally, and many of them inspired different features or design choices I've made.

#### Developer solutions: Very good but basic and require specialized knowledge

There's a category of system designs aimed at developers. The most universal characteristic of these systems is that they
don't include an administration UI. Instead, they rely on developer tools like [git](https://git-scm.com/) to allow the operator
to interact with the site. These systems have two main drawbacks: they are comparatively inaccessible to non-practitioners
and they cannot be used from a cell phone. But by omitting an admin UI, these systems don't need to provide their own user management
or UX solutions, making them comparatively fast to develop. Some specific examples include:

1. __[Github Pages](https://pages.github.com/)__: This is probably the most popular developer-friendly static site hosting solution. In addition
   to lacking a site-admin UI that lets you post new material, it also doesn't meet requirements 1, 2, 5/3[^1], and 9. Github's published [limitations](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages#usage-limits)
   on pages sites are totally reasonable, but they preclude using the site for commerce, limit it to 1GB of stored data, and apply other usage restrictions.
2. __[Serverless Example Blog](https://www.serverless.com/blog/how-to-create-blog-using-components-hugo)__: In a different corner we have an example
   Serverless(tm) (I'll call it STM) blog. STM is a set of tools for building applications-without-rented-servers, and it's published by a company called Serverless.
   When we look at that design, we see that it misses requirement 5 (no admin UI), requirement 6 (you need to go elsewhere to decide how to set up Hugo), point 8 (no backups),
   debatably point 9 (STM-the-framework _is_ extendable, but that particular design doesn't really include any utilities that could be reused by extensions), and point 10. In addition,
   STM sells their online service pretty hard--the examples seem to assume that you have an account with them in addition to your actual hosting provider.

The products in this category are very blog-focused out-of-the-box--you either can't get them to do anything else, or doing so is comparable
to writing the additional features yourself. They tend to have very good operational characteristics (both of these solutions give you as much
bandwidth as you're likely to ever need, neither costs much, and once deployed both require zero or negligible maintenance). 

#### Easy-to-use hosted services: Very good but out of your control (and sometimes selling you)

This category includes systems that a non-practitioner can use without deploying any infrastructure. By definition, these types of services
don't meet requirements 1 and 3 (control of logic, control of domain); they mostly tend to miss requirement 2 (the user is not monetized) as well. On
the other hand, their operational characteristics tend to be impressive. Examples of this include:

1. __Existing Hosted Social Media__: The obvious giant in this category, sites like twitter, facebook, instagram, etc. go all-in on ease-of-use,
   industrial scalability, and ease-of-signup. However, they don't meet _any_ of the requirements when it comes to user control, and most of them
   forbid most types of extensibility (twitter seems to be the only one with a fairly permissive extension system available to mortals). As someone
   who _really_ doesn't like these systems, I think it's important to acknowledge that they are _very_ well-designed in certain respects--they do onboarding
   very well, their mobile options are highly featured, they include interesting ways of interacting with other humans, and they are generally highly stable--there's
   not much risk that facebook will kerplode and take all your data with it. There is a risk with all of these services that your account could be closed
   or stolen; I'm not sure how much the average person needs to worry about that, and I'm not sure how to compare the likelihood of takedowns across different
   types of providers, so I don't consider that a strong point for or against.
2. __[Medium](https://medium.com/) and [Substack](https://substack.com/)__: Let these two popular services represent the class of hosted blogs. Again,
   we see _really good_ operational and onboarding characteristics for a non-practitioner user. We also see lack of user control of the operational data, code and domain (all
   owned by venture capitalists) and a business model that requires monetizing the user. These are also the first examples we've seen that offer to get
   their users _paid_--that's definitely worth a mention. I'd score these a little lower on overall durability, just because they're not at the level of
   economic permanence as the bigger social networks (in particular, substack seems easily cloneable so I suspect that within the next couple of years it will
   go away, get acquired, or start squeezing its users).

There are lots of other services in this category with approximately the same characteristics. There are also self-hostable, federatable services
like [mastodon](https://mastodon.social/about), where you can likely get a free account on infrastructure hosted by a private practitioner. I would say that
the "average non-practitioner"--someone not plugged in to practitioner communities--would have a hard time finding a stable community of this type that meets their
requirements.

#### Self-hostable Content Management Systems (CMS)

This category includes free and open source platforms with millions of hours of operating time, well-known and easily-satisfied infrastructure
requirements, and which require a dedicated server. With these applications you get full-featured admin UIs, good control over your own code and data,
and, in many cases, a pretty-good setup and onboarding experience. Specifically, hosting providers know enough about these systems that they offer
package pricing and one-click installs when you sign up.

Wordpress is the giant in this space. I think the software community owes a great debt to Wordpress--it's probably the most successful free CMS ever.
It's one of the _very small_ number of open source projects where you can actually see non-practitioners and practitioners participating in
feature conversations on fairly equal terms. A lot of us practitioners have run Wordpress at one time or another; for me, it was the first hosted
service I ever set up. This intentional accessibility to non-practitioners is a phenomenal achievement; out of everything I've described in this post,
this accessibility seems to me the most important and most difficult to achieve.

Wordpress has a couple of drawbacks though. First, because it requires an always-on server, you generally get the hosting that you pay for. I'm
not super plugged-in to the world of Wordpress hosting, but it seems like you can expect to pay around $10 / month for good hosting (often after
the expiration of an "introductory offer" term) or else you're restricted on storage space, bandwidth, or some other dimension. And while Wordpress
is indeed highly customizable, you generally need to assemble the set of plugins that works for your use case, which doesn't meet requirement 5 (unambiguous instructions).
As an application, Wordpress itself doesn't include a backup strategy, though many hosting providers include that in their service.

#### Conclusion

Many communities recognize a type of "three-pick-two" dynamic when it comes to their object of interest. Cyclists say, "Light, strong, and cheap: pick two."
Here, we could reformulate that as "Accessible to non-practitioners, under the control of the system user, and cheap-to-operate (in money, time, and knowledge): pick two."
If you _can_ pick two of those, then there's already something out there that will suit you; if you can't, I don't think there is. I would say that my system
will all three, but that's not exactly true--it has cost a lot of my time. And in that sense, I feel pretty good, whenever that little voice in my head asks
why it's taking so long, to just remember that this is really on its way to being a new kind of thing in the world.

[^1]: Many systems fail on the requirement that deployment be unambiguous when that requirement is combined with another of these requirement.
      For instance, Github Pages deployment _can be_ unambiguous (because Github and others have posted instructions), but if you want
      to use your own domain, _that_ is not unambiguously covered in the instructions (you're expected to _choose_ a DNS provider and follow
      their instructions to handle your DNS records). In this way, the unambiguous instructions are incomplete with respect to my requirements.
