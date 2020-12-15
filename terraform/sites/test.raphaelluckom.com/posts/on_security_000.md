---
title: "On Security: Part 000"
author: "Raphael Luckom"
date: 2020-10-29T20:09:34-05:00
draft: false
meta:
  trail:
    - security
---
There is a thought experiment I like to do as a kind of warm-up when
thinking about security. Think of something in your life that is protected
by security--it can be something physical: paper money, your home,
or an important object or heirloom. It can be information: a secret
like your banking password. It can even be a person or other living
being. Now, imagine the universe 2.6 billion years from now. Where is that thing?
What state is it in? Is it still valuable in the same way, or will its
value have changed or disappeared?

The purpose of this thought experiment is to notice that the concept of
_security_ is not only, or even mostly, about protecting _stuff_. Rather,
at least half of security is about understanding the human relationship
that we call _value_--identifying not just what is valuable, but looking
deeper at the particular characteristics of value in a given
context. It is these contextual characteristics of value that guide the
definition of security in that context. Security is _appropriately protecting
value_[^1]. In a bank robbery, security might include putting dye packs in with 
the money being stolen, one goal of which is to destroy the value of what is taken. 
In a home security system, however, it would not be appropriate to include
incendiary devices that set the house on fire in the event of a break-in. 

The system designer has several responsibilities with respect to security:

1. To identify the characteristics of value in the context of the system.
2. To identify a set of likely _threats_ to that value.
3. To implement efficient[^2] _controls_ that guard against the threats, ideally by raising the cost of an attack higher than the likely reward.

Notice that "preventing bad things from happening" is too general to appear
on that list. That is, _when_ bad things happen, they may or may not represent
negligence on the part of the system designer. For instance, a bank
robbery doesn't necessarily represent a failure of the bank's security
officer. If the security officer implements controls that forsee the likelihood of that
event--such as procedures to minimize the risk that anyone will get hurt and insurance
for any monetary losses--the basic fact that a robbery happens doesn't reflect one
way or another on the quality of the system. Likewise, if a bank was seized by an invading
army, that would not be a failure of its security officer. These examples are meant 
to show that good security can't be identified simply by looking at whether or not bad
things happen over time. Instead, security should be judged by whether its definition 
of value is appropriate and whether its controls are reasonable. Another way to look
at it is to notice that the security system designer has a finite budget. The quality
of her work is in her ability to spend the budget wisely, not in whether the budget is
sufficient.

When we build systems for ourselves, we're responsible for both sides of that equation--
deciding what resources to spend on security _and_ on how to spend them. These resources
are most often _not_ money. For instance, I would characterize my decision to limit my
time using corporate social networks as, in part, a security decision. I recognize a value
in being able to construct my personality "out of range," as it were, of the capabilities
of those systems to subject me to social pressure. The threat that I anticipate in those
spaces is that my feelings _can_ be manipulated in fairly predictable ways. It's not that
hard for social networks to pull me in and me feel insignificant in my own life--it's happened
several times already. But that's where lots of my
friends are, and it's where lots of _potential_ friends are, so staying away from those spaces
has a cost for me. Neither choice--staying away from corporate social networks or engaging with them--
is better or worse than the other in any provable way; I don't know and can't control which one
would work out best in the long run. What I _can_ do, following the points above, is to
try to figure out what I _value_, and adopt the posture that seems most likely to protect it.

In my last post, [on privacy](https://www.raphaelluckom.com/posts/on_privacy_000.html), I 
claimed that the privacy controls offered by social networks are not really
helpful at protecting valuable kinds of privacy. I think there is an analogous point to make
about security, not exclusive to social networks. When we think about security only in terms
of controls--passwords, locks, vaults, accounts--we risk confusing _mechanisms of protecting value_
with _definitions of value_. We assume that because a system lets us choose a secret password,
and guarantees that no one else will be able to log in to our account, that _access to our account_
is the thing worth protecting. But if we decided that value instead lay in things like "being fairly compensated for allowing
our data to be used in planet-scale AI training datasets," or "not being subjected to social science
experiments," or "securing our government from the influence of anyone who can buy an ad or write a bot," the security
controls that we would design would probably go beyond exclusive access to a social network account.

As with the privacy post, this post is #000 for a reason. There's a _lot_ to be said about computer
security, much of it interesting, complicated, and strange. All of that knowledge represents
the _how_ of security, and it's only relevant after you've decided _what_ to secure.

[^1]: Once you have the observation that "security is appropriately protecting value," you can use it in reverse as well--every _existing_ security system is a statement about what its designers believed valuable.
[^2]: The efficiency of a control is in the relationship between the cost of implementing the control and the value that it protects.
