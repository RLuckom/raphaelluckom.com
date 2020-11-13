---
title: "Internet History 001: The Web Goes Mainstream"
author: "Raphael Luckom"
date: 2020-11-11T07:09:34-05:00
draft: false
---

In the [last installment](https://www.raphaelluckom.com/posts/internet_history_000.html)
of this series, we outlined the original design of HTTP and the internet
landscape into which it appeared. In this post, we'll look at how HTTP
evolved with use, taking on new features and characteristics.

There's a gap in the early history of the web. Its first specification, HTTP 0.9, was
published in 1991, but the next one, HTTP 1.0, didn't appear until five years later in 1996.
Three important developments occurred in the interim. 
Prior to 1993, the code for web servers and clients was nominally owned
by CERN, which meant that anyone who wanted to run a website technically
needed a license to use CERN's software[^1]. In April 1993, however,
CERN published a [document](https://cds.cern.ch/record/1164399?ln=en#)
officially releasing their code for the web into the public domain. 1993 also saw
changes in the major US internet service providers that made them available first to commercial
users and then to the general public[^2]. Finally, 1993 also marked the release
of the [Mosaic](https://en.wikipedia.org/wiki/Mosaic_(web_browser))[^3] web browser for
Windows, Mac, and Unix. In April 1993 there were fifty web servers online,
which probably means that there were around fifty total websites. Seven
months later, in October 1993, there were 500. In 1994 the Mosaic Communications
Corporation formed to capitalize on the success of the Mosaic browser. Its first product,
Netscape Mosaic 0.9, was subsequently renamed Netscape Navigator.

These developments all gave their stakeholders a reason to be interested in
the details of the HTTP standard. The scientific community, which had been using
the web since before 1991, represented a large percentage of the early users,
giving them an equally-large stake in the early web culture. At the same time,
private groups and for-profit companies were popularizing commercial
and social uses of the web that fell outside the remit of public network
operators like the NSF. These private and commercial groups--including the first
companies to sell web access to the public--wanted to ensure that their
services would benefit from any changes to web standards. At the same time,
browser companies like Netscape, which were creating the user experience
of the web, had a unique perspective on how websites were being built and used. 
These groups all gave input to the working group that produced the [HTTP 1.0 standard](https://tools.ietf.org/html/rfc1945),
which states that it "reflects common usage of the protocol referred to as "HTTP/1.0","
suggesting that it was describing something already in use. The [HTTP 1.1 standard](https://tools.ietf.org/html/rfc2068)
was released only eight months after HTTP 1.0; both standards were being developed
at the same time. We probably should not see this sudden flurry of standards as a series of discrete events.
Rather, it represents the most durable milestones of a process that had been going on for
several years, in which various groups had been adapting the existing HTTP protocol
to their needs. The 1.0 and 1.1 releases were an attempt to standardize parts of the way
that HTTP was _already_ being used.

The best way to see how this process played out is through the [description](https://web.archive.org/web/20091111012314/http://tech.groups.yahoo.com/group/rest-discuss/message/6757) given by
Roy Fielding, one of the principal authors of both HTTP 1.0 and HTTP 1.1. In this 
quote, he is explaining the beginning of the architectural style he developed 
for thinking about the web:

> We would discuss various proposals for HTTP (including our own) and
> I would try to figure out why each fit (or didn't fit) the model, and
> use that to either change the proposal or change the model. I don't
> even remember sharing that with Henrik[^4]-- we just talked things out,
> tried a few examples on the whiteboard and in various implementations,
> and came to a general understanding of the model through that process.
> [I am probably oversimplifying that process -- we each had our own
> implementations (CERN libwww and httpd on the one hand, libwww-perl
> and NCSA httpd on the other)[^5] and were friends with most of the major
> Web developers at the time, so everything we did was influenced by a
> larger cast of characters, most of whom were probably amused by our
> attempts to standardize the Web while they were busy with startups.]

> Later, in the summer of 95 when I was at MIT, I had a discussion
> with TimBL about the Web architecture and the software engineering
> principles that he applied during its first few years of development.
> This was four years into my Ph.D. research in Software (UCI avoided
> calling it SE research, since our group has a very broad perspective
> on software development) and my interest in the Web was only indirectly
> related to my studies at the time (a.k.a., my Phase II drift).
> He suggested that I study the software engineering principles that
> influenced him during the early Web development, and the role of
> simplicity in particular. I was far too busy with the standards
> effort by that point, but the idea got stuck in the back of my mind.

> Throughout the HTTP standardization process, I was called on to defend
> the design choices of the Web. That is an extremely difficult thing
> to do within a process that accepts proposals from anyone on a topic
> that was rapidly becoming the center of an entire industry. I had
> comments from well over 500 developers, many of whom were distinguished
> engineers with decades of experience, and I had to explain everything
> from the most abstract notions of Web interaction to the finest details
> of HTTP syntax. That process honed my model down to a core set of
> principles, properties, and constraints that are now called REST.

Let's take a break from the timeline and look at the _model_ that Fielding
is describing. First, we can see that one purpose of this model was so that
the design would hold together and not contradict itself. Fielding talks about
the effect of the large number of comments he received as "honing" the model--reducing
it to a small set of "principles, properties, and constraints." We should let that
sink in for a moment. Earlier, the development of HTTP looked like a free-for-all,
with multiple players all advocating for their own interests. In a way, that view
is accurate--there were lots of people making comments. But there was also a much smaller group
of people who were _listening_ to those comments and trying to synthesize them into
one internally-consistent design. That design is called _REST_, and it remains to this day
one of the most widely-deployed web application structures. In the next post, we'll look closely at what REST
entails, and what effects it has on the web as we know it.

[^1]: I don't know that this was ever enforced, and CERN's subsequent public release of the software suggests that it would not have been.

[^2]: The main US network from 1985 to 1993 seems to have been [NSFNET](https://en.wikipedia.org/wiki/National_Science_Foundation_Network), run by the National Science Foundation. As a publicly-funded venture, its mission was to provide tools to be used for the public good. By 1991 it allowed some commercial uses, but its Acceptable Use Policy as late as 1992 still disallowed advertising, most for-profit uses, and "Extensive use for personal or private business." In 1993, the situation had become unmanageable--private networks operated for profit were arising, but the only way they could talk to each other was by connecting over NSFNET, which was made difficult by the AUP. Facing strong competition from a number of private network operators who were beginning to interconnect themselves, in 1993 the NSF decided to phase out NSFNET as a network, replacing it with a set of access points at which private networks could connect to each other ([PDF](https://transition.fcc.gov/Bureaus/OPP/working_papers/oppwp32.pdf), page 5). By 1995 this process was complete. This was an early example of a dispute over privatizing the internet.

[^3]: Mosaic was developed at the Universily of Illinois with funding from the...wait for it..._Gore Bill_. Various versions of Mosaic were released in 1993; unix and Mac versions were available in September.

[^4]: Henrik Frystyk Nielsen, a coauthor of both HTTP 1.0 and HTTP 1.1

[^5]: These are the names of specific programs that use HTTP to communicate. `httpd` is the unix name of the Apache web server, and `libwww` is a library used for making web requests and receiving responses. The CERN versions of both `httpd` and `libwww` were both part of what it released into the public domain in 1993. The NCSA is the National Center for Supercomputing Applications, where the Mosaic browser was developed.
