---
title: "Mid-November Check-In"
author: "Raphael Luckom"
date: 2020-11-18T14:09:34-05:00
draft: false
meta:
  trail:
    - check-in
---

Since I spent last week on a series of [historical essays](https://www.raphaelluckom.com/posts/internet_history_000.html),
I decided to spend this week in the present, writing software and reflecting on
how the ideas we find in the history of the web can inform system design today.

One thing that gave me a lot of inspiration was the [indieweb](https://indieweb.org/), and I
felt very lucky to be able to attend the virtual IndieWebCamp East last weekend. Jack Jamieson
[describes](https://dissertation.jackjamieson.net/#x1-120001.2.4) the IndieWeb as "an international 
community of people who use personal websites as their primary online identity." Use of
the term within the community can sometimes include anyone whose practices align with IndieWeb
values--in that sense "IndieWeb" is a category in the same way as "artists" or "small businesses"--
a group defined by similarities in what they do, rather than actual social affiliation. The
IndieWeb community has contributed some incredible resources to the web, many of them directly useful to people
like me[^1].

IndieWebCamp and my trip through the founding documents of the [REST architectural style](https://www.raphaelluckom.com/posts/internet_history_002.html)
helped me rethink some of the design of this website. This blog (excluding the [stream](https://www.raphaelluckom.com/stream.html) page)
is what's called a _static site_--a site where all of the pages are stored on a server as individual files.
This is specifically different than a _web app_, where much of the content--like a post feed or comment section--is
stored in a database for web browsers to request separately from the page structure. Most of my experience
has been with web apps, so my initial plan was to use this static site as a stepping-stone while I built
out web app-y features like the stream page.

However, I noticed that both the IndieWeb and the REST architectural style suggest reasons to prefer
a static site over a web app in my situation. REST principles suggest that each _resource_ (a comment, a post, an image, etc)
should have its own identifier[^2] so that links to it will continue to work. Certain common features
of web app design can interfere with this objective[^3]. From the Indieweb side, the advantage of
static-ish sites has to do with something called the Webmention protocol for commenting _across_ sites. 
The way it works is this: when you find something you want to comment, you publish the comment on
your site, and send a message to the other site telling it where to find your comment. That site
then reads the comment from your site, and either publishes it or links to it. This is what I did
to get a link to my [IWC RSVP](https://www.raphaelluckom.com/posts/indie_web_camp_east_rsvp.html)
published on the [IWC East](https://2020.indieweb.org/east) landing page under the "Indie RSVPs" section.
Webmentions work best when the server delivers each page to a browser exactly how it's meant to
be shown to the person reading, rather than using JavaScript to generate the page on the browser.

These observations guided my decision to focus on enhancing this website as a static site instead of
evolving it into a JavaScript-based web app. Luckily, almost all of what I've done so far remains useful--
the only thing I expect to rewrite is a small amount of the JavaScript on the Stream page, to make the stream
more webmention-friendly. Most of my work until now has been on a set of [cloud functions](https://www.raphaelluckom.com/posts/cloud_functions.html)
that store and organize my photos. These remain useful in their current forms.

Over the past few days I've written four small cloud functions to manage this website's next version
as a static site that automatically updates whenever I save new work. My next tasks are to expand those functions
so that they support everything currently on this site, migrate from the existing structure to the new
structure, and continue to build new features. I hope to be able to do an in-depth look at the design I'm
using within the next couple of posts.

[^1]: One of the IndieWeb's biggest contributions, for my money, is their participation in [standards](https://www.w3.org/TR/social-web-protocols/) that describe how websites owned by different people and groups might interoperate. I've [mentioned](https://www.raphaelluckom.com/posts/fixable_problems.html#fn:6) previously that one of the big competitive advantages enjoyed by for-profit social media systems is that they sidestep messy questions of trust. For instance, Facebook's login system provides pretty good guarantees that the name on a comment or a like reflects a specific entity, unlike a system where you can choose to submit whatever name you want for each comment. The IndieWeb has no such centralized nexus of trust except for the Domain Name System, but it faces similar challenges. Members of the IndieWeb have contributed several brilliant techniques for meeting these challenges, including a [distrubuted identity system](https://indieauth.net/) and a [protocol](https://www.w3.org/TR/webmention/) for interacting between different websites.

[^2]: URI, historically also called URL

[^3]: I don't mean that web apps inherently violate REST principles--some, like Wordpress, can be configured in ways that adhere to the REST style. But the freedom that web apps give you to build in arbitrary ways brings with it cooresponding freedom to shoot yourself in the foot. Web apps that render HTML on the server, like Wordpress, tend to fall more naturally into REST patterns than ones that render HTML in the browser. This also applies to the subsequent discussion of web apps and the Webmention protocol--server-side rendering supports Webmentions about as easily as static sites.
