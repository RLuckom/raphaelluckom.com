---
title: 'Mid-July check in: alpha and beyond'
author: Raphael Luckom
meta:
  trails: []
  imageIds:
    - 7f1a30af-dba5-460b-85bf-12d6643d75fa
createDate: '2021-07-18T22:09:47.894Z'
updateDate: '2021-07-19T12:34:02.498Z'
date: '2021-07-19T12:34:02.498Z'
publish: true
---
It’s been a while since I’ve done one of these check-in posts. To be honest, it felt kind of silly
to keep bleating on about what I was doing since the story wasn’t changing. But now that I’ve
released [instructions for deploying the alpha](https://raphaelluckom.com/posts/alpha.html), I want to describe some of the new components included in this release and how they fit into the
bigger picture.

The following diagram offers a high-level view of the alpha system. The light grey elements are
those that were more or less included in the [previous release](https://raphaelluckom.com/posts/practitioner_journey_004.html) about five months ago. The new elements are shown in black.

![](https://admin.raphaelluckom.com/hosted-assets/plugins/prod_blog/img/Mid-July%20check%20in%3A%20alpha%20and%20beyond/7f1a30af-dba5-460b-85bf-12d6643d75fa/500.svg)

As you can see, most of what’s included in this release is new (even the existing parts are almost
complete rewrites of what I released earlier). And unlike the earlier releases, this meets the
criteria laid out in the [definition of a web service](https://raphaelluckom.com/posts/anatomy_of_a_web_service.html) I articulated about 10 months ago when I started this project. For the last five months I’ve been
steadily working through each of the new components, but it wasn’t until I could put all of them
together in a deployable unit that it made sense to do a release.

Notice that the second line of components from the bottom—the blog hosting system and authoring UI
in particular—are the only *specialized* parts of the system. The rest of the components would be perfectly at home in a variety of other
systems with other purposes. Most new components will have a much faster release cycle than these
have had, because I don’t need to reimplement all these basic services.

There’s a kind of anxiety I’ve had about this project—specifically, the fear that as my design
became more complex and bigger in scope, I would eventually reach a point where it became impossible
or impractical to keep moving forward. This could have happened if the cost of running the service
started to balloon, or if the deployment process became more complicated in proportion to the amount
of new stuff, or if terraform wasn’t able to handle the amount of infrastructure, or if some AWS
limit prevented the system from being deployed. That risk seems much less to me now. The last system
I released deployed \~75 components, and most of them were very simple. This alpha system deploys
261, and some—like the data lake, user management system and access control functions—are about as
exotic as anything this system will probably ever include. I can think of many things that I want to
add to this system, but there are few new *kinds* of things to add—all the new things that I’m planning can be built from component types that are
already used. So I feel more certain than ever that my goal—allowing individuals to maintain control
of their own online presence while still having the capabilities common to social media—is
technically feasible.

So what comes next? The first answer is social media features. I’m going to build a kind of friend
request system that will allow these sites to establish links with each other. I will use the
existing blog authoring UI as the authoring UI for posts that will be shared with friends. Finally,
I’ll add a reader view where you can view a feed of your friends’ posts. This system may include
viewer metrics—how many times your friends have requested your posts—but it will likely
*not* include comments or likes in the first iteration. Those will come later.

The second thing that’s coming up is the end of the year that I originally planned to spend on this
project. For me, that means that it’s time to start thinking about finding some income. I feel like
the work I’ve done this year demonstrates that I’m capable of building the system I’ve outlined
here, and that I’m self-motivated enough to keep working on it for as long as feasible. So I’m
probably going to set up a patreon-style plugin for this system and solicit monthly donations. If
that doesn’t work, I’ll start looking for my next job (and hopefully keep making progress on this in
my spare time). All of this is a couple months out, and I hope to make plenty more progress in the
meantime.

