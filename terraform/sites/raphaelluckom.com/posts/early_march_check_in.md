---
title: "Early March Check-in"
author: "Raphael Luckom"
date: 2021-03-07T14:09:44
draft: false
meta:
  trail:
    - check-in
---
As a resident of an area with a northern [humid continental climate](https://en.wikipedia.org/wiki/Humid_continental_climate),
I do not miss February when it leaves. Winter here is heavily back-loaded; you expect calendar-photo
snow pillows in December, but most of what you actually experience is freezing rain and wind from the middle of January
until the end of April. It's a slow and unpleasant trudge of a season, with a few nice days and flamboyantly beautiful
storms thrown in just to get your hopes up.

This year I've chosen to observe Trudge Season in style, by holing up in my office and adding private spaces
to the deployable system I'm building. In my [first february post](https://raphaelluckom.com/posts/early_february_check_in.html)
I signaled that I'd be going in this direction; since then I've presented an [implementer's description](https://raphaelluckom.com/posts/login_system_notes.html)
of the design I'm using, followed by a [first look for non-practitioners](https://raphaelluckom.com/posts/on_testing_001.html) 
that used tests as a framing device for communicating how it works. Throughout, I made the traditional appeal
to the gods of both Trudge Season and the process of writing software in general: "just two more weeks." Well, 
something odd happened yesterday. I ran my access control system tests and the results came back looking like this:

```
43 specs, 0 failures
Finished in 2.042 seconds
Randomized with seed 67375 (jasmine --random=true --seed=67375)
------------------------------|---------|----------|---------|---------|----------------------------
File                          | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s          
------------------------------|---------|----------|---------|---------|----------------------------
All files                     |    97.4 |    89.35 |   98.11 |   97.39 |                            
 spec/src/cognito_functions   |    97.2 |    83.08 |   98.12 |   97.19 |                            
  check_auth.spec.js          |     100 |      100 |     100 |     100 |                            
  http_headers.spec.js        |     100 |      100 |     100 |     100 |                            
  parse_auth.spec.js          |     100 |      100 |     100 |     100 |                            
  refresh_auth.spec.js        |     100 |      100 |     100 |     100 |                            
  sign_out.spec.js            |     100 |      100 |     100 |     100 |                            
  test_utils.js               |   94.58 |    83.08 |   96.34 |   94.51 | ...189,203-204,251,866-886 
 src/cognito_functions        |     100 |      100 |     100 |     100 |                            
  check_auth.js               |     100 |      100 |     100 |     100 |                            
  http_headers.js             |     100 |      100 |     100 |     100 |                            
  parse_auth.js               |     100 |      100 |     100 |     100 |                            
  refresh_auth.js             |     100 |      100 |     100 |     100 |                            
  sign_out.js                 |     100 |      100 |     100 |     100 |                            
 src/cognito_functions/shared |   94.89 |    83.72 |   97.62 |   94.89 |                            
  shared.js                   |   94.92 |    90.32 |   97.14 |   94.92 | 19-28,114,353              
  validate_jwt.js             |   94.74 |    66.67 |     100 |   94.74 | 35                         
------------------------------|---------|----------|---------|---------|----------------------------
```

You have to imagine here the process of cutting a tunnel through a mountain. Within the darkness, very little ever
seems to change; one swing of the pickaxe doesn't move you appreciably closer to your goal; one trip with the wheelbarrow,
moving the spoil from the rock face back out into the world, is not noticeably longer than the last. But over time you
do move, and at some point the sound of the pickaxe suddenly changes from a bell-clear _ting_ to the scrappier _crunch_
of rocks tumbling into space. And then you're through, and there's nothing more to swing at. That's what these test results say.

Other aspects of the metaphor hold true as well. There's a lot more to mining than breaking stone and moving it around;
just because you've made a hole that goes through a mountain doesn't mean that it's stable, or that it's the right size,
or that its start and end points are in the right places. In the same way, there are limits on what these test metrics tell me;
they say that the tests exercise nearly all the code. The other things I care about--that the code _does the right things_, that the tests
_actually verify that_--there are no metrics, in the entirety of software-writing as a practice, that meaningfully verify those things[^1].
At the end of the day, whether you're talking about google or facebook or me, it just comes down to decisions made by people[^2].
So here I am, blinking a little at the light and shaking the rock dust out of my beard and eyebrows. I've been doing one thing for almost
exactly a month--my first access-control-system work was on February 6--and now it's time to move on to something else. 
I can think of several different directions I could take next:

1. I could start designing actual private areas of the site to go behind the login system--things like traffic counters and other
   monitoring and administration tools.
2. I could focus on allowing systems like this to _talk to each other_; such as by working on messaging systems and content-organization
   systems.
3. I could take the existing blog design I have and simply stick it behind this security system; this would be useful for people who want
   a private space online to journal, and who don't really want to post publicly. I think there are a lot of people who would like that. It would
   also give me an opportunity to integrate the security system with a real use-case sooner rather than later, which would be nice.
4. I could focus on documenting this system in a way that would be more accessible to experienced software writers, so that they could build easily on
   what I've done so far.

I haven't decided which one to do yet; posts like this are part of the process I use to make those decisions. It's an opportunity to restate
my goals and evaluate how each option might help me acheive them. 

In my [check-in](https://raphaelluckom.com/posts/early_december_check_in.html) from December I proposed a goal that seems relevant
to my situation now: "the most important and ubiquitous systems must recognizably belong to _each person individually_, to shape,
compromise, adapt, and defend, as they are moved." That is to say, systems that reflect compromises between all the humans in a group
_should_ give each of those humans an opportunity to assert their experiences, values, and beliefs in the design of the system. I doubt
this principle is _sufficient_ to get us to a good system, but any way I think about the challenge, this seems like a _necessary_ part
of any solution. Everyone gets a say; even people I don't like, even people who I think are trying to take advantage. The communal task
is to articulate a set of criteria for the system to aim at--not to play whac-a-mole against the emergence of disfavored philosophies
and personalities, but to positively describe and evaluate _good outcomes_, and help bring them into being and protect them.

If I'm honest, that _terrifies_ me. The only thing I can think of that seems _worse_ than letting literally everyone have a say in what the internet
should be is leaving it up to people who succeed within the political and economic system of capitalism. Neither the current population of the world
nor its leadership has demonstrated _anything like_ the level of responsibility, thoughtfulness, and humility required for this design task. But
I don't know of anyone else available, and I like my odds with the former more than the latter.

If I treat that decision as settled--that this system really needs to be composed of individual pieces under the control of its users--then
I can articulate some obvious risks. Should there be _any_ checks on that individual control? To take a fairly benign example, what happens
if a hundred people start using this and then I notice a security vulnerability? Should I have a special backdoor[^3] that lets me push security
updates in such a case[^4]? What if I want to restructure things but the upgrade path is too complicated for non-practitioners? What if my
savings run out, or someone on the internet is so mean to me that I give up and decide to spend my time as a potter or a weaver or a clothing-mender,
leaving everyone using this system unsupported? What if lots of people start going in different directions (as, frankly, we should assume they will)
and fights break out that do not have obvious right and wrong sides (see previous)? I think that I have some ideas that are good, and
some ideas that are bad; some conclusions that are well supported and others supported only by harmful biases I don't yet have the imagination to recognize.
I expect that these things are true of me because they seem to be true of all people and I'm a person. But I don't have any way of telling which
conclusions are which besides listening to other people. And deciding which people to trust is one of the challenges.

I'm not ready for that right now, which is to say that it may be as long as a month or two before I expect to release another
deployable exercise. With each additional capability, this system has more potential to take off prematurely--to invite reliance by inexperienced practitioners,
or exploitation by experienced practitioners, in ways that would ultimately do more harm than good. Over the next week or so I'm going to do some housekeeping
tasks and think about the way forward. If you have any thoughts I'd love to hear them.

[^1]: There are techniques that use formal logic and mathematical proofs to guarantee specific things about programs. I once worked
      on a project that used formal logic to "prove" that a robot motion-planner would always follow the rules of the road. These
      types of projects are very interesting, but they have a [streetlight effect](https://en.wikipedia.org/wiki/Streetlight_effect) quality
      to them. They start with an assumption like "the robot can correctly recognize everything that might be on the road"
      and then, using that assumption, they "prove" that the robot will respond correctly based on some standard. In my project (which
      was never considered for use in any real robot) the standard of correctness we chose was the Massachusetts driving manual
      published by the Registry of Motor Vehicles. To further give the project the best chance of success, we decided that we were specifically
      going to demonstrate correct behavior at stop signs, as an example of how we could meet each driving rule individually. After carefully narrowing
      down the problem this way--first assuming that we knew everything about the environment, and then deciding that we were going to focus
      on one specific and well-defined set of situations and goals--after isolating the tiniest sliver of the problem we could possibly
      think of, you can imagine how it felt to find, in the [official driving manual](https://www.mass.gov/doc/chapter-4-rules-of-the-road-0/download),
      the following line:

      > Four-way stop intersections can cause confusion. Try to make eye contact with the drivers of other vehicles to judge their intentions and avoid crashes.

      Whomp, as they say, whomp. I stand by my assertion that formal methods do not verify that code _does the right things_. They verify that code does
      precisely what the proof says it does. There is nothing within human experience that verifies rightness. And I further stand by the assertion
      that "rightness" _is_ the goal, not formal correctness. This is what I mean by the streetlight effect; when it's impossible to measure the thing
      you want to measure, like rightness, but there's an adjacent thing you _can_ measure, like formal correctness, there's nothing wrong with using
      that adjacent thing to get you a bit closer to your goal. But you shouldn't claim to have acheived the goal on that basis.

[^2]: I have a special risk here, which I don't mean to minimize, because I'm working on my own. It's best to get more than one set of eyes on code like this,
      and I haven't yet. I tried to mitigate this by starting from [example code I trust](https://github.com/aws-samples/cloudfront-authorization-at-edge)
      that implemented a [well-defined standard](https://tools.ietf.org/html/rfc6749), and testing it thoroughly. For now I'm done; more eyes would be better.

[^3]: I'm using the term "backdoor" here to refer to any way that someone besides a system's owner can modify it. Backdoors take many forms, and include many
      measures, like automatic security updates, that I would describe as "good." That doesn't change the fact that they're backdoors. This is obvious from the
      metaphor itself--a "back door," in an adversarial context, is an escape route prepared in case the adversary controls the main gate. But once you've created
      such an escape route, you also need to reckon with its potential as an additional point of ingress for your adversary. The task cannot be other than
      __appropriately protecting value__; ultimate success, through intelligence or power or wealth or time, is not an option on the table.

[^4]: I don't intend to make anything like that; I wouldn't want the pressure of maintaining it.
