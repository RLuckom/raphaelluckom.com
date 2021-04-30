---
title: "On Security 004: Threats applicable to personal social media systems"
author: "Raphael Luckom"
date: 2021-04-30T17:17:00
draft: false
meta:
  trail:
    - practitioner-journey
    - security
---

In previous posts, I've discussed [security as appropriately protecting value](https://raphaelluckom.com/posts/on_security_000.html),
some [specific values to protect](https://raphaelluckom.com/posts/on_security_001.html) within the context of personal
social media systems, a [specific conceptual approach](https://raphaelluckom.com/posts/on_security_002.html) useful for
planning security controls, and the [distributed collaboration used in important controls](https://raphaelluckom.com/posts/on_security_003.html).
We saw that security is not _just_ about enforcing restrictions on _who_ uses a service; it also includes the design
of the service as a whole. If a service has a malicious goal, such as collecting data on the people who use it for advertising,
then, from the perspective of a person who prefers not to be surveiled, there is no secure way to use that service.
Conversely, a system that is meant to offer something to the public, such as Wikipedia, may be secure for many
users even _without_ restrictive security controls.

There's a name for the process of evaluating the security challenges that apply in a given service or context: _threat modeling_.
The goal of threat modeling is to understand _who_ might try to attack a service, _how_ they might try to attack it, and what their _goals_
will be in attacking it. If we were doing threat modeling for a bank, we might include physical attacks by bank robbers, fraud by
bank employees, and malicious interference by competitors. These threats manifest in predictably-different contexts, so the security
strategy should include controls in each context that mitigate against the relevant threats. In this post, I want to walk through
a threat-modeling exercise for the type of personal social media system I'm building, to describe how I see the landscape. Throughout
this conversation I'm also going to use the concept of _defense in depth_, which refers to the strategy of layering defenses so that
even if some of the defenses prove vulnerable, the attacker's options remain limited by others.

#### Direct attacks
I define a _direct attack_ as any malicious action that tries to interfere with the intended and authorized use of the service.
This would include:

1. People with grudges or biases against the system owner. This type of attacker would intend some type of physical, emotional,
   or reputational harm against the system owner. They might send abusive messages, attempt to deface the site by breaking
   the auth mechanisms and posting their own content, or try to flood the system with requests to raise the cost of operating it
   to unacceptable levels. They might also try to take information _out_ of the system to use elsewhere in malicious ways.
2. People who want access to the system's resources. This system can _process information_, _store data_, and _publish documents_;
   any of those capabilities could be a target for resource-motivated adversaries. When attackers go after computing resources,
   they're often trying to mine cryptocurrency[^1]. Another common objective of this type of attack is to use the compromised site
   in phishing attacks, such as by sending phishing emails or impersonating other websites to try to collect secret information.
   There are also ransom attacks, where an attacker encrypts the legitimate owner's data and demands a ransom to decrypt it. Finally,
   there is a category of spam attacks like comment- and pingback spam, where the attacker's goal is to publish inbound links
   to their own site.

The attackers in the first category have a goal of abusing, intimidating, silencing, slandering, etc. In general, those goals require
some level of access to the person they're trying to attack. This blog, for instance, is pretty secure against those kinds of attacks; 
it doesn't have a way to message me or post comments. If those kinds of attackers wanted to come after me, they'd be more likely
to target my email or other social media accounts. However, if we're talking about _building_ personal social media, we obviously
have to assume that at some point we _will_ allow comments and DMs, so we can't declare victory on the basis of a static blog. _When_
we start to allow that kind of outside interaction with the site, we should include some controls:

1. All mechanisms of interaction should be able to operate on an allow-list basis. That is, the site operator can choose to only accept
   comments and DMs from previously-approved friends[^2]. Obviously, the site operator would _also_ have the option of allowing comments
   and / or DMs from anyone if that's what they wanted.
2. Attacks that aim to _silence_ the service operator, such as by flooding the service with requests to raise the cost of operating the
   service beyond the operator's means, could be mitigated by putting the site into a special _private mode_. In private mode, the site itself
   would shut down, but pre-approved friends would be able to read the site materials directly from the S3 buckets where they're stored. If you
   wanted to provide public access, you could encourage friends to relay that content via their own websites. This would allow the service
   operator to counter distributed denial attacks with federated distribution, and keep the originator of the information safe from the
   effects of the attack. (Note that I haven't implemented this yet; it would probably take some time to do but similar systems exist)

The attackers in the second category have a goal of using the system's _resources_ for their own purposes. We can think of these attacks as
"not personal"--they might make us feel violated and unsafe, but their structure and deployment patterns follow predictable economic logic.
The attackers are trying to _benefit themselves_ by using our resources. If we can prevent the attackers from realizing any benefit from their
actions, they will not go out of their way to bother us.

The construction of this system gives us some amount of blanket protection against attacks like this. As an attacker, the best-case scenario
is to find an insecure service, like a blog platform still using the default password, and then use it to install _your_ program on the vulnerable
computer. That way, the computer running someone's old blog is _also_ running your bitcoin-mining software in the background. However, in this system,
there _are no_ always-on servers that an attacker could install a program on. There are only on-demand functions that run in response to requests.
For another challenge, _even if_ an attacker could send a request that somehow "took over" one of the functions, the functions are limited in both
runtime and memory. Whatever the attacker wanted to do would have to take less than a few seconds and not require much memory. Further, the attacker
would have no way to "save" any changes to the function; when new requests come in, they generally[^3] see a fresh copy of the function. The function
is not able to modify its own source code[^4]. This basic protection could be strengthened with additional guards against excessive resource
use, and if I become aware of credible threats I'll do so.

I will also note here, though it contradicts my definition of "direct" attack, that the IETF [defines pervasive monitoring as an attack](https://tools.ietf.org/html/rfc7258).
I wholeheartedly agree, and that attack is made much more difficult in a federated system like this, since there's no center from which to monitor everyone.

#### Attacks _through_ Counterparties
I define an _attack-through-counterparty_ as an attack against a site operator _via a service provider or other collaborator_. For instance, if someone
convinced AWS that we were violating their terms of service and got us kicked off, that would be an attack through AWS. If someone compromised
AWS security to attack our site, that would also be an attack through AWS.

I'm not especially concerned about this, frankly. We all saw Parler get kicked off AWS; in my opinion that was an example of the system _working_.
One should not be threatening violence against people or engaging in hate speech, and I won't lose sleep over the fact that this system isn't
built to provide cover for people who want to do those things. One should also note that these systems make the service operator a _publisher_: that is,
you are responsible legally for the content that you publish. There are no technical measures that can substitute for community norms (including libel and slander laws)
and good judgment[^5].

Payment-processing is another context in which we see counterparty attacks; this takes the form of things like chargeback fraud and restricting access
to services in ways that hurt vulnerable populations. This is also an area where I'm not confident in the durability of technical solutions; these
types of denials are usually arbitrarily and unappealably enforced by humans in the relevant organizations, so I suspect that social solutions are
required.

#### Attacks _by_ Counterparties
In certain situations one is vulnerable to attacks _by_ a counterparty. On the internet, one of the most common types of attack-by-counterparty
is _lock-in_, where a service or vendor deliberately makes it difficult to migrate away from their product. This can work in a few different ways;
in some cases, such as the online marketplace etsy, the service controls the link between a seller and their customers; since the seller knows
that many of their customers are unlikely to follow them off the site, they need to accede to whatever policy changes etsy feels like making. Other
times, data itself is the anchor that facilitates lock-in; the service makes it hard to export data in a convenient format.

What types of lock-in should this system worry about? There's some good news here. My explicit focus on [state](https://raphaelluckom.com/posts/thinking_about_state.html)
and [preserving artifacts of human attention](https://raphaelluckom.com/posts/practitioner_inn_000.html) means that this system is designed
to prioritize its operator's direct access to their data. At any point, all the data you've added to a system like this will be in an S3 bucket,
able to be downloaded onto a file system at a moment's notice. But that's not really a complete answer. Part of the _value_ of social media data
is that it's social--we should try to make sure that the operational parts of this system aren't going to lock us in either. And again, I turn
to the design of this system as the mechanism for doing that.

Most of the AWS services this system uses are not unique to AWS. Other cloud vendors provide object stores that function like AWS S3. Others provide
on-demand functions like Lambda. Terraform, which I use to organize and deploy this infrastructure, is a configuration language that can seamlessly combine
infrastructure from different vendors. There's no particular barrier, in this architecture, to leaving the main data in S3 buckets but using a Cloudflare
CDN to serve it instead of the equivalent AWS service (confusingly named Cloudfront). That is, this system is itself federatable--it should be able to
adapt to a changing foundation of service providers. So from that perspective, this system represents my best effort in that direction.

There's one other type of lock-in to worry about: me. Right now, I'm the only one who understands this code. I like to think that an experienced
practitioner would be able to pick it up in a few weeks of study, but that has yet to be demonstrated. Another type of counterparty attack that a
code author can try is a licensing attack, where the author uses some type of restrictive license or EULA to impose contraints or seek rents from
people who use that software. So far I haven't settled on a license under which to release this software. I'm thinking maybe the [AGPL](https://www.gnu.org/licenses/agpl-3.0.en.html),
since it seems to be the one that corporations find scariest. 

----
These are the specific threats that have been most on my mind as I build this system. Fundamentally, I want to help people establish secure
spaces for themselves online, free from every type of threat and coercion that I can think of a way to prevent. I think of this as analogous
to building houses--they need to be highly stable and secure, but in a lot of cases that _doesn't_ have to mean that they're _complicated_.
If we focus on the specific _capabilities_ that we want, and then carefully think through how to appropriately protect value in the context of
those capabilities, _and_ if we embrace pluralism with respect to people whose choices and preferences are different from our own, sensible
answers always seem to present themselves.

[^1]: This was definitely a thing as recently as a couple years ago; I'm not sure if it still is but I suspect that it is. In general,
      I assume that an attacker who is able to execute code will _always_, one way or another, be able to generate cash. Note that this
      works for attackers specifically, not service owners, because the attacker doesn't care that they're being inefficient--if an attacker
      makes $0.10 but their actions cost the service owner $1.00, the attacker comes out $0.10 ahead. If the service owner does the same thing
      themselves, they're out $0.90.

[^2]: Borrowing a technique from existing federated services, the way this works is that each person's site publishes a special [_public key_](https://en.wikipedia.org/wiki/Public-key_cryptography)
      to their website. The details are complicated and math-y, but public-key cryptography provides a way to verify that a message actually
      comes from the person who owns a given set of keys. That way, if my website publishes a public key, there is a way to verify that a given message actually
      comes from the owner of that key (me, unless it gets stolen).

[^3]: When a request comes in for the first time, AWS reads the function's source code and wakes up an _instance_ of the function. The instance
      handles the request, and then AWS keeps it around for a few seconds in case any more requests come in. If an attacker compromised the function
      on the first request, _and_ other requests were coming in immediately after it, the subsequent requests might be handled by the compromised
      instance. But once that instance was no longer needed, it would go away. Additional requests would be handled by a fresh instance created from the
      original source code. This means that to _sustain_ an attack beyond a few minutes, the attacker would have to be constantly sending requests
      to the system. Since the actual resources available on a successful attack are small, and the cost of a sustained attack is relatively high,
      the system as a whole represents a poor target for this type of attack

[^4]: Within every public cloud system, permissions are on a "deny by default" basis. That means that if you want a service, like a lambda function,
      to do _anything_, you need to explicitly allow that thing. So in order for a function to be able to modify its own source code, the function
      would need to have been given permission to do that when it was deployed by terraform. No function in this system has such permissions, or is ever
      given access to any credential that has such permissions.

[^5]: In many jurisdictions there are anti-[SLAPP](https://en.wikipedia.org/wiki/Strategic_lawsuit_against_public_participation) laws on the books
      that are intended to protect vulnerable speakers against legal intimidation by powerful actors. I'm not sure how well they work, but that seems
      to me like the right direction to go in for protecting certain kinds of speech.

      There's another aspect of this that deserves attention: the concept of moderation. A federated system like the one I'm proposing does not
      really allow for strong, centralized moderation. Because each system operator controls their own site, there's no good way for _any_ central
      authority to moderate content, except through a mechanism like the courts (and that only in cases where the content is not private). I'm not sure
      that is avoidable--I think that giving that much authority to anyone is more dangerous than the consequences of giving it to no one. I'm also
      optimistic that a federated system wouldn't amplify hate speech the way traditional social media does. I've [discussed](https://raphaelluckom.com/posts/profit_and_misinformation.html)
      the mechanisms by which centralized, corporate social media tends to surface shocking and offensive content because it fuels engagement and 
      engagement fuels ad sales. In a federated network of the type I'm describing, there _is no_ central algorithm akin to facebook's or twitter's feed,
      trying to show you whatever will hold your attention. Instead, _your site_ would decide what to show you; the obvious choice would be to simply
      see your friends' most recent posts, but practitioners could write and distribute other algorithms. A site operator could choose to install whatever
      algorithm they wanted. And there are patterns for collaborative content moderation among groups of people; Alexander Cobleigh's [TrustNet](https://cblgh.org/articles/trustnet.html)
      system is a wonderfully well-explained proposal for collaborative moderation, though I'm not sure if it's been implemented widely.

      I see this tangle of values as one of the things that divides the social justice movement in the United States. It's hard for me to tell, from
      one speaker or group to another, the degree to which they could countenance a system like this, that explicitly chooses to trust its operator
      even if they're racist or hateful. I feel especially concerned when I hear people expect _software practitioners_ or _businesspeople_ to be able 
      to solve this problem--to somehow invent a system that preserves the good parts of speech but prohibits the bad parts. There _is no_ technical
      solution to that problem; it is a social problem. The most successful social media technologies we see in the US--the big social media companies--
      see their societal responsibilities as an afterthought at best, and thus tend to ignore criticism on that front. If we want to see better technologies
      emerge, we're going to have to normalize realistic expectations about what's possible, and well thought-out shared goals.
