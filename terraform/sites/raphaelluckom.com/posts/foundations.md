---
title: "Foundations"
author: "Raphael Luckom"
date: 2020-09-09
draft: false
meta:
  trail:
    - beginners
---

I've spent the past week building a foundation for my social media alternative
project. Today I want to talk about how to build your own foundation in programming,
especially if you don't come from a STEM background. 

I didn't. In my first year in middle school, my English teacher encouraged me
in creative writing, and I grabbed on to it like it was the thing that would
save me. My parents encouraged me and even helped me beg out of taking a math class
in my senior year of high school. I did a loosely-structured poetry independent study
instead. No one in my family ever tried to get me to change course. They
also knew as little as I did about how one went about making a living as a 
creative writer. We all just sort of assumed that I'd figure something out when I needed
to, which is more or less what happened. At crucial points--being able to go to college,
getting my foot in the door at an appraisal company, having a friend who worked
at a robotics company, being socialized with the default assumption that there
was no type of knowledge or practice from which I would be excluded--I was significantly
helped by privilege. That's how I know that anyone can do this if given
the opportunity--I look back on what _I_ had and I know that if that help and support
were given to _anyone_, they would succeed in building themselves an excellent
and fulfilling life. So if there are real or imagined voices in your life that 
are telling you that you don't have the capacity to do something, please, for me,
invite them to take a long walk off a short pier.

If you want to become good at programming it's very useful to be able to
ignore criticism, because you're going to meet the most pedantic, infuriating
and stubborn Other that you may ever encounter: the computer. Most people
have experienced the kind of impotent frustration that comes from trying
to argue with technology. Programming is very similar to that feeling,
especially in the beginning, with one important difference. When technology
doesn't work correctly for you as a user, _it_ has failed. When it doesn't
work for you as a software author, the only way you can move forward is
to assume that _you_ have failed. To be screwed over by a vending machine
is one thing. To be screwed over by a vending machine _that you built
specifically not to do that_ is another. It is very important to stay
attentive to your own emotional state, and give yourself plenty of slack
to ask for help and encouragement. Doing great doesn't always feel like 
doing great. [James Mickens](https://mickens.seas.harvard.edu/) was known
at Microsoft for building himself a [throne complete with Incredible Hulk fists](https://blogs.microsoft.com/ai/james-mickens-the-funniest-man-in-microsoft-research/),
which is the kind of silly radical self-love that everyone needs.

So where do you actually start learning to program? There are many options,
and the most important thing is to find one where you feel challenged
and excited. For me, that was the 2008 version of the [OpenCourseWare
intro to computer science](https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/lecture-videos/), Today I would use one of the more recent
versions of the class, but I also hope to update the [exercises](https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-00-introduction-to-computer-science-and-programming-fall-2008/assignments/)
from that earlier version as an online workbook. Finding a good set
of exercises is probably more important than finding a good teacher
or set of lectures. Every programming language has good parts and bad
parts, so just pick whichever one seems like the best fit and don't feel
bad about changing your mind down the road once you have more context.

The next step is your _development cycle_. The development cycle is
very simple to describe: you get an idea for some code, you write it down,
you run it, it doesn't work, you fix it, you run it again, etc. There are
fully online tools that work for this; you can google "repl" (short for
"read-eval-print-loop") and the name of the language you want to use
and you'll probably find something you can turn into a development cycle.
Most computers also come with some programming language interpreters preinstalled
(every browser has a JavaScript repl builtin). Choose your development cycle
by how fast it lets you test your ideas--you want to find the way that gets
you from idea, to code, to errors, and back to ideas as quickly as possible,
because that's the speed at which you'll improve.

If this was a movie, this is the part where we'd have the training montage.
Once you have exercises and a development cycle that work for you, expect
a bit of a slog. This is when you're going to feel the best and the worst about
your progress. You'll see how the words that you write do incredible
things with unbelievable reliability and precision, and you'll see how
the search for a single misplaced comma can eat up four or five hours of
practice time. All of these experiences are valuable--they build your
instincts and intuition, which I'm not sure it's possible to get any other way.
If you are intentional about your practice, it is also a good opportunity
for learning to be gentle with yourself in the face of frustration. That
frustration never goes away, but it does mellow out. Try to let it be
the puckishness of a respected teacher--and when you don't have the bandwidth
to deal with it, just step back.

This practice will teach you how to write code in the same way that when
you were little you learned to write your native language. It will start to open up
the world of things that can be done with computers but you will also
start to understand how much of programming is about understanding other
people's programs. Every corner of the programming landscape--web development, 
generic back-end work, robotics, artificial intelligence and machine 
learning--are about as separate from each other as biology is from chemistry is 
from earth science. That is; they share approaches and ideas and ways of seeing 
the world, and each of them includes certain aspects of the others, but 
there's lots of domain knowledge, history and culture that makes them different.
Personally, I found that without a computer science background I didn't
really get to pick the tasks I wanted to do, so my strategy was to try
to learn enough to be competent in several areas, and also learn which 
areas I would always want to avoid.

If you get to that point, you will not need me to tell you where to go next,
but I can tell you what seemed best to me. My focus is (still) in [assertional making](https://www.raphaelluckom.com/posts/honoring_personhood.html)
and in storytelling and writing--the types of communication that validate,
affirm and support the global mission of caring better for ourselves, our planet
and each other. Since that mission is so broad and since computers can only play
a small part in it, I have focused on a relatively narrow set of tools
and subjects. As a programming language I favor [JavaScript](https://www.javascript.com/) because it
fits the way I think and it works in the browser and on the server. I
spend a _lot_ of time learning about different cheap cloud components--databases,
storage, queues, and task engines--so that whenever practical I'm able to
use someone else's good work rather than trying to do everything myself.
There are various ways of organizing the small armies of components you
end up with if you build this way--I find [terraform](https://www.terraform.io/)
to be the one that aligns best with the way I think. Finally, I spend
a significant amount of time focused on front-end design and presentation
concepts--the technology of web pages and web browsers. Early in my career
I bounced around a lot to different languages and domains (and if I could do it
over again I wouldn't change a thing) but now I find that limiting myself
to a few tools I know really well leaves me free to focus on the "what" and "why"
of my goals rather than the "how."

In future posts I'll go into these areas more deeply, but as in most fields,
the one critical message is that you don't need permission to jump in.
This field needs far more perspectives and experiences than are currently
represented in it. If you're interested in these areas and want help or
suggestions, don't hesitate to reach out.
