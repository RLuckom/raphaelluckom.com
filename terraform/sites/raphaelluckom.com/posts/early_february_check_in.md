---
title: "Early February Check-in"
author: "Raphael Luckom"
date: 2020-12-08T12:09:44
draft: false
meta:
  trail:
    - check-in
---
In the [last practitioner journey post](https://raphaelluckom.com/posts/practitioner_journey_004.html), I
introduced a basic serverless[^1] blogging platform. At the end of those instructions, I said that if there was
interest I could describe the theme system and the rendering system, but if there wasn't interest I'd move on 
to packaging the visibility system. I'd like to explore those priorities today.

When do we consider a thing finished? When it _can_ be used for its intended purpose at least one time?
When it meets some performace goal? When it is accessible to some percentage of potential users? When it turns
a profit? When we run out of time?

When we're working on a design and we hit upon a knot of open-ended questions like that, one pragmatic technique
for moving forward is to think about it as a poll instead of as a problem with one solution. Using this framing,
instead of asking "when do _we_ consider a thing finished?" we instead ask "_who_ would consider this thing finished, when?"
This way, we don't need to make assertions about what counts as finished; instead we simply show the thing to a bunch of
people. Anyone who grabs it out of our hands and starts using it--it's finished _for them_. Anyone who doesn't, it's
not finished for them.

One of the things I've realized over the past month is that, for better or worse, a lot of my insecurities are attached
to this question. As I learned to interact with the world, one of the basic dynamics at play was that I had to find
one-handed, or one-and-a-half-handed ways to do everything. This gave me a kind of dual perspective. On the one hand,
I recognize the _social signals_ that an object is "finished"; you can buy it at a store, when you talk about it, people know
what it is, when you look it up online, you can find information about it. Those signals imply finished-ness by proxy--if
a thing is sold in stores, enough people must want one for it to be profitably sold; if people know what it is, then
it's a "normal" part of the world; if there's information about it online, it can be compared to similar things, etc.

On the other hand, none of these signals imply usability _by me_, with my body. For me, there's another step, a kind
of mental translation in which I have to identify which two-handed assumptions seem to be embodied in the design, and
what strategies I can use to adapt the object to my body or vice-versa. In this way, my experience of "finished" artifacts
(as determined by social signals) is probably similar to your experience of "unfinished" artifacts--they require some 
effort on my part before they can be used. This step of translation isn't something that I turn on and off depending on the
circumstance--there's no little referee in my head who looks at a two-handed wood plane and says "yeah try to adapt this one" but looks
at the twitter UI and says "no need to translate here"--it's always present, no matter what I'm doing. It's a habit of thought
that's part of _me_, not a prosthetic that I only use when necessary.

Unless I'm being mindful, this dynamic makes me prone to a kind of offended annoyance when I'm presenting the things I've
made to others. When I hear someone say "that's too complicated" about something I've made, part of what I hear is
that person expressing an entitlement that things should be made simple _for them_--a reminder that for most people
there is no translation step between seeing an object and using it, and they experience that translation step--which is a feature
of my everyday life--as disqualifying the "finished-ness" of things that I make[^2]. This is what I mean when I talk about
_wholeness of experience_, and what I hear when others talk about _intersectionality_: that differences between people
aren't based on attributes in isolation, but extend to include second, third, and higher-order interactions between
multiple attributes, culminating in values, beliefs, and strategies that a person uses to navigate the world. I believe
that this is true of everyone; not just those of us who don't match societal defaults. We are none of us "normal,"
instead, normality and privilege are two views of the same thing.

These pronouncements are fun to make, obviously, but how do they relate to the question of where I should focus next?
Besides, if I'm building up to a conclusion that I can only build things that work for _me_, then what has been the point
of any of this? Here's what I'm thinking:

The blog design I published is rudimentary, but its structure is sound[^3]. As part of a personal social media system,
the _capability_ that the blog system represents is the capability to publicly publish things online. That's not enough
to make a full-fledged social media system. If I improve the blog system I have, I could end up with a good
blog platform. But if I want a social media system, refining my blog platform isn't going to get me there. In fact, it might
make it _more difficult_ to develop a full-fledged social media system--any complexity that I spend on refining the blog
risks limiting the changes I can make when adding other features.

The difference between "blog" and "social media system" seems to me to be interactions between users, or what the
Indieweb community calls using one's site as one's "[primary [online] identity](https://indieweb.org/IndieWeb)." That is,
a social media system isn't focused only on polished, camera-ready content like blog posts; it's also focused on 
meaningful-but-ephemeral stuff like messages to friends, family photos, event planning, etc. Not all of these
things require the ability to publish publicly; a lot of them positively require privacy. This gives us 
two ways of conceptualizing the system; as something that is "basically public (like a website) but with private features,"
or as something that is "basically private (like an email client like Gmail) but with the ability to post _some things_ publicly."
In the first instance, the primary view of the site is what an anonymous visitor on the internet sees; in the second
instance, the primary view of the site is what _you see_ when _you're_ using the site to communicate with others. Is the
site a billboard where you put things for others to see, or is it a portal through which you, the person, are saying,
seeing, and hearing things?

If I focus on "finishing" the blog _now_, it would mean emphasizing and elaborating the public aspect of the system in
preference to the private aspect. I don't think that's the appropriate priority right now. The visibility system--the
system that shows you how many people have viewed your site and how it's working--has a lot of potential to become the
center of the private site experience--the screen that shows you how many visitors you have is similar in function to the
view on corporate social media platforms that shows you your likes, comments, and direct messages. Putting these systems
together, behind a login system that only allows _you_, gives a kind of "driver's seat view" that would be a major way to
compete with the psychological experience of using corporate social media.

So that's what I'm feeling right now, and why I expressed my priorities the way I did. If anyone is interested in the mechanics
of the blog system--that is, if you're ready to grab it and use it but you want me to explain how it works so that _you_ can modify
it to your liking--then I'll be happy to go into detail; having people besides me engaged in this project is one of my highest
priorities. For myself and this project as a whole, the priority is to get the cooresponding private site experience on the board,
so that the overall evolution of the system balances the public and private perspectives.

[^1]: "Serverless" is a tech buzzword that means that an application doesn't require its operator
      to directly manage whole computers in the cloud. Instead, of renting whole computers, serverless
      applications use services like [cloud functions](https://raphaelluckom.com/posts/cloud_functions.html)
      for their compute needs, object stores like S3 for their storage needs, and pay-as-you-go databases
      like DynamoDB. These systems are intended to be easier to administer and scale than equivalent services
      that run directly on servers, and for our personal-social-media use case we should be able to realize
      those benefits. At very large scales, those benefits would be harder to acheive and you'd probably be better 
      off using some servers in key places.

[^2]: When I'm being mindful, this doesn't make me annoyed. Instead, I realize, and to some extent celebrate,
      the skill-of-mind that I've developed through my experience. I _should not_ expect others to have and use 
      this specialized skill, which is not as relevant to their life experience as it is to mine. It does sometimes 
      make me feel a bit alone.

[^3]: There are a couple of bugs that exist in the current iteration--places where the blog doesn't do things
      that is should do based on functions it is supposed to have. There are some number of missing features--things
      that a blog would usually be expected to do that mine doesn't attempt. There are also a couple of pieces of
      what's called _technical debt_--decisions that will lead to problems down the road if not fixed. Specifically,
      the tech debt that I'm most unhappy with is a decision to store the full text of each post in dynamodb as a kind
      of cache for the times when the system needs to construct [RSS](https://en.wikipedia.org/wiki/RSS) and [atom](https://en.wikipedia.org/wiki/Atom_(Web_standard))
      feeds. Thinking as a practitioner, these all seem like solvable problems, which is why I describe the overall
      structure as sound.
