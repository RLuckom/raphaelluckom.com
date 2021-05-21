---
title: "On User Interfaces 000: Expectations and Betrayal"
author: "Raphael Luckom"
date: 2021-05-21T12:32:00
draft: false
meta:
  trail:
    - UI
---

I try to write something every week, between one Thursday (my weekly social media day) and the next. So there's
a kind of "clock start" moment every Thursday when I realize that I need to start thinking about a topic for the next week.
And for maybe the last four weeks, I've sat down thinking that I'd write something about making UIs, only to finish the
week's post and realize that I missed it entirely. So I'm going to give it a shot again this week and see where I end up.

Building UIs is a _trip_--like a mood that extends into the dimension of narrative. It's one of the few domains in
which many of us practitioners can still be made to feel _betrayed_ by the output of a computer program. That's a
more specific feeling than what I would call  _frustration_. Frustration, to me, is when you expend what seems like a
more-than-reasonable amount of effort to accomplish something, are unable to accomplish it, and feel aggrieved.
Betrayal adds _agency_ into the mix--you failed because _the game was rigged_.

Every beginning practitioner knows this feeling well. The structure and meaning of code is just enough _like_ human
language that a lot of what you know about language seems like it _ought_ to apply--that because you _know_ what you want
the computer to do, there should be a natural way to express it. For example, in the language `python`, you measure the length of a `list`
using the function `len`, e.g. `len(["word"])` evaluates to `1`, because the list `["word"]` has one quoted string in it. And 
`len(["word" "otherword"])`..._also_ evaluates to `1`, because list items must be separated by _commas_, _and_ when you put two string literals
next to each other like that, separated only by _spaces_, they are silently concatenated into one string. I remember this
because of how betrayed I felt on the day I learned it. As far as I understood, the expression `["word" "otherword"]` should have been
what's called a _syntax error_ and the program shouldn't have been able to run. It felt less like I'd made a mistake than like
I'd trusted the language and it had pulled the rug out from under me[^1]. _That's_ what I mean by betrayal in this context.

Of course, when you run headlong into enough of these things, you start to learn which little wiggles and jukes will keep them out of your way, 
and that's what I call being a practitioner--someone who practices. And then you find yourself working on a web UI, and, just as in the very 
beginning of your practitioner journey your intuition about _language_ made you expect _computers_ to follow rules that they do not follow, so too, 
when you get to UI development, does your hard-won intuition  about _computers_ make you expect _UI conventions and expectations_ to follow rules
that they do not follow[^2]. The first unpleasant surprise is that the the only standard is now "just make it do what I expect it to do," for values
of _I_ that include _everyone who has or will ever have an opinion on twitter_. That is, to put your hand to UI development is to expose yourself
to judgment in a whole new arena[^3]. The second unpleasant surprise--which can be especially jarring if you've just spent time writing the back-end
code to do the job that your system is intended to do--is that even that intended _job_ is just a guess about what will be sustainable organizationally,
and one of the things that can be "wrong" with "your" UI is _the basic premise of the entire system that everyone in the organization has built_.
It's a lot to ask of a person--especially a person who has self-selected for affinity to the rigid definitional certainty of code--that they also
accept and internalize the logic of this other authority, this changeable subjectivity. When I say that UI development is one of the few domains
in which _experienced practitioners_ can still be made to feel betrayal, that's what I mean. The main technologies for building web pages are loudly despised
by people who look over the fence at them from other software domains, not because of any specific design choices in isolation, but because they represent,
in a single iPhone-thin layer, the entire tsunami of subjectivity that the rest of the practitioner's work doesn't have to acknowledge[^4]. 

