---
title: "Early November Check-In"
author: "Raphael Luckom"
date: 2020-11-04T14:09:34-05:00
draft: false
---

Since my [last check-in post](https://www.raphaelluckom.com/posts/october_check_in.html)
I've made a bit of progress. If I was grading on a curve I'd give myself 75%--definitely
on track to pass but not spectacular.

The most obvious part of my project is to build a system that provides the good
functions of social media while avoiding as many of the bad parts as possible. In that
respect, the biggest piece of progress is that I've replaced the instagram link
on this site with the [stream](https://www.raphaelluckom.com/stream.html) link. Supporting and
expanding what the stream can do is going to be one focus of my technical work. Right
now it displays images, captions, and assistive text. I can upload pictures from
my phone and use Slack to post them. This system allows me to experiment with different 
post formats[^1] and demonstrate results and progress in a more visible way. I also think it will
probably stand up to load pretty well, should that ever become a factor.

If "make the stream functional and interesting" is one category of tasks, there are two other categories
that I'm actively prioritizing. One of those categories is to make posting as easy and convenient
as it on other social networking apps. I'm using instagram as my model for how easy
it should be--I think that's a reasonable, not-too-high standard. Right now my solution
falls short of that, but it is as follows:

I got an app from the app store that lets me upload a photo to AWS S3[^2]. When I upload a photo,
a [cloud function](https://www.raphaelluckom.com/posts/cloud_functions.html) wakes up
to process it. That function takes the photo, resizes it for various common screen sizes, and stores
it in a publicly-accessible place. Next, it generates a partially filled-out version of the
form to post the image and posts it in slack.


{{<figure src="/img/png/post_outline.png" caption="A preview of the image along with a skeleton of the form to use to post it" alt="In slack, a 100px-wide image. Underneath it a JSON structure with the keys itemType (image), mediaId (a uid), alt (not filled out), caption (not filled out) and timeAddedMS, with a millisecond timestamp.">}}

If I want to add the image to the stream, I fill out the `caption` and `alt` 
fields in that structure and tell my application to post it:

{{<figure src="/img/png/post_action.png" caption="When I tell the test_app bot to post the filled out structure, it does so, then responds with a confirmation of what it has published." alt="Two slack messages; one in which I amd telling the test app user to make a post, using the structure described previously, and another message in which it responds with that structure.">}}

When `test_app ` posts the confirmation, I can expect to see this in the stream:

{{<figure src="/img/png/posted.png" caption="The posted image, with caption, accessibility features and date" alt="The posted image, with caption, accessibility features, and date.">}}

This flow works, and if I had to stop working on this project today, I'd probably
keep using it. But it's not great, and it definitely doesn't meet the standard of something
I would give to someone else. Improving this experience is going to be a priority for me.

As I get closer to an acceptable posting UX, I'll also think more about how to package
up the entire system so that people can deploy and maintain it on their own. Right now
that's in a similar state as the posting UX--it's not terrible if you're familiar with the tools,
but it's not very accessible if you don't. There are various reasons for leaving this until
later. For one, the design of the posting UX will affect _what_ needs to be deployed, so I won't
necessarily be able to decide _how_ to deploy things until that happens. Second, and 
more importantly, I don't want to package the system for distribution if I might drastically
change it in a way that will cause problems for anyone with a running system. If you're interested in having
your own system like this (hopefully as it improves people will be), let me know and I'll
keep you updated when I have something I feel comfortable distributing. If you're somewhat 
experienced or feeling adventurous, head over to github whenever and let me know if you have questions.

Another major part of my project is to describe the important choices to make
in social media systems, and why I'm making them the way I am. Since my last check-in, I've written
a few posts on those topics. The post on [almond-shaped systems](https://www.raphaelluckom.com/posts/almond_shape.html)
describes the basic properties I want this system to have. The posts on [privacy](https://www.raphaelluckom.com/posts/on_privacy_000.html) and [security](https://www.raphaelluckom.com/posts/on_security_000.html)
describe my framework for thinking about those topics--I'll expand on both as appropriate.

One post idea I've had for a while is to look closer at something called the [hypertext transfer
protocol (HTTP)](https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol). This
is the protocol that has been at the foundation of web pages for as long as web pages 
have existed. The reason I haven't written about it yet is that I was having a hard
time presenting the information in a way that does justice to how interesting and important
it is. But I'm getting there. The concepts we can see in HTTP are highly relevant to the
challenge of building good UX, so I think those things might feed into each other.

That's all I've got for now. Let me know if you have questions, and have a good coule of weeks!

[^1]: For instance, I could experiment with supporting hashtags, or a categorization system, or non-image microblog-style posts.
[^2]: You can think of this as being a big hard drive where you pay based on the amount of stuff you actually store.
