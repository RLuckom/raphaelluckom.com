---
title: "Mid March Check-in"
author: "Raphael Luckom"
date: 2021-03-13T14:14:00
draft: false
meta:
  trail:
    - check-in
---
In my [previous](https://raphaelluckom.com/posts/early_march_check_in.html) check-in post I wondered what
I should do next, now that I have an access-control system. When I need to make a decision like that, I try
to give myself a few days of not-very-much-work. I look through the code for little things to clean up. I
reorganize things over and over, without really changing the details, until I'm happy with them or bored. I
explore any interesting rabbit-holes I noticed, and try to plan out work I'm not sure I want to do yet. Above
all, I cut myself slack. Take a nap. Watch someone [rebuild an engine](https://www.youtube.com/watch?v=gq1PseOe7Ik) because
I always wanted to know what's inside. Watch a [documentary on the Bauhaus](https://www.youtube.com/watch?v=2a45UBCIbJc),
notice the possibilities and the vulnerabilities of optimistic artistic/industrial movements in times of rising fascism.
When I'm coming off a period of structured focus it just takes time for my mind to get back to a neutral posture,
the kind of calm attention that I want for making decisions. I've never had a job where I would have felt comfortable
doing that--clocking out at 10AM after doing a half hour of work, announcing "I don't feel like doing this right now"
and not having to justify myself or burn through vacation time or have to "make it up" later or feel like I was getting 
special treatment because I was "one of the productive ones"--but  with every week that passes I get more and more confident 
that this will be the most usefully-productive year of my career so far. Rest works. Feeling secure works. Feeling uncoerced
works. And as [I've said before](https://raphaelluckom.com/posts/hard_work.html), I strongly reject the explanation that this
is something I've "earned" somehow, or that I should think of it as a "privilege." It's not a privilege afforded to me; it's a
natural human right that's denied to almost everyone else. As a creative species, we are operating at 10% efficiency, maybe
less, because _everyone is stressed out all the time about basic things_. There is no other natural resource that we squander and misuse like human
potential, and no other resource we could tap as quickly to solve every problem that we face. But I digress; now I'm feeling
rested and I think I know how I want to move forward. There are a few different threads to tie together; I'll try to show what
they are over the rest of this post. If I manage to convince myself by the end of it, I'll know I'm ready.

There are three (or two-and-a-half) things that appear to be real candidates for the next couple months of work:

1. I could work on building administration tools into the site design I have now
2. I could work on integrating an existing standard for how sites can talk to each other
3. I could work on documentation so that other software writers can build on what I'm doing more easily (this
   is similar to #2 because both prioritize the participation of the existing software- and standards-writing communities)

It's worth a digression into the existing ways that sites can talk to each other. This discussion needs two words
to be clearly defined: _protocol_ and _taxonomy_. A _protocol_ is an explicit procedure for doing something, like the
set of things you need to do to mail a letter, including the envelope, the way to write the address, the stamp, etc.
A _taxonomy_ is a categorization of things, like "the different types of mail you can send"--first class, priority, media mail.
A taxonomy both defines and limits the area it covers: if you want to mail a thing, you have to pick one of the existing categories
of mail; you can't define your own.

When we think about websites talking to each other, we care about both protocols and taxonomies. The _protocol_ is important
because the website that sends the message and the website that receives the message need to agree about how that interaction
should work. The _taxonomy_ is important because different types of message have different characteristics; a public tweet is
different than a blog post and both are different than a direct message. Every type of message requires almost a whole website-worth
of user interface--entire systems like twitter and instagram can be devoted to one or two types. Those types, in turn, influence
the character of the system, its personality, the human interactions that take place there. One is tempted to underestimate the
amount of work involved in coming up with those types and their behaviors, because there are familiar forms that seem to
obey something called "common sense" rules; obvious in a no-I-can't-define-it-go-away style, the hallmark of offloading the
cognitive dissonance of the world onto someone you don't want to help but won't hesitate to blame. These things are _hard_, and
the best case scenario of getting them right is that no one notices. Faced with that kind of rock face to climb, it's a good idea
to poke around for a bit in case someone's left a cheeky ladder propped up nearby.

Indeed, when we look around, we find several promising and well-developed candidates from different communities with different focuses.
In no particular order:

1. __[Microformats](https://microformats.org/wiki/microformats2), 
   [Micropub](https://www.w3.org/TR/micropub/), 
   and [Webmentions](https://www.w3.org/TR/webmention/)__: Microformats are a way of adding smantic labels to otherwise-standard HTML,
   basically describing structured ways to construct and read types of information, like "a personal profile" or "a comment on a blog post"
   within the existing structure of a web page. Micropub is a protocol for sending and receiving messages of those types, and webmention
   is a related protocol for notifying systems when someone publishes those types of messages. These standards have evolved primarily out
   of the Indieweb community, which continues to use and maintain them.
2. __[ActivityPub](https://www.w3.org/TR/activitypub/)__: ActivityPub is a set of protocols for sending and receiving messages, either
   between websites or from a client application--like a browser--and a website. Instead of defining its own taxonomy, ActivityPub uses
   the published [vocabulary](https://www.w3.org/TR/activitystreams-vocabulary/) of the [ActivityStreams 2.0](https://www.w3.org/TR/activitystreams-core/)
   _syntax_. Basically, ActivityStream's vocabulary contains a few basic building-block types, like defining the concept of an "activity,"
   and also defines a way to create new building blocks. The social network software [mastodon](https://mastodon.social/about) is the most
   visible implementation of ActivityPub.
3. __[Secure Scuttlebutt (SSB)](https://dl.acm.org/doi/pdf/10.1145/3357150.3357396)__: SSB is a family of protocols for building distributed
   applications. One of its core concepts is the [gossip protocol](https://alvaro-videla.com/2015/12/gossip-protocols.html); a way to spread
   information (including securely access-controlled information) throughout a network without relying on a central hub or even, necessarily,
   internet connectivity.
4. __[Matrix](https://matrix.org/faq/)__: Matrix is a protocol and taxonomy for chat clients; it proposes a way to build standardized chat systems
   without requiring a central hub.
5. __[Atom](https://datatracker.ietf.org/wg/atompub/documents/) / [RSS](https://en.wikipedia.org/wiki/RSS)__: Atom and RSS are both widely-deployed
   protocols and vocabularies for syndicating content, used mostly for blog posts and articles.

All of these are reasonable and interesting designs. All of them also pass the critical bar of having _working implementations_--that is, there are
programs designed to follow the standards and there are people who are satisfied enough with those programs to use them regularly. As a lifelong not-expert
in applied human sociality, I would _much_ rather use these kinds of indicators--who uses a thing, for what, and how do they feel about it--as a guide
to what already works, rather than trying to "logic" my way to "what people will like" from some set of axioms.

Of course, as I said before, even a small number of message types are a massive amount of work to support well--like potentially an "all the effort that goes
into Twitter" amount of work. And since there are definitely five different protocol / taxonomy things that I already know about, and doubtless
even more that I don't, there's a bit of a target-selection problem. Knowing how I work (slowly, inquisitively, independently),
and using as a guideline the fact that it took me a month to be satisfied with an OAuth client implementation (another example of following
an existing specification), it would realistically take a couple of months for me to build a solution that I'd be happy with. And what I'd have, at the
end of it, would be a system embodying the character, personality, and social context of whichever set of standards I'd chosen. It would be a
big investment, is what I'm saying. And I can't really decide on a good set of criteria for deciding which of these things would deserve that investment
more than the others.

I occasionally mention the tools I use for building this system. Two of them, [exploranda](https://github.com/RLuckom/exploranda-core) and 
[donut-days](https://github.com/RLuckom/donut-days), are code libraries of my own design that make it easier to design back-end processes like
the HTML-rendering code for this website. A third is [terraform](https://www.terraform.io/), and the small [library of terraform modules](https://github.com/RLuckom/terraform_modules)
that I maintain. None of the three is really suited to building social media interfaces--the actual screen layouts that let you author and
read social media. In fact, I've never really made a tool for interface construction that I was happy with. It would need to meet the bar that I set
for the others; it would need to be conceptually simple, flexible, and package-able; it would need to fit in seamlessly with the rest of my tools,
participating with them in the task of the overall system; it would need to be something that makes me happy to use.

So here's the situation as I see it:

1. There are a _lot_ of reasonable candidates for "how a social media system ought to work" and the kinds of things that it should enable you to do.
2. Each candidate requires _infrastructure_, _process code_ and _interface code_.
3. I have tools I like for building _infrastructure_ and _process code_, but not _interface code_.

You can probably see where I'm going with this. What I would like to do next is to explore ways of building interfaces and evaluate each, as I've done
with infrastructure and program design, in the context of the ethical and pragmatic choices it makes. Out of that exploration I intend to arrive
at a tool that works well for me; either one like terraform, which is published by someone else but embodies design choices I like, or one
like exploranda and donut-days, which I maintain so that I have a natural way to work. Over the next few weeks I hope to report progress in this effort,
both in terms of what Im learning and thinking, and what I'm prototyping and building. Stay tuned!
