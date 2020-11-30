---
title: "Revenge of HATEOAS: Meditations on Discovery"
author: "Raphael Luckom"
date: 2020-11-29T07:09:34-05:00
draft: false
---

*A [few posts ago](https://www.raphaelluckom.com/posts/internet_history_002.html), I questioned the value
of one of the central tenets of the REST architectural style. I'm very glad I did that, because when I
found the answer, it turned out to be quite a powerful tool. This post is going to be pretty technical.*

The part of REST that I've never understood is Hypertext as the Engine of Application State, abbreviated HATEOAS.
The standard fast explanation--the one you get from a programmer who internalized the idea 
a long time ago and hasn't had to think consciously about it since--goes like this:

> The natural pattern of using a web application is to go to one place,  (for instance, the landing page of a website)
> and from there to follow links to get to wherever you want to go. To take advantage of that natural pattern, 
> we should make APIs _discoverable_ by including endpoints that describe the API surface.

Once you know what you're looking for, this definition works. In fact, maybe we'll come back to it at the end
and see how that's true. But it's also ambiguous about some very important things. For instance, that's the 
definition of HATEOAS I had in mind when I asked [why HATEOAS is useful](https://www.raphaelluckom.com/posts/internet_history_002.html#fn:5).
My objection can be boiled down to the following: 

> Once I've gone to an airport website one time, and found the departures page, I want to be able 
> to bookmark _that page_. I should not be _required_ to go through the landing page (though I can if I prefer).
> If I later want to write an automated script that gets me the departure times, why would that script
> _ever_ find it useful to discover the departures page by following links? At best, that would leave
> the risk to application stability constant; at worst, it could add risk.[^1]

The objection points to one of the ambiguities in the fast definition of HATEOAS--it doesn't describe
_when_ "The natural pattern of using a web application is to go to one place, and from there to follow links to get to wherever you want to go."
Let's look at a very common REST experience[^2]--editing Wikipedia using a modern web browser.

The first part of making an edit to Wikipedia is to find the thing you want to edit. If you're making a new page,
you need to figure out that the page doesn't exist yet. If you're editing or deleting an existing page, you find that page.
You do either by following links--including searches--until you arrive at your destination. For the sake of
simplicity, we'll assume the task is editing an existing page. Once on the page, there is a link to switch to edit
mode. When you click that link, you arrive at a page with a text editor and a further set of links to save or discard your edit.
Throughout this process, you have never had to _construct a url_ to get to the next thing that you want
to do. Instead, Wikipedia _embeds hyperlinks_ in each new resource that your browser displays. These hyperlinks
are context-aware--the "switch to edit mode" link does not appear once you're already in edit mode--but at each
step they provide many possible options, not just the ones that are most relevant to the immediate task.

This example shows how HATEOAS is meant to work--not just that the service _provides_ links to available
actions, but that those links are the _primary way_ that the user _identifies_ the available choices. If we
return to the example from my objection--a script to list airport departures--we see that there are no choices
being made. The basic premise of the script is that the list of departures exists at a location and we want to get it.
There is no discovery of _resources_, only (potentially) discovery of _location_. Discovery of location is
only a very small part of what REST cares about, and it's not relevant to every use case.

Fortunately, we can modify the example a tiny bit to change it into an example of _resource_ discovery rather than merely _location_ discovery. Imagine that the
airport website treats departures as first-class resources--instead of one endpoint that sends you all the
departure _objects_ in a list, the list endpoint simply sends a list of the IDs (perhaps a _universal resource ID_)
referring to currently-scheduled departures. In _this_ scenario, the script first gets the list
of current departures, and then it uses that information to make further choices about what to do--it can use
the provided links to resolve each departure, or it can look to see if a specific one exists, or it can
simply show the user the links it retrieved. Now the script is making navigational choices based on information that it
received from the API. If this is a REST application, that information must include complete links to the
resources, not merely IDs[^3]. This pattern gives us a benefit when it comes to the stability of the application
without adding more requests--if the response from the "list departures" endpoint contains complete links to each departure,
then the script doesn't need to make any assumptions about how to construct those links. Without adding any
new requests, we have freed the server to modify its method of storing departure resources without breaking
the client. Any client that uses this discovery pattern will automatically be able to take advantage
of whatever the current naming scheme happens to be, regardless of whether that scheme has changed since
the client was written.

Now we can look back at the fast definition from the beginning of the post and see how it's true. We want the API
to provide everything the client needs to know to interact with it. To take advantage of the fact that the API
itself is always going to reflect its publisher's most recent architectural choices, we should rely on the API
for wayfinding--even automated wayfinding--that will be more robust than hardcoding specific URI pattern
assumptions into our client applications.

Looking carefully at discovery this way--recognizing the difference between discovering the _location_ of
something that we already knew existed compared to discovering the _existence_ of something and thereby understanding
how to interact with it further--also throws light on another corner of REST that can be confusing--the
nature of a URI. When we look at the latter type of discovery, the URI of a resource behaves exactly as much
like an identifier as it does like an address. The debate between whether to call a thing a Universal Resource
Identifier (URI) or a Universal Resource Locator (URL) ultimately comes down to the question of whether
you want to highlight the id-nature of the thing (like you would in the context of REST architecture and discoverability)
or the address-nature of the thing (like you might if you were talking about the entry point to something
specific, like a URL for a company).

This question has been kicking around in my head since I wrote the earlier post two weeks ago. I'm really glad
that I took the time to write it down so that I could come back to it productively. It felt risky to publish a blog
post containing that question. Even when I wrote it, I had a very strong feeling that I was misunderstanding something about REST
rather than discovering a flaw that generations of smart people had somehow missed. I was worried that people
who understood better might try to correct me in a way that made me feel stupid for having that confusion.
But because I was able to think it through in public, others who have the same confusion may find the same answer. And,
since I'm undoubtedly _still_ misunderstanding different parts of this complicated domain, well-intentioned
people can use these posts to help me learn new things without making me feel dumb.

[^1]: The risk mitigated by HATEOAS is that unless an API can give you a "point-and click" set of
      actions to choose, you're in danger of defining the semantics on the wrong side of the interface--
      requiring the clients (of which there will be many) to each contain its own understanding
      of what the API does. But by providing hyperlinks to actions _within the api itself_, you
      can send semantically-aware suggestions for what someone _might_ want to do next from a given point.
      If you can give these suggestions in a useful way, the actions taken by disparate clients are more
      likely to reflect a mutually-consistent understanding of the API's resources.

      The example of discovering the airport departures endpoint presents no opportunity to provide
      any useful suggestions. If the client is required to discover the endpoint, it needs to be told
      _how_ to discover it. That part of the interface is as likely to change as a direct link is to break.
      The important semantics are _what a departure is_, and the example assumes that the client and server
      agree on that already. In isolation, this is not a case where the REST approach would be distinguishable from others.

[^2]: It's much easier to find convincingly "RESTful" interaction patterns when you look at the interfaces
      used by humans--these can hardly help but be RESTful, while JSON APIs rarely are.

[^3]: It's ok for any given endpoint to return a list of IDs, as long as the API _also_ somewhere provides a [URI template](https://tools.ietf.org/html/rfc6570) 
      explaining how to turn those IDs into URIs. The combination of URI template (or any scheme legibly explaining
      how to construct a URI) and the variables needed to use the scheme to construct a valid URI is one of the
      things I would describe as a "complete link." But if the URI template is not present on the API (for instance, if it's
      only provided in the documentation), that's not something I'd consider a complete link.