If you can come up with the table stakes for this new game--if you can recognize, respect and try to harmonize these competing forces--then the
tools that have arisen within the UI domain take on a different aspect. For instance, [CSS](https://en.wikipedia.org/wiki/CSS), the language for styling web pages,
is less like an infinitely-reconfigurable robot--what one comes to expect from programming languages--and more like a cabinetmaker's toolbox. 
It's hard to tell, from simply understanding what a cabinet looks like, how all those odd-shaped planes and gauges and scrapers somehow
_contain_ the infinite variety of cabinet forms. And it's not _wrong_ to observe that those tools are somewhat arbitrary--their logic comes not
from a progression of one conclusion following another, but a progression of experiences: first wanting one thing and then, having 
gotten it, discovering that one actually wants another, slightly more refined thing but has limited time to modify one's tools before the due date. 
Far from being the domain where one is _most_ able to deliver universal accessibility, UIs are the evolved and opinionated keyholes through which otherwise-flexible
systems can be delivered, in individually-tailored ways, to people who can't[^5] take advantage of that flexibility in its native, conceptual form.

I think this might finally be post that I've been trying to write about UIs as artifacts of human attention. I know where I want to go from here--I
want to make the case that, given this framing, a system where all or most people use the _same_ UI is less accessible than a system that
facilitates the emergence of a kaleidoscope of UIs not all accountable to the same unifiable conception of how a human {wants to/is able to/should}
interact with the system. But that's for another day.

[^1]: I mention python because it was the first language I really learned, so all its betrayals were new betrayals. Most languages
      have traps like this in them somewhere; certainly all the ones I love do.

[^2]: For instance, in _so many cases_, when you are writing software, it's reasonable to expect that when your program is in the middle of a critical 
      operation, it won't then just stop for half an hour for no reason. But when you're building UIs, that's called "lunch," and you're 
      not supposed to complain about needing to make sure your program behaves well when it happens.

[^3]: When I say "expose yourself to judgment," I mean that in the most pragmatic sense--not in the sense of "UI developers _have greater responsibility_,"
      but in the sense of "UI developers are _more accessible to people with opinions_." UI developers' natural habitat just includes,
      in a matter-of-fact, day-in-day-out way, the emotional abrasion of being told that you "didn't do it in a way that _a person_ would understand,"
      where _you_, who did the thing and presumably understand it, don't count as "a person." So, in the sting of each of these little defeats you start
      to collect, like someone on a beach picking up bits of shipwreck, all of the things that you've been told "a person" expects or wants or needs. 
      Over time you find a way to assemble these things into a coherent _model_--not of "a person," exactly, but of _the_ person for whom you are 
      expected to build. Your emotional well-being--the way that you avoid despair--_requires_ that you believe there to be a pattern behind the signals
      you're getting, one that is capable of keeping you safe if you just listen hard enough. And since your community consists of other people who do
      UI development and are in the same situation, you share the burden of constructing this _model_ with them. This investment of communal experience
      in the model imbues it with value independent of whether it's _accurate_ or not. It defines the rules of the game. Attacks on the model--what
      an outsider might call "pointing out that people are not generalizable that way"--appear as attacks on the legitimacy and safety of the community.

[^4]: For a representative example, see James Mickens' essay [To Wash It All Away](https://scholar.harvard.edu/files/mickens/files/towashitallaway.pdf), of which
      a representative sample reads:

      >  Given the unbearable proliferation of Web standards, and the comically ill-expressed semantics of those standards, browser vendors should just 
      >  give up and tell society to stop asking for such ridiculous things. However, this opinion is unpopular, because nobody will watch your TED talk
      >  if your sense of optimism is grounded in reality... My friends inevitably respond with a spiritually vacant affirmation like, “People invented
      >  flying machines, so we can certainly make a good browser!” Unfortunately, defining success for a flying machine is easy (“I’M ME BUT I’M A BIRD”), 
      >  whereas defining success for a Web browser involves Cascading Style Sheets, a technology which intrinsically dooms any project to epic failure.
      >  For the uninitiated, Cascading Style Sheets are a cryptic language developed by the Freemasons to obscure the visual nature of reality and encourage
      >  people to depict things using ASCII art...CSS is not so much a description of what your final page will look like, but rather a loose, high-level
      >  overview of what could happen to your page, depending on the weather, the stock market, and how long it’s been since you last spoke to your mother.

[^5]: "Can't" in the sense in which I "can't" bake a wedding cake--that is, it is a specialized skill that takes effort to learn--effort not everyone 
      can be expected to expend.
