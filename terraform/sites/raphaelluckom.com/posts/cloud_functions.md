---
title: "Cloud Functions at 30,000 Feet"
author: "Raphael Luckom"
date: 2020-10-02T20:55:34-05:00
draft: false
meta:
  trail:
    - systems
    - cloud primitives
---

_This post is going to be a non-technical introduction to "functions"
in the cloud. Both Amazon (AWS) and Google offer very similar services of this type:
AWS Lambda functions and Google Cloud Functions. I assume that Microsoft
(Azure) offers a similar service but I haven't used it. I'm going to try
to keep the discussion to an altitude at which differences between the
specifics of each service provider aren't really important. And if you
don't need an introduction to cloud functions today, may I recommend
instead using this time to re-read Fred Brooks' "No Silver Bullet--Essence
and Accident in Software Engineering" [[PDF]](http://faculty.salisbury.edu/~xswang/Research/Papers/SERelated/no-silver-bullet.pdf)?_

When you learn to program, the first or second kind of thing 
that you learn about will be the _function_. A _function_ is kind of
like a [pressed penny](https://en.wikipedia.org/wiki/Elongated_coin)
machine--it's a small piece of code that takes _arguments_ (like a penny press
takes two quarters and a penny) and uses them in some computation, often
producing a _return value_ (like the elongated penny). The following is a
function in JavaScript that takes an argument and adds one to it.

```javascript
// This is the function
function addOne(inputNumber) {
  return inputNumber + 1
}

// This shows how the function is used
const result = addOne(5)


console.log(result) // prints "6"
```

Functions are one of the ways programmers organize code. When you group
a number of statements together into a function, two nice things happen.
First, you don't have to copy and paste the function logic everywhere;
instead you just use, or _call_, the function. Second, you can write _tests_--
programs whose only job is to call the function and check that it does the right
thing. Both of these aspects are considered very important in contemporary
software development practice. The acronym DRY (Don't Repeat Yourself) is used
to refer to the former, and a multitude of testing philosophies and systems
are used for the latter.

Once you've learned about functions and one or two other things, you can go
for quite a long way without having to consider anything else. It's probably
the case that any single thing you wanted to do with software, like analyze
a genome or generate a list of all the prime numbers, _could_ be expressed
as a function. I say _expressed_, because while you could write those functions,
different factors could prevent you from _running_ them successfully. In the
case of genome analysis, your function would likely take up too much time,
memory, or both to run on your computer. In the case of listing all the primes,
your function would never complete successfully because there are infinitely
many primes (so you would definitely run out of memory on any system you ran it on).

While you can express pretty much anything in a function, a lot of other logistical
stuff creeps into the picture when you want to start _deploying_ (setting up servers
running your function that people can interact with over a network) or 
 _distributing_ (getting your function to your users in a way that they can install) your software.
I'm going to focus on the _deploying_ case because it's the one where 
I have more experience and the one where cloud functions are relevant.

In my earlier post on [trends in contemporary system design](https://www.raphaelluckom.com/posts/hardware.html),
I described the transition in software deployment from _physical servers you own_ to 
_time on servers that someone else owns_ to _specialized services (but not whole servers) provided by someone else_.
Cloud functions appear toward the end of that transition, as one specialized service for
running code (as opposed to storing or moving data). Just like an ordinary function,
a _cloud function_ is a collection of statements that takes arguments and does something with them.
The difference is that a cloud function is written in a specific way prescribed
by the service provider (AWS, Google, Azure, etc) so that the service
provider knows how to install and run it. Instead of buying or renting a whole server,
you just upload your code to the service provider, and they run it when you
tell them to. Some common examples would be writing a function to run
when your service receives a web request or when you store a file. The service
provider would listen for the event on your behalf, and whevever it occured,
they'd wake up your code to deal with it. When there are no requests coming in, your
code isn't running.

The advantage of this approach is efficiency, both in cost terms (instead
of paying for a server that's running all the time, you only pay for the times
when your function actually runs) and overall (since the provider runs everyone's functions,
they can plan their capacity more efficiently and use less energy than
if everyone had a server running all the time). The disadvantage is that 
there are restrictions on cloud functions--how long they can run, the resources
they can use, etc. A related difficulty is that none of the software written
for web hosting before the availability of cloud functions is really able
to operate within those restrictions. The most prevalent web application design until the 
early-mid 2010s was to have one or more servers on all the time, waiting
to take requests. The software designed for this environment rarely chose
to prioritize things like fast startup times or small memory footprints,
which are more relevant when your code may have to wake up from a complete
stop to handle each request, if there isn't much traffic.

It might seem like technology moves pretty fast, but my experience is that
most software companies have at least a few, and sometimes very many, _legacy_
applications. _Legacy_ roughly translates to "the people who built it have left and
now we just try to keep it limping along without letting it eat up too much of our lives."
These legacy applications, some of which are extremely important to the
businesses that own them and took years of specialized work to build, cannot 
easily be rewritten to take advantage of new deployment strategies. So while
it seems like 2014, when AWS first introduced Lambda functions, was a long time ago,
that's actually not very much time for the industry to adjust.

The next few posts I have planned are going to describe some tricks I've
found for building with cloud functions. I'm also going to start talking about
the specific system design I've arrived at for my social-media alternative. I
hope you'll come along!
