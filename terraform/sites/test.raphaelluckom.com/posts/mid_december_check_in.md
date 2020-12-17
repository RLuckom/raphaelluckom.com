---
title: "Mid-December Check-in"
author: "Raphael Luckom"
date: 2020-12-15T22:22:22
draft: false
meta:
  trail:
    - check-in
---

You might notice that things look different around here. This is the first week that I'm
using--actually using!--cloud software primarily of my own design.

There is very, very little to this whole system. I write these posts in a simple text editor,
on my computer. I write them in [markdown](https://en.wikipedia.org/wiki/Markdown#Example). While
I am editing it, a post looks like this:

    ---
    title: "Mid-December Check-in"
    author: "Raphael Luckom"
    date: 2020-12-15T22:22:22
    draft: false
    meta:
      trail:
        - check-in
    ---

    You might notice that things look different around here. This is the first week that I'm
    using--actually using!--cloud software primarily of my own design.

    There is very, very little to this whole system. I write these posts in a simple text editor,
    on my computer. I write them in [markdown](https://en.wikipedia.org/wiki/Markdown#Example). While
    I am editing it, a post looks like this:

When I'm finished writing it, I send the file up to an [aws s3](https://docs.aws.amazon.com/AmazonS3/latest/dev/Welcome.html) _bucket_.
S3, along with the similar services offered by other cloud providers, is an example of an _object store_. They are not _exactly_ 
the same as a hard disk, but they're used for storing files.

One funny coincidence about storing files online--it's a very similar activity as _looking_ at things online. People who design
software have invented lots of intricate rituals about it--at my count, in takes five different interactions to post something
to instagram--but from the perspective of the network, the only difference between writing a file _to_ a website and reading a file _from_
a website is which direction the data travels. Which raises an interesting question--if "publishing" just means "putting a file in
a particular location" and "browsing" just means "reading a file from a particular location" then why can't a website just be "the location
that you write to and read from?" It can, of course--that's the idea from which the entire internet arose. Sites built this way
are called _static sites_, because they consist of simple text files that browsers can request.

So I write a file like the one above in a simple text program. Then I save it to my website bucket

    aws s3 cp sites/test.raphaelluckom.com/posts/mid_december_check_in.md s3://test.raphaelluckom.com/posts/mid_december_check_in.md

As soon as that's done, it's posted. You can see that very version of the post [online](https://test.raphaelluckom.com/posts/mid_december_check_in.md),
right now. Of course, it's not much to look at. Browsers are good at displaying HTML. So there's a little helper that wakes up, whenever
a new markdown file lands in the bucket, that opens the new file, makes an HTML version of it, and puts _that_ online. A second helper function
figures out which lists the post needs to be added to--like the front page--and adds it. The only programs that I need installed on my computer are
a text editor and a program that can upload a file.

That's pretty much it. I write some text in a file, then drop it in a public location. Anyone can read it. My monthly AWS bill is under $1.40.
In terms of moving parts, it's dead simple. "OK," the dismissive-software-engineer-in-my-head sneers, "There are _already_ lots of static site
generators. Why didn't you just use one of those?"

The answer is that I didn't want "a static site generator" as a _separate tool_. I don't want to have separate relationships
with an amorphous galaxy of private companies and organizations, any one of which could disappear or become otherwise unavailable,
taking my infrastrusture and data with it. I want "my data"--things like my photos, my writing, and my code--to belong to a single system.
I want that system to be built of industrial-grade components. I intend to continue improving it for the rest of my life, because
I intend to keep _using_ it for the rest of my life, and over that whole time I expect to continue building my understanding and my preferences.
I've been working on the central library, [exploranda-core](https://github.com/RLuckom/exploranda-core), slowly over the last three years.
Step by step, I'm attempting to build for myself the _entire field_ of "computer services I need" out of interchangeable and reconfigurable parts,
without arbitrary organizational boundaries, system design philosophies, or maintenance schedules introducing perverse incentives.

As an independent, solo builder, my two advantages are "not having economic incentives to do dumb or antihuman things" and "being able to
express an inherently-consistent architectural style across the entire scope of what I build over a timescale of decades." In _every other category_--keeping
up with third-party tools and libraries, spending time on the care and feeding of infrastructure, specializing in different aspects
of publishing, coding, and art--in every one of those categories, a small and talented team could get miles ahead of me, and even a large
and well-funded organization might have a competitive shot. So I'm playing to my advantages--betting that the best person to build systems
for future-raphael is present-raphael, and betting that I can make that worth more, over time, than using the best separate purpose-built tools
that exist today. With this website-generating component, I have something that _might_ be almost ready to package up for public reuse. That chunk of work is
something I expect to tackle in the coming months: making this whole suite of services so simple to deploy that anyone can do it, no experince necessary.

Before I sign off, I wanted to introduce a little feature I'm very excited about: _trails_. At the bottom of each post, you'll see multiple
links connectibng each post both to the previous and next posts, but also to other posts in the same category. I borrowed this idea
from [Christian Weiske](https://cweiske.de/tagebuch/android-root-adb.htm), and it's also very similar to something described in the 1945
essay [As We May Think](https://www.theatlantic.com/magazine/archive/1945/07/as-we-may-think/303881/) by Vannevar Bush. Writing about the
challenges of keeping up with a constant influx of information, he described a vision of what we now know as hyperlinks--links on the internet.
He imagined a system based on microfilm, where every document could be part of many _trails_ of information. These trails would represent paths
through different subjects. Interested people would be able to publish their trails, separate from the documents themselves, so that others could follow
their reasoning. 

I've wanted something like that for a while now. These [check-in posts](/trails/check-in.html) represent a logical grouping of types
of posts on this site. I wanted it to be simple to skip through from one check-in post to the next check-in without having to wade through
whatever else I happened to publish in the interim. At the bottom of each post, you'll now find links to the next and previous articles in every trail
in which the article appears.
