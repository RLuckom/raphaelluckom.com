---
title: "On Privacy: Part 000"
author: "Raphael Luckom"
date: 2020-10-24T07:09:34-05:00
draft: false
meta:
  trail:
    - privacy
---

One of the things that I'm most nervous about when it comes to designing
a social media alternative is having to grapple with the concept of _privacy_.
On a purely technical level, the "privacy controls"[^1] that _are_ actually
implemented by social networks seem both too complex and too useless[^2] to bother with.
On a human level, the concept of privacy has so many dimensions that I will never
be able to do it justice. So I turned to one of my new favorite resources, the 
[Stanford Encyclopedia of Philosophy](https://plato.stanford.edu/entries/privacy/),
to see if they had one of their characteristically detailed and comprehensive
reviews of the subject, which they did.

The first thing I learned was that privacy is the philosophical justification
(and a target for critics) of a series of legal decisions about certain freedoms
people have in democratic societies, such as reproductive rights and rights regarding sexual
and gender expression. I don't usually think of those rights as fundamentally about
_privacy_, and it was interesting to read about how privacy was the legal concept from which
they arose. I don't intend to explore those ideas further in this context, but if you're
interested, the discussion in the SEP is fascinating[^3].

The dimension of privacy that seems most relevant to social media is described in the
encyclopedia as _informational privacy_. This conception of privacy was articulated
in an 1890 article called [The Right to Privacy](https://www.jstor.org/stable/1321160)
by Brandeis and Warren[^4]. The most stunnning insight in the article is that "...the
protection afforded to thoughts, sentiments, and emotions, expressed through the medium of
writing or of the arts...is merely an instance of the enforcement of the more general right
of the individual to be let alone. It is like the right not to be assaulted or beaten...
The principle which protects personal writings and all other personal productions, not against
theft and physical appropriation, but against publication in any form, is in reality not
the principle of private property, but that of an inviolate personality." The authors
identify the _personality_ as the part of someone that is protected by privacy, just as the
person's body is protected from assault. This implies a view of personality that includes
one's feelings and sense of self, as opposed to the way we commonly use the word today,
which is "the combination of characteristics or qualities that form an individual's distinctive character."
They are identifying privacy as a shield that protects the personality from
the harm caused by the publication of facts about a person. They go on to say that the right to privacy
lasts until a person publishes or consents to the publication of those facts, specifying that
"a private communication of circulation for a restricted purpose is not a publication within the meaning of the law."

The motivation for this 1890s interest in privacy was the rise of newspapers and the
beginning of mass media. I have mixed feelings about that--you can definitely read
the sudden interest as an expression of aristocratic fear of a lower class newly
empowered to participate in important conversations. But Warren and Brandeis explicitly 
said that elements of the right to privacy do _not_ extend to facts about certain kinds of public figures,
like public officials, candidates for office, and a sort of blurry category of important 
businesspeople. The idea is that while you remain a commoner, you have a right
to protection against certain things about you, or things that you express, being made
public against your will, because it hurts you in some way when they are made public. 
When you stop being a commoner and ask for or receive public trust, the public gets a
right to know things about you that enable them make an informed decision about whether 
that trust is well-placed. Since this view of privacy is based on individual well-being,
it does not seem to apply to things like targeted advertising, where you might be shown an
ad for an embarassing product, but the advertiser is not given access to your details.

An extension of this idea connects privacy to _intimacy_. The SEP paraphrases
Charles Fried, writing in 1970 in his book _An Anatomy of Values_, saying "Privacy is valuable 
because it allows one control over information about oneself, which allows one 
to maintain varying degrees of intimacy. Indeed, love, friendship and trust are
only possible if persons enjoy privacy and accord it to each other." This argument
goes a step further than Brandeis and Warren, arguing not that privacy means protection
_from_ a type of harm, but that it _enables_ a type of relationship that would not be possible
without it. Part of the way that we make certain relationships special is by sharing
things with people that we would not share publicly. The ability to _not_ share information
about ourselves is what makes choosing to share that information an expression of trust.
This also extends the idea of privacy from something that is valuable to _a person_, because
it protects them from harm, to something valuable to _more than one person_, because it
facilitates a relationship between them.

Later philosphers continue to develop this idea of privacy as a social value. The SEP quotes
Priscilla Regan, writing in 1995 "Privacy is also a public value in that it has value not just 
to the individual as an individual or to all individuals in common but also to the democratic 
political system. Privacy is rapidly becoming a collective value in that technology and market 
forces are making it hard for any one person to have privacy without all persons having a similar 
minimum level of privacy.” My favorite example of this was given in a lecture by Eben Moglen,
where he describes making fun of a colleague who refused to share his social security number
with some service provider, (paraphrasing) "You know that the data miners already have it, right? They know
the social security numbers of everyone else born in Chicago between 1950 and 1965. Yours is _the other one_."
This gives rise to the idea of a kind of society-wide value of privacy--the value of certain things
not being known about large groups of people. The documentary _The Social Dilemma_ (2020)
makes a case that it is harmful for advertisers (especially political advertisers) to be able to
target certain groups of people based on things like whether they are likely to believe
conspiracy theories.

I gave this post the number 000 instead of 0 for a reason. When you want a computer to order things correctly,
you need to always use the same number of digits in all your numbers, so that 11 doesn't get 
sorted earlier than 2. This numbering system means that I can write up to 999 posts on the subject
before any of them gets sorted incorrectly. I don't really think 999 would be enough, but it's more
than I'm likely to write, so it's sufficient for my lifetime. After going down this rabbit hole for a Saturday,
I'm left feeling a little more optimistic than I was when I started. I don't feel like the bewildering
array of "privacy controls" offered by existing social networks are a very good way to advance _any_ of the
definitions of privacy I've summarized here. I was worried that not wanting to make privacy controls _like that_
might lead me to the conclusion that privacy itself is overrated. That hasn't happened. I think that
privacy can be understood in a number of ways, each of which has value in a particular context. It
is appropriate for social media tools to have privacy controls based on their context, whether that's 
an official public blog like this one[^5] or a chat room between friends. It doesn't seem especially
difficult, when designing systems for personal use by public or private individuals, to use these concepts of the value
of privacy to do an acceptably-good job of protecting what ought to be protected and valuing what ought
to be valued. I'll refer back to these ideas as I build stuff, and hope to revisit and elaborate on them.

[^1]: I really try to avoid using scare quotes, because they are a way to imply that something is maliciously-other-than-it-appears without having to justify or be accountable for that implication. So, to be explicit: the portrayal of certain social network features as privacy controls is [evil and rude](http://www.catb.org/~esr/jargon/html/E/evil-and-rude.html). One important aspect of privacy within a social network is privacy _from the network operators_. To call a set of features "privacy controls," and to not include in that set of controls robust options related to one's privacy from the network operators is recklessly misleading. Such robust options would have to include "do not allow advertisers to target ads to me based on metadata you have about me, such as what I look at or interact with" and "please only base the content of my feed on what I have explicitly asked to see, not any other internal representation of what I am likely to want to see" among others. Note that the requirement to provide these options is not the same as requiring that every person opt in or out of them in every situation.

[^2]: I assume that the goal of those controls is so that you can control "what content is seen by what other users of the social network," but most of the people I know who actually want that control simply use two different accounts, a public one and a private one. This suggests to me that the controls fail at their job, either because they simply don't work or because they're harder to use than the "two accounts" alternative.

[^3]: Another dimension of privacy that I'm not able to adequately explore here is its importance in feminist thought. From the encyclopedia entry, "...it can be said in general that many feminists worry about the darker side of privacy, and the use of privacy as a shield to cover up domination, degradation and abuse of women and others...The challenge is to find a way for the state to take very seriously the domestic abuse that used to be allowed in the name of privacy, while also preventing the state from insinuating itself into all the most intimate parts of women’s lives."

[^4]: and it's _full_ of bumper-sticker bangers like "When personal gossip attains the dignity of print, and crowds the space available for matters of real interest to the community, what wonder that the ignorant and thoughtless mistake its relative importance. Easy of comprehension, appealing to that weak side of human nature which is never wholly cast down by the misfortunes and frailties of our neighbors, no one can be surprised that it usurps the place of interest in brains capable of other things."

[^5]: Unlike almost every other blogger out there, I have been informed by my managers at Self-Funded Internet Weirdo, IRL, that I actually _am_ speaking on behalf of that august organization, and that their horde of expensively-clad lawyers actually _does_ intend to defend until lunchtime any utterance I care to make.
