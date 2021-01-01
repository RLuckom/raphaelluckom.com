---
title: "On Security, Part 001: Social Media Values"
author: "Raphael Luckom"
date: 2021-01-01T12:36:34
draft: false
meta:
  trail:
    - security
---

A couple of months ago, I wrote a [post](https://raphaelluckom.com/posts/on_security_000.html) describing my approach to
security. In it, I distinguished between a _value_, as something physical or conceptual that is worth protecting, and a 
_security mechanism_, which is a technique like "use a password" for protecting a value. I also suggested that a security
designer has three responsibilities: 

1. To identify the characteristics of value in the context of the system.
2. To identify a set of likely _threats_ to that value.
3. To implement efficient _controls_ that guard against the threats, ideally by raising the cost of an attack higher than the likely reward.

These points are intentionally _abstract_--they do not coorespond to specific security choices like allowed password lengths.
Instead, they are meant to expose the specific beliefs and values that each specific security mechanism is meant to support.
By going on the record about  _what_ we think we are protecting with our security choices, we make it easier to evaluate
questions and suggestions in an accountable and verifiable way[^1]. In this post, I'm going to address the first point--identifying values-- 
in the context of social media systems. By making this explicit, my later decisions about security mechanisms can be evauated,
re-evaluated, and refined in a consistent way.

#### Characteristics of Value in Social Media
"Social media" is a big category, so we're going to have to stick to high-level values, where the differences between
something like a blogging platform and something like facebook don't matter very much. The following are _not_ in any
particular order; I suspect that everyone has their own ordering.

* **Public Identity**: social media allows a person to express their identity publicly. Since this identity is an extension
  of oneself, social media systems should protect it as such; it should not be possible for an unauthorized agent to interfere
  with that identity by publishing, modifying, or deleting things. Accounts must be secure against takeover.

* **Meaningful Social Interaction**: Humans are highly social, and also highly diverse. Most humans need positive, affirming social
  interactions to remain emotionally healthy. Social media should allow one to explore different types of social interactions,
  identify those that are most personally beneficial, and facilitate those types of interactions.

* **Protection From Harassment**: In general, no one should be forced to have experiences that they don't want to have. This
  means that people should be able to decide who and what they want to listen to or not listen to.

* **Freedom of Speech**: social media should support the ability of any person to make any statement for which they are willing 
  to be held accountable, on their home site. It is  _not_ a shield against accountability for what one says, nor is it a right 
  to say anything one wants in venues belonging to others.

* **Privacy For Personal Disclosures**: In a [previous post](https://raphaelluckom.com/posts/on_privacy_000.html), I looked
  in detail about the concept of privacy. This point specifically refers to the need for what that post describes as protection
  of the _personality_--the right for specific content that you post in a private setting to not circulate beyond that setting[^2].

* **Freedom From Pervasive Monitoring**: In 2014, the IETF published a [best-practice document](https://tools.ietf.org/html/rfc7258)
  stating that "Pervasive monitoring is a technical attack that should be mitigated in the design of IETF protocols, where possible."
  This document recognizes that there are both individual and collective harms caused by "indiscriminate and large-scale" monitoring
  of internet use. Further, it articulates a justification for why these harms are significant enough that internet standards
  should specifically consider their security against this attack. Unfortunately, this has been inconsistently applied.

* **Resistance to Misinformation and Disinformation**: Over the past few years, we've seen how the rules of engagement for public
  debate have gradually shifted to include deliberately making statements unsupported by evidence (lying). Combined with highly
  complex and deliberately obscure targeting mechanisms, it is increasingly difficult to know how to evaluate a given statement--
  as fact, as a lie, as an attempt at provocation, as opinion, etc. Social media should prioritize the careful construction and use of a
  consistent ontological context, while acknowledging the tensions that will inevitably arise within it.

These points are my first attempt at articulating the _values_ that should be protected within social media systems. I expect to return
to this list often to justify my security choices. I also expect that I've probably gotten some things wrong and missed some things,
so I'll need to revise this list as I discover errors. Finally, it is expected that tensions will arise between these values--certain
decisions will require elevating one value over another in a given context. While that cannot be avoided, one explicit goal is to
acknowledge when it occurs, and to respect _pluralism_, letting each person follow their own conscience.

[^1]: Computer security writing suffers from a lack of shared context. For instance, in writing like [this](https://medium.com/@benjamin.botto/secure-access-token-storage-with-single-page-applications-part-2-921fce24e1b5)
      you can see a quote like "I went over some reasons for keeping access tokens out of the browser," which
      is an extremely confusing statement if you include "session token" in the category of "access tokens."
      This context-fragmentation is a huge barrier to productive debate even when we are talking about a specific
      _security mechanism_ such as "tokens." The situation gets much worse when we make assumptions about the
      _values_ that we mean to protect. 

      For instance, let's take the informative and often-cited article about [not using JWTs for session tokens](http://cryto.net/%7Ejoepie91/blog/2016/06/13/stop-using-jwt-for-sessions/)
      This article, like many others, argues that one reason for preferring an older technology over a new one
      is that when using a new technology "you will either have to roll your own implementation (and most likely
      introduce vulnerabilities in the process), or use a third-party implementation that hasn't seen much 
      real-world use."

      This is a useful point to consider, and in the context of that article, it is a well-qualified statement
      that holds true within its context. But when we look more abstractly at the claim "Use an existing, tested
      technology rather than a new, untested one," we can see a really big problem with it. Specifically, it omits
      the possibility that the _underlying values_ of the existing, tested technology, rather than its implementation,
      might be the problem. For instance, whenever you see a service that lets you "sign in with Google," or another
      common third-party, they are likely using a technology called [oauth](https://oauth.net/). Oauth is considered
      _extremely secure_--it lets Google worry about keeping your user password secure, so that when you want to log
      in to a different site, that site can just verify your identity with Google rather than making you remember
      yet another password.

      But what if part of your value set is that it's _dangerous_ to give a company like Google that level of control
      over such a broad swathe of the web? Well, newer protocols like [IndieAuth](https://indieauth.net/) exist, which
      mostly follow the Oauth pattern but make it easier for anyone to have their own personal "Sign in with X" service.
      This means that Google no longer controls your online identity--losing access to your Google account doesn't mean
      that you lose access to other services, and Google no longer gets notified every time you log in to any service.

      If we uncritically apply the rule "use tested technologies, not new untested ones," then we risk missing this entire
      category of nuanced, value-driven conversations. I would modify that rule a little bit to make it more safely applicable:
      "When your values suggest using a given security mechanism, try to use the best-tested implementation of that
      security mechanism you can find. But do not use any _security mechanism_, even if well-tested, without interrogating its
      implicit values."

[^2]: Because of the way that information exists in reality, it is not possible to physically guarantee that information will
      stay confidential after it has first been shared. However, the next best thing is to create clear expectations about
      the allowed boundaries for information to spread, and to establish context-sensitive sanctions for violations of those 
      boundaries.
