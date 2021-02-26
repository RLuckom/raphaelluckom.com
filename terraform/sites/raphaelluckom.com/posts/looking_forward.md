---
title: "Looking Forward"
author: "Raphael Luckom"
date: 2021-02-15T13:54:34
draft: false
meta:
  trail:
    - systems
    - practitioner-journey
    - practitioner-inn
---
In the most recent [practitioner journey post](https://raphaelluckom.com/posts/practitioner_journey_004.html),
we set up a very basic blog. This post is going to use that system as a guide / example as we look ahead to
the next evolutions of our practice. I'm going to assume that you've deployed that system and have a basic understanding
of how to add a new post and maybe an image--you don't need any more detailed understanding than that.

Hopefully, you're seeing a pattern in the exercise instructions. After the [initial setup](https://raphaelluckom.com/posts/practitioner_journey.html)
and the [process of reserving a domain name](https://raphaelluckom.com/posts/practitioner_journey_003.html), each exercise basically consists of:

1. starting an admin instance
2. using it to apply a terraform stack[^1]
3. playing around with the stack for a little while
4. destroying the stack 
5. terminating the admin instance

This _really is_ a pattern that works to deploy almost any scale or complexity of infrastructure--it could comfortably provision
a service the size of the New York Times website, if you wanted it to. More importantly, it gives us secure access
to a huge variety of interesting services--AWS has pay-as-you-go services for [sending text messages](https://aws.amazon.com/sns/sms-pricing/),
[sending and receiving email](https://aws.amazon.com/getting-started/hands-on/setup-email-receiving-pipeline/services-costs/),
[processing video](https://aws.amazon.com/mediaconvert/pricing/), and [secure sign on](https://aws.amazon.com/cognito/pricing/)[^2].
There should not generally be any more hassle involved in setting up those capabilities than the five steps described above. I
don't use any services with up-front costs or monthly minimums, so adding on special capabilities shouldn't
blow up the cost of running one of these systems for most people[^3].

So if this pattern _could_ work to make anything, the next question is how we should _manage_ that complexity so that
we don't lose confidence in the basics of the system:

1. It should be cheap
2. It shouldn't require regular maintenance
3. It should be reliable

Complexity is the enemy of all these goals. More stuff means more costs, more maintenance factors and more things
to break. To deal with this, I intend to use the analogy of the [almond-shaped system](https://raphaelluckom.com/posts/almond_shape.html)
as a guide. I described almond-shaped systems as systems with "human-adapted control surface[s] that [do] not require the exclusive attention 
of anyone other than [their] user." I used the example of a handbag, where the strap is a control surface, adapted to a hand or shoulder,
that lets you carry the entire contents of the bag without needing to think about each component.

We've already seen at least two human-adapted control surfaces in this system so far. One of them is terraform; in the
most recent exercise we deployed 75 individual components, representing probably a solid month of my design time,
using a single terraform command. Terraform is like a "handle" for bundles of cloud components--once you know how
to use terraform, you have access to almost any capability that fits in the bundle, even if you couldn't assemble it yourself.
The second human-adapted control surface that I'm going to lean on is an object store like S3. In the previous exercise, we saw
how S3 provides a fairly simple, filesystem-like view of the things we make like images and blog posts; it lets you
add and delete things in familiar ways. As we saw, we can also set up little programs that run when things are added to S3,
like the renderer in the blog system that generates HTML from markdown files.

Now, I'm _not_ suggesting that the S3 UI is a good tool for managing our social media system[^4]. What I _am_ suggesting is that
S3 gives us a very familiar and legible set of organizational concepts for the _center_ of our system. To see what I mean,
let's look at the blog system example:

1. Write a markdown file
2. Put it in S3
3. A function runs, and an HTML file appears

What can go wrong with this process? 

1. We could mess up the formatting of the markdown
2. There could be a bug in the function, and it could misbehave
3. An AWS service (S3, Lambda) could go down

If one of those things happened, how would we fix it? Well, we can _look_ at S3. Everything we care about is just a file
in S3. If we messed up the markdown, we can fix it and re-upload it. If there's a bug in the function, we can fix it and re-run
terraform. If AWS goes down, we wait for them to stand it back up and then we try uploading again. If we want to back up the system,
we just copy it to our local hard drive or any other regular filesystem or object store. Compare this to a system
where everything is stored in a database[^5]--if something goes wrong or needs to change, you need to be careful to update the database
correctly. When you want to back up or restore the system, you need to understand the aptly-named subject of "database dumps." And because
databases aren't usually good at storing large files like images and videos, you _still_ need something like S3 or a filesystem
to manage media, and that needs to be kept in sync with the contents of the database. From a technical perspective, there's nothing 
wrong with a database-centered system design, but I wouldn't want to teach an eight-year-old to maintain one. Conversely, I think I could
demonstrate how to do maintenance on a S3-based system using a pretty simple drag-and-drop UI.

The other thing we get from this kind of system design is something that software writers call _loose coupling_. This means
that the different parts of the system are largely isolated from each other--if the blog-post-rendering function breaks, it
won't blow up the sign-on system; if we can't connect to the website URL, we should still be able to log on to AWS and manage
the blog posts via the S3 bucket. This also makes it much easier to develop new features without getting overwhelmed--instead
of understanding how every piece of the system works, we can do very useful and educational things by focusing only on
one specific small part of the system at a time[^6]. By making sure that the _interior_ of our system design, not just
its UI, contains human-adapted control surfaces like these, we build accessibility-to-humans into the system from the most
basic levels.

It's going to take me another week or two before I'm comfortable releasing an exercise to deploy the login and visibility
system. In the meantime, I might try to release a couple of interim exercises, possibly around [re-using certificates instead of recreating them](https://raphaelluckom.com/posts/aws_limits.html)
or setting up a bucket for handwriting HTML and Javascript to pair with a free online class (I mean that I'm sure I can find a class that
would pair with that kind of test site; I'm not going to develop one). As usual, feel free to get in touch if you have
questions or comments.

[^1]: There's no obvious word for "the set of terraform configuration files you deploy at one time." I often call
      it a "stack", especially when I'm referring to both the terraform code _and_ the infrastructure created by it.
      When I want to specifically indicate _just_ the terraform code, I often call it a terraform "config," even
      if it includes multiple separate files. When I'm referring specifically to the infrastructure, I use words 
      like "application," "system" or "subsystem" depending on the context.

[^2]: I'm probably not going to prioritize email and SMS features; I probably _will_ use AWS's sign-on service and, eventually,
      the media processing features.

[^3]: I don't take a lot of pictures or video in my daily life, so one thing I'm looking for is someone who _does_. I'm interested
      to see what kind of storage-per-month someone like a dedicated social media user requires. There's also a big difference
      between _storage_--the amount of data you _save_--and _bandwidth_--the amount of people who view your content. A professional
      photographer or videographer could easily store many gigabytes of data per month, but might not use too much bandwidth unless
      they were hosting their content for a big audience. Someone like [Cheney McKnight](https://www.youtube.com/channel/UCEVpwIpE7PpD2rt1SGtAkJw)
      or [Laura Kampf](https://www.youtube.com/channel/UCRix1GJvSBNDpEFY561eSzw), who both _create_ and _host_ lots of content would
      likely have large storage and bandwidth requirements. The way these systems work, you pay _more_ the more popular you are.
      I'm not focusing on the "social media star" use-case yet, because there's still a lot of basic stuff to do. Once I start focusing
      on that, my strategy will probably be to hook up a payment processor and then make it easy to sell cheap subscriptions to offset the costs.

[^4]: Programmers like to gripe about AWS UIs. I don't like to gripe about things (except sometimes I gripe about other people griping).
      I think the AWS UIs are kinda exactly right, because they're good enough to get things done but clunky enough to encourage you to 
      make something that suits you better than they do. I don't _want_ AWS to be trusted with usability decisions, and if they know I
      don't trust them, I don't know why I'd expect them to try very hard.

[^5]: Strictly speaking, the blog system _does_ use a database. But if the database was deleted or needed to be recreated, it could be built from
      scratch using only the files in S3; they are the only _source of truth_.

[^6]: One of the things that I really hope will happen eventually is that people who follow these instructions will start to build their own
      addons and components. There are good entry points for learning front-end development (Javascript, HTML, and CSS), operations (terraform)
      and back-end development (cloud functions) using tools we've already built. I hope to eventually go into greater depth about how to get
      started with those things, so if you're interesting in any in particular, let me know and I'll get on that.
