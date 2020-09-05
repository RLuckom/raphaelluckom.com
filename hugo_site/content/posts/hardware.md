---
title: "Landscape With Cloud"
author: "Raphael Luckom"
date: 2020-09-05
draft: false
---

Once, in my first tech job, I actually purchased a computer. For maybe
eighteen months I'd been responsible for collecting the logs from various programs
that ran on a robot, and the Powers That Were had decided that it was
worth getting some dedicated hardware. So I spent about a week researching
what we needed, figuring out who needed to sign what to get it, and then
prodding them until they signed it. Then it took a little while to arrive,
and then the sysadmin who needed to install it in the server rack was busy,
and then I was busy...all-in-all, it might have taken a month.

My next job, and all my jobs since then, have been on teams that owned almost
no actual hardware. That's pretty much the default, I think. Most software
companies use "cloud service providers"--basically, wholesalers of different
computing resources--to manage the actual machines on which their programs run.
Amazon (AWS) is the biggest of these, followed at a distance by Microsoft and then Google.
It's not a bad state of affairs--these providers spend significant
effort trying to make their operations as energy-efficient as possible
to keep their costs down.

The early cloud offerings were basically just internet-connected computers
that you could rent. You'd get your credentials from the provider's website,
log in, set up whatever you wanted to run (like Wordpress if you wanted a
blog) figure out the networking settings, the database, backups if you were
ambitious, and the thing would run until doomsday or until the next Wordpress
critical vulnerability was found. This was pretty much the state of affairs
during my second job--everything was a (remote) computer you could login to. If you
wanted a database, you rented a big computer and ran a database on it. If
you wanted to make sure your site was always available, you rented a bunch 
of small computers with fast networking to serve it from. Getting the keys
to a big company's cloud account is kind of like getting a driver's license--
it's fun at first, but sooner or later it's just a daily commute.

It also wasn't very efficient. There are very few useful tasks that require
a computer to be doing stuff _all the time_. Most workloads are spiky--
traffic is higher at certain times of day, lower at others. Some workloads
need very fast networking, others need lots of storage. Amazon's smallest
instances cost about $0.08 / hour to rent in the mid 2010s. That doesn't
seem like a lot, but it works out to $58 / month for significantly less
computing power than a midrange smartphone. And if you were running a personal Wordpress
site that got less than a few thousand hits a day, it didn't make sense.
Things weren't _much_ better for the really big players. There was a lot
of reading of tea leaves when it came to capacity planning--do you try to
always have enough to cover your biggest spikes? How close can you cut it?

Now, since all of these systems were automated, there were some interesting
possibilities. For instance, you could write a program that would watch out
for spikes in your traffic and then automatically start more instances to
meet the demand, turning them off again when the spike subsided. The cloud vendors
integrated these types of controls into their offerings. This put pressure
on all kinds of software to become more standard and interchangeable. Where you would once
have configured each machine yourself when you started it, now it was important
that an automated system could start a computer, get it configured and put it into
service without human intervention. One solution to this was the "machine image"--
kind of a dehydrated system that could be cloned on demand to start as many
identical machines as you wanted.

What I'm trying to illustrate here is that the big idea that has shaped
infrastructure development for the past few years is _abstraction_. We went
from computers that were physically taking up space in the office, to computers
that were not in _our_ office but which behaved the same as the ones that were,
to the _blueprint_ for a particular type of system paired with an algorithm
for running that system and scaling it up and down. Each level of abstraction
unlocked new efficiencies and made it easier to only pay for what you actually
needed to use. 

That trend continues, and its latest iteration is described by the buzzword
"serverless." This refers to a system architecture where you do not
directly rent any computers at all. Instead, you design your whole system from
specialized off-the-shelf parts. Your files are stored in an "object store"--
a special system that can store any file up to 5TB, where it costs $0.023 (yes, the
prices include fractions of pennies) to store 1GB for a month. For $0.000001
per request, you can set up a forwarding system that will listen for requests
or other events and wake up programs to handle them. My test environment
probably has around 50 little components organized in neat little groups. My
bill for August (not including the online store, which is a different conversation)
was a whopping $3.37. I expect September to be even less.

All this is to say that as "means of production" go, some of the very best,
most cutting-edge innovations in computing over the last ten years are remarkably
inexpensive in money. There are certainly other barriers--and no small amount
of bad-faith rent-seeking--that prevent most people from sharing in these
benefits. One of those barriers is a lack of awareness and conversation.

On the flip side, these numbers should start to put in perspective just how
little one gets in exchange for submitting to constant surveillance by a social
network. About one postage-stamp's worth of computing resources per month, 
two or three different types of rectangles you're allowed to use to express
yourself, and the creeping anxiety that comes from watching the records of 
your life slowly sink into the 67483548th length of unsearchable infinite scroll.
Anyone who has studied a craft will probably be able to empathize with what
it feels like to see such flagrant and tawdry waste in the name of profit.

So it's a bit of a good-news-bad-news situation. The good news--and it really
is pretty unbelievably good, all things considered--is that there's a plausible
way for people without a ton of resources to really make a dent in some of these
problems. The bad news is that we're already in a substantial hole and there
are signs of an imminent cave-in.

I'm going to try to continue writing short pieces like this to cover different
aspects of the technology landscape, with a focus on things that could be useful
for people who would like to imagine a more just world. I hope you'll come along
for the ride and give me the benefit of your insight and experience.
