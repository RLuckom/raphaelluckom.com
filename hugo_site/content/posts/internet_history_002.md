---
title: "Internet History 002: The REST Architectural Style"
author: "Raphael Luckom"
date: 2020-11-12T07:09:34-05:00
draft: false
---


In the previous posts in this series, we've looked at 
[the internet into which the web emerged](https://www.raphaelluckom.com/posts/internet_history_000.html)
and
[its early history](https://www.raphaelluckom.com/posts/internet_history_001.html).
We saw that Tim Berners-Lee, a scientist working at CERN, invented a way for people
to collaborate by writing documents that could link to each other across web sites.
We saw that when CERN released that technology into the public domain, _and_ internet
networks were becoming available to the public (largely through commercial businesses), _and_
the early browser Mosaic gave people an intuitive way to navigate this growing system,
the World Wide Web really took off. We saw how it developed in many directions at once,
for many different people who had many different goals, and how all of those people
had reasons to care about its structure. We saw how the need for a well-defined structure
outgrew Tim Berners-Lee's original informal notes, and a team including Roy Fielding
took on the challenge of trying to define that structure and articulate its guiding principles. 
Fielding named those guiding principles the "Representational State Transfer (REST)
architectural style," in his [dissertation](https://www.ics.uci.edu/~fielding/pubs/dissertation/top.htm), 
and they're what we're going to look at now.

When we talk about something as justifiably controversial as "guiding principles of the web," we need
to focus carefully on the big picture. Fielding [describes](https://www.ics.uci.edu/~fielding/pubs/dissertation/web_arch_domain.htm#sec_4_4)
the project this way:

> The goal has always been to maintain a consistent and correct model of how I intend the 
> Web architecture to behave...rather than to create an artificial model that would be limited
> to the constraints originally imagined when the work began.

Throughout his work, Fielding uses the word _constraint_ to mean something very specific. He describes
a constraint as a limit that guides the way you design something to achieve a goal. For instance, imagine you
wanted to send a message to every person in the world. You might use the _constraint_ that "the
message must be 25 words or less," because if you keep the message short, you have a better
chance of achieving the goal of getting it to everyone. But the constraint becomes invalid
if it interferes with achieving the goal--if the message you need to send can't be made shorter than 27 words,
then you need to change the constraint so that it accomodates the message, not the other way around.
What Fielding is saying is that he wants to _keep evolving the constraints_ so that they
continue to support the goal, _not_ pick a set of specific rules to carve in stone. The _goal_ 
is to continually observe what the web is at its best, and work backwards from that to arrive
at the constraints that support its success. We should pay the closest attention to what he identifies
as the goal, and when we are satisfied that it's still valid, we should look at the constraints
he proposes to help us get there. We should expect that we will discover  _different_ goals that are _also_
worth pursuing, and that those goals may be best supported by different sets of constraints.

So what does Fielding identify as the goal? He [says](https://www.ics.uci.edu/~fielding/pubs/dissertation/web_arch_domain.htm#sec_4_1):

> Berners-Lee [[20](https://www.ics.uci.edu/~fielding/pubs/dissertation/references.htm#ref_20)] writes that the "Web's major goal was to be a shared information space 
> through which people and machines could communicate." What was needed was a way for people 
> to store and structure their own information, whether permanent or ephemeral in nature, such 
> that it could be usable by themselves and others, and to be able to reference and structure the 
> information stored by others so that it would not be necessary for everyone to keep and 
> maintain local copies.

> The intended end-users of this system were located around the world, at various university 
> and government high-energy physics research labs connected via the Internet. Their machines 
> were a heterogeneous collection of terminals, workstations, servers and supercomputers, requiring 
> a hodge podge of operating system software and file formats. The information ranged from 
> personal research notes to organizational phone listings. The challenge was to build a 
> system that would provide a universally consistent interface to this structured information, 
> available on as many platforms as possible, and incrementally deployable as new people 
> and organizations joined the project.
>
> ...
> 
> In late 1993, it became clear that more than just researchers would be interested in the Web. 
> Adoption had occurred first in small research groups, spread to on-campus dorms, clubs, and 
> personal home pages, and later to the institutional departments for campus information. When 
> individuals began publishing their personal collections of information, on whatever topics they 
> might feel fanatic about, the social network-effect launched an exponential growth of websites 
> that continues today. Commercial interest in the Web was just beginning, but it was clear by 
> then that the ability to publish on an international scale would be irresistible to businesses.

We see that the web's original goal was to be an informational space that fostered communication regardless
of where the people using it were located. On top of that, Fielding considered it important that
people be able to "store and structure their own information," and "reference and structure the information
stored by others so that it would not be necessary for everyone to keep and maintain local copies."
In the last paragraph, he describes how the growing popularity of the web raised new technical
challenges to achieving these goals; when _everyone_ is trying to use the system, its design needs
to take that into account so that it won't get overloaded or lose the flexibility to support
new people and ideas. To support these goals, he suggested using the following constraints.

#### The basic interaction of the web is a client making a request to a server and the server sending a response
The web uses a _client-server_ architecture. The client (often a browser) is responsible for 
   presenting the _user interface_, and may include processing components. The server is responsible
   for durable data storage and may also include processing components. The client and server
   programs should be able to evolve independently--servers should not work only with one specific
   type of client or vice-versa.

#### Servers don't keep track of clients
A server should not have to keep track of its "conversation" with a given client in order to
   successfully respond to a request. For instance, a client may send a request like "please send
   me the _fifth_ page of results for this search," but it may not send a request like "please send me
   the _next_ page of results for this search," because the latter would require the server to
   keep track of the conversation with that specific client in order to know which page it meant by "next."[^1]

#### Responses can specify if they're reusable
Responses can include information about whether they should be re-used if the same request comes in again.
   For instance, imagine I use my phone to share my location with you. If it drains my battery to use GPS to
   determine my exact location, then when you request my location, my phone should be able to send a response that
   says "here is my current location; if any other requests come in within the next 60 seconds, please
   send them this response instead of asking again." This constraint allows different parts of the network
   to "help out" the source of a piece of information by protecting it from getting overloaded. Some responses
   will indicate that they should _not_ be reused--for instance, a response that gives the current time.

#### Some things should be consistent no matter which client is talking to which server
There are four things that should always be true about an interaction no matter what client or
   server is being used: the URI should refer to a specific _resource_[^2]; the resource should be _represented_ by
   something (or a set of things) that can travel between the client and the server[^3]; the _message_ should have
   certain characteristics that tell the receiver how to handle it[^4]; and the _contents_ of a response should include
   enough information to interact sensibly with the resource referred to by the requested URI[^5].

#### The client and origin server might be separated by helpers; that's ok.
It should be possible to introduce intermediaries between the client and server to help out with different
   aspects of communication. One example of this was mentioned in #3 above, where if an intermediate server
   gets a request it has already seen, instead of asking the end server for a new response, it may sometimes use
   the response from the last time something made that request. Another example would be that, when you look up a web site,
   your computer is likely talking to your home router, which is _relaying_ the conversation between you
   and the web site. REST requires that clients and servers should not assume that they are talking to each other
   _directly_, and must instead assume that intermediaries may be present[^6].

#### The server is allowed to send _code_ to the client to help it interact with the resource
The server is allowed to send a program (like JavaScript) to the client. Running that program should facilitate
  some specialized interaction with the resource not already built in to the browser. This is the only constraint 
  that Fielding describes as "optional", reasoning "An optional constraint allows us to design an architecture that 
  supports the desired behavior in the general case, but with the understanding that it may be disabled within some contexts."

These six constraints represent the _entire_ set of requirements that Fielding says will enable a distributed
hypermedia system (the web) to achieve the goal he defined (be a shared information space through which ridiculous
numbers of people and machines can communicate). He also identifies 
[specific nice things](https://www.ics.uci.edu/~fielding/pubs/dissertation/net_app_arch.htm#sec_2_3)
that these rules help to balance within the system, including performance, scalability, simplicity, modifiability, 
portability, and reliability. 

If you ask a group of engineers what REST is, you're likely to start an argument. 
That's unfortunate, because the argument usually focuses on the precise interpretation of Fielding's 
constraints, and whether specific technical decisions do or do not satisfy them. A more productive conversation
starts with the _motivations_ for each constraint and places them next to the _requirements_ of the system
to be built. It is only with that perspective that the spirit of the REST architectural style can be fulfilled.

_In a way, this post brings us up to the present--the REST architectural style is still a popular one
with system designers today. But this isn't going to be the last post in the series--there are many other
histories to consider, and there are even (as Fielding himself [stated clearly](https://www.ics.uci.edu/~fielding/pubs/dissertation/software_arch.htm#sec_1_7)) other dimensions of system design on which REST does not comment._ 

[^1]: This requirement can make it challenging to design security elements like a "login session," in a way that follows the REST architectural style. Thankfully, good engineers are able to articulate [various sensible conclusions](https://stackoverflow.com/questions/319530/restful-authentication) about it. 

[^2]: Another way to look at the requirement that "a URI should refer to a specific _resource_" is to say that the correct _link_ to get to something should only depend on _what it is_, not anything else like _who_ is making the request. For instance, it would contradict the REST architectural style to use different URIs for a mobile-phone version of a page vs the desktop version of the same page, because if you want to make a link to the page, you need to pick a URI without knowing what the person who follows the link might be using.

[^3]: [Earlier](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_2), Fielding makes an eyebrow-raising claim about Uniform Resource Identifiers (URIs): "Any information that can be named can be a resource: a document or image, a temporal service (e.g. "today's weather in Los Angeles"), a collection of other resources, a non-virtual object (e.g. a person), and so on. In other words, any concept that might be the target of an author's hypertext reference must fit within the definition of a resource." That earlier claim is the lens through which we should see the constraint that REST requires the "manipulation of resources through representations." Because a URI can refer to _anything_, from "the set of search results for the term 'philosophy'" to "the person who is Raphael Luckom," we can't expect that _the resource itself_ will be something that can be sent over the internet. Instead, Fielding distinguishes between the resource itself, and some representation of the resource that can be expressed over the internet. It is the system designer's job to pick a representation of a resource that enables the application to perform its function.

[^4]: Specific pieces of information that Fielding says should be required on every request include: the name of the _host_ (domain name) the message is for; the _encoding_ of the message (like how and whether the content has been compressed (zipped) to take up less space); a consistent structure so that the receiver can distinguish the different _parts_ of the message even without necessarily being able to understand them (like how I could ask you to find the table of contents in a book, and you could generally do it even if you didn't understand the language the book was written in); specific signals that distinguish the phases of communication (like how, when you're talking on a radio, you're supposed to say "over" at the end of your statement so that the person on the other end knows that you're done talking and didn't get cut off); information about the _size_ of a message that a server can process (at least, a specific error that says "that was too long"); details about whether a response can be stored and reused, as discussed previously; and information about the _content type_ of resource representation that a client can accept (such as HTML or JSON).

[^5]: Fielding calls the idea that the resource representation should include details of how to interact with the resource, "hypermedia as the engine of application state," leading to the lovely acronym HATEOAS. Some sources then replace the H with "hypertext" rather than "hypermedia," giving the unfortunate impression that Fielding was specifically referring to HTML. Even those who [do not make that mistake](https://recaffeinate.co/post/what-is-hateoas/) tend to use as their example a narrow view of the idea of a "resource." For instance, some might argue that an HTML page that references a JavaScript application you need to download to interact with a resource is not RESTful, because the HTML page itself doesn't include the API information present in the JavaScript application. I appreciate this view, but I think another view is possible in which the "resource" the HTML page represents is actually "the list of things" (JS, CSS, etc.) required to do some further task, and the HTML page _does_ in fact contain all of the information needed to interact with that resource. I think this latter view tends to lead to better results in many common cases, and I'm happy to think it through with anyone interested. 

[^6]: This requirement is not the same as assuming that an _adversary_ may insert itself between server and client--that's a security concern for a different context, though it has some similar features. The REST architectural style is specifically concerned with _enabling optimizations_ via intermediaries as a feature the system is capable of supporting, without denying that there are also cases where it's important to guard against hostile or misbehaving intermediaries.
