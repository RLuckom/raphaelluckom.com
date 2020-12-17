---
title: "Internet History 000: One Place To Start"
author: "Raphael Luckom"
date: 2020-11-10T07:09:34-05:00
draft: false
meta:
  trail:
    - internet history
---

1991, the year when the first websites were published, is not by any stretch of the imagination 
the year when the _internet_ started. But I think it's a good place to start when we try 
to understand what the internet is _now_. Someone who is familiar with the internet
in 2020 can look back at 1991 and recognize some of the broad strokes.
Once you understand the 1990s, it gets easier to go back if you want to, and
trace the earlier events[^1]. It also gets easier to contextualize what has been happening
in the decades since 2000, and understand the situation in which we find ourselves.

A thriving internet culture already existed in 1991. [Usenet](https://en.wikipedia.org/wiki/Usenet), 
a kind of bulletin-board-system, had been operating continuously 
since 1980. Usenet is a collection of channels called _newsgroups_--today we might think of them as similar
to subreddits or topics in a discussion forum. But Usenet consists of a single _namespace_[^2]. The newsgroups were assigned names in a tree
structure--for instance, there might be one newsgroup called `baking`, and a more specialized newsgroup might be called
`baking.sourdough`, as a kind of _branch_, or subgroup. Up until 1987, the names were not officially standardized--
if you wanted a new newsgroup, you could choose any name that wasn't already taken. In 1987, there was an event
called the [Great Renaming](https://en.wikipedia.org/wiki/Great_Renaming), when the administrators of the most
popular Usenet servers decided to impose some structure. They decided that there would be seven top-level-categories:
`comp` (computing), `misc`, `news`, `rec` (recreation and entertainment), `sci`, `soc` (social content), and 
`talk` (basically, any discussion likely to devolve into a fight, like politics or religion). As a reaction to the 
great renaming[^3], a top-level category called `alt` was also formed, with the
intention of being an alternative to the nominally-official categories.
Starting in 1987, the name of every newsgroup started with one of those words. Usenet 
may have been the original source of some internet concepts we still use, such as _trolling_,
_SPAM_, and _FAQ_.

What I'm trying to show is that the types of systems and human behaviors that we think of
as "the internet" already existed prior to the _website_. It's the _website_ that was new in 1991,
and that's a curious thing. Usenet was an extremely successful system--it had lots of users
who were sharing text and media files, just like people do today. But for some reason, when
the website came along, it eventually relegated Usenet to second-class status. So why did that
happen? If the subsequent massive expansion of the internet in the late 1990s suggests that
there was a whole bunch of potential just waiting to be released, then where did it come 
from and what set it free?

We have to be very careful here. When we talk about computer history, from its beginnings
almost to the present, one thing we need to remember is that computers were getting much better 
very quickly. So we need to be really careful about statements like "the _philosophy_ that
underlies {x technology} was faulty somehow, _therefore_ more people started using {y technology}."
Before we make any statement like that, we need to consider the idea that maybe the newer system 
happened to arrive at a time when it could take advantage of improvements in computer technology
that established systems were prevented from using by their communities and functions.
It's _possible_ that the design principles on which one system was built could affect
its adoption relative to a similar system, but we should not assume that relationship
just because we see one system outcompete another[^4].

In any case, in 1991, Tim Berners-Lee, working in the High Energy Physics
group at CERN, distributed a design for a new way to publish documents between computers
called HyperText Transfer Protocol, or HTTP. His intention was for scientists to be able
to record and share information easily, without it getting lost. As he later said in an [interview](https://achievement.org/achiever/sir-timothy-berners-lee/#interview):

> Most of the technology involved in the web, like the hypertext, like the Internet, 
> multifont text objects, had all been designed already. I just had to put them together. 
> It was a step of generalizing, going to a higher level of abstraction, thinking about all 
> the documentation systems out there as being possibly part of a larger imaginary documentation 
> system. But then the engineering was fairly straightforward. It was designed in order to 
> make it possible to get at documentation and in order to be able to get people — students 
> working with me, contributing to the project, for example — to be able to come in and link 
> in their ideas, so that we wouldn’t lose it all if we didn’t debrief them before they left. 
> Really, it was designed to be a collaborative workspace for people to design on a system together.

He describes his project as a _documentation system_--a way for scientists
to organize and share research notes and user manuals for the tools of
high-energy physics. The [document](https://www.w3.org/Protocols/HTTP/AsImplemented.html) 
describing the original HTTP implementation weighs in at 656 _words_.  What it contains
is a _protocol_--a structured way for computers to interact so that they can understand 
each other. This protocol centers around two concepts: _request_ and _response_. One computer,
the _client_, sends a small piece of text called a _request_ to another, the _server_.
The server then builds a _response_ and sends it back[^5].

There's something curious about the 1991 protocol document. It says that every request
must begin with the word `GET` followed by the document address. We would now refer to this
type of request as a GET request, and it's the type of request that a browser makes
when it's trying to, well, _get_ something, like a web page. There are other types of requests
as well: a POST request is for when you want to make a new thing, like when you submit a tweet.
a PUT request is often when you want to edit or change something that already exists, and
a DELETE request is for deleting something. In 1991, none of these other types existed, 
and yet we can see that people planned for them, because even then, you had to specify `GET`.

So the HTTP protocol allowed a computer to send a request and get a response. This
itself wasn't new--FTP, or File Transfer Protocol, had supported the equivalent of GET, POST, PUT, and DELETE
requests since 1984. HTTP was different. First, it was more efficient for transferring
small files like web pages. Second, and probably more importantly, it was designed to transfer
[hypertext](https://en.wikipedia.org/wiki/Hypertext). It's hard to understand hypertext as a concept
because we live surrounded by it--basically, it's the idea that text can have _links_
to other resources. Before hypertext, you could use FTP to download a file, but you needed to
open the file on your computer with some program you already had, and any related documents might or might
not be available to you. Hypertext lets you combine the program that _downloads_ the information
with the program that _shows you_ the information, so that you can move from one document to 
another easily without losing context, and so each document can contain links to other available documents.
The most common hypertext format on the internet is HyperText Markup Language, or HTML.

We can also see an important distinction between HTTP and Usenet, the bulletin board system, in the way
they use namespaces. In Usenet, the namespace is the set of newsgroups--that is, a name refers to
an _ongoing conversation_. HTTP uses the domain name system as its main namespace. A _domain_ refers to
the "place" where something "lives" on the internet. Where Usenet gives permanent names to _discussions_, 
HTTP treats permanent names as _locations_[^6].

When we look at each of these elements of HTTP, we can see both how it describes the version of
the internet that we know today, and how its design choices and intentions differed from other
systems of its time. HTTP allowed any domain name to be a location, or _web site_, where _hypertext_ documents could
be accessed by anyone with a _web browser_. Those documents could _link_ to other documents on the same
site or another site. It also made use of an existing convention of representing online "stuff" as _resources_--
things that it makes sense to GET, PUT, POST, or DELETE. One of the main goals of the effort was to allow
large numbers of people to collaborate on complex tasks. It was this configuration of technologies,
founded at CERN in 1991, that was named the _World Wide Web_.

There's a lot more ground to cover, but this is a good place to pause. In future posts in this series, we'll
explore the evolution of HTTP through its subsequent versions, and some of the important design
concepts that arose as it matured. Later, we'll think about how HTTP serves as the foundation
for other developments in internet technology, and the principles on which those later systems
are designed.

[^1]: One of the big milestones in this history, if you're interested in going back further, is Claude Shannon's 1948 paper _A Mathematical Theory of Communication_ ([PDF](https://web.archive.org/web/19980715013250/http://cm.bell-labs.com/cm/ms/what/shannonday/shannon1948.pdf)), which Wikipedia credits as "the founding work of information theory." Well worth a read, and also not the real beginning. Nothing ever is.

[^2]: A [namespace](https://en.wikipedia.org/wiki/Namespace) is a collection of things with unique names. The set of Twitter users is a namespace, because each handle only refers to a _single_ account. The set of users on a Wordpress site is also a namespace; each username again refers to only one account. But if you take _two_ Wordpress sites, they would represent two separate namespaces, because a single username (e.g. 'admin') could exist identically on both systems yet not be the same account. Namespaces solve the problem of connecting one identifier unambiguously with a single thing, but they present big challenges. For instance, domain names on the internet form a namespace, and in the domain name system (DNS) you can see examples of people fighting over domain names and hoarding them. The other big feature of a namespace is that someone, or a lot of people, have to agree on how to give out the names and generally manage the thing, which is a human-coordination challenge.

[^3]: The alt hierarchy was originally conceived by Brian Reid (a member of the "Backbone Cabal" of network admins who had decided on the great renaming), Gordon Moffett, and John Gilmore (who went on to become a founder of the EFF) at G.T.'s Sunset Barbecue in Mountain View, CA in 1987. A description quoted in many places ([example](https://broadbandnow.com/internet/u/ui_alt.htm)) quotes Reid, "John’s home computer was ‘hoptoad’; my home computer was ‘mejac’. We set up a link between us, and each of us set up a link to amdahl, and we vowed to pass all alt traffic to each other and to nurse the net along. In those days one sent out numerous newgroup messages in the hopes that one would ‘take’; by the end of May the groups alt.test, alt.config, alt.drugs, and alt.gourmand were active. At the time I also managed ‘decwrl’, so I quietly added ‘alt’ to the list of groups that it carried."

[^4]: This is an argument we should consider any time it seems like a computing technology is "ruining" the internet. Is it really the case that a technology is having a deleterious effect on the internet, or is it just revealing or enabling some human trait that we prefer not to acknowledge? Further, on what authority are _we_ the judge? These aren't unanswerable questions--I've argued on this blog that certain common system designs are [evil and rude](http://www.catb.org/~esr/jargon/html/E/evil-and-rude.html). Any time I make a statement like that, I try to provide answers to the questions of how I think the technology interacts with human tendencies and the grounds on which I consider it to be bad. By stating this chain of reasoning, I hope to offer well-intentioned critics the tools to help me understand better.

[^5]: Not all systems work this way. For instance, a TV with an antenna doesn't "request" a channel, and the tv station doesn't "respond" to any specific TV. TV stations _broadcast_ and TVs _receive_. 

[^6]: It's interesting to think about what the equivalent of a "home page" would have been on Usenet. It would have been technically possible to start a newsgroup about yourself, and Im sure some people must have done that. It would have been similar to a mailing list for people who interact with the person in the middle. I suspect that the more common structure would have been that a newsgroup would be the main "home" of a group of people in common, like members of a club.
