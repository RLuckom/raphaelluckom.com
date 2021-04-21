---
title: "Upcoming Alpha Release and Related Decisions"
author: "Raphael Luckom"
date: 2021-04-21T10:31:00
draft: false
meta:
  trail:
    - check-in
    - practitioner-journey
    - practitioner-inn
---
As I plan the next phase of this project, I keep coming back to a relatively small number of
questions about my priorities and objectives. I've settled on answers to most of them--decisions
that fit with my values and overall goals. These decisions are not final; they are pragmatic
tools to help me focus on the work at hand. I want to document them here for my own reference
and as a way of inviting comment.

#### The next release will be an alpha
In the past, I've released my designs as deployment exercises; demonstrations of how my tools and
methods work. The next release will not be an exercise; it will be a system that is intended to
be used rather than immediately torn down. It will be what's called an _alpha_ release--a version that
is known to be preliminary and incomplete, but enough for practitioners and enthusiasts
to try out.

The product development side of release planning[^1] can be oversimplified (usefully) to two categories: _in-scope_
and _out-of-scope_. Anything in-scope is planned to be included in the release; anything out-of-scope is
planned _not_ to be in the release[^2]. I've decided on a set of things to be in-scope and out-of-scope
for this release; these lists may change a little but I expect not much.

The following things are in scope:

1. An administration website controlled by a login system. This will include two plugins: a plugin for managing
   a blog (see #2) and a plugin for viewing traffic to the blog. The plugin for managing the blog will allow
   the user to write, adit, post, and delete blog entries. The plugin for viewing traffic will display some
   convenient view of the data from the site's request logs (not necessarily anything else). For the purpose
   of this item, "writing a blog post" _includes_ uploading any images to be included in the post, as well as
   processing and storing them appropriately.

   Note that the administration system does _not_ have broad permissions on the underlying AWS account. It cannot
   perform actions like creating cloud functions, setting user permissions, etc. It _only_ has permissions to do
   a small number of specific things: put files in buckets for the blog site and read the log databases.

2. A blog website on a different domain than the administration website. This blog will be _static_ as far as
   a visitor from the internet is concerned; it will simply be a set of files in an S3 bucket set up as a website.
   Those files will be managed from the administration site.

3. A _visibility system_ that collects and manages the operational data from the rest of the deployed system.
   This starts with an outline of the overall deployed infrastructure, we tell it "there's going to be a blog, and
   an admin site, etc." The visibility system's job is to say "OK, tell the blog site to send its logs _here_ and I'll
   take care of them; tell the admin site to send its logs _there_, and if you have random cloud functions, tell them
   to send their logs to this other place. _Then_, when you want to look at any of that data, you go over _here_ and you
   access it using these tools."

   The design of the visibility system is conceptually simple: all the logs go into an S3 bucket, in a special format
   so that they can be queried using database-query syntax (SQL). The implementation of the visibility system is
   somewhat complex: it manages permissions for the stored data conservatively[^3], it sets up drop locations for
   request logs, moves them to storage locations, and adds them to databases; it manages query permissions on the databases.

4. An archival storage system that permanently backs up artifacts of human attention, such as blog post text, images,
   and potentially image metadata. This system is _not_ intended for use except for disaster recovery; it's not the primary
   working copy of any document. It will replicate all of its data in deep storage on three continents.

   The system consists of a replication function and three buckets. It monitors the upload path in the bucket associated
   with the administration site; anything that the user uploads is saved off to deep storage. Note that this does _not_
   include the data in the visibility system.

5. The alpha system will include a prototype plugin system; a way for features like the blog subsystem to integrate with
   the admin, visibility, and archive systems.

The following things are out of scope:

1. Multifactor auth on the login system.

2. Circuit breakers for cost overages. I'm marking this out of scope because I love this idea and I can feel it pulling at
   my attention but I don't have capacity for it in this release. The implementation is simple; a function that has permissions
   to disable cloudfront distributions and perhaps delete permission policies. It is connected to a billing alert, so that if the billing
   alert fires, the function shuts down the website(s) and cancels all permissions to write to storage locations. The effect of this
   would be that the processing parts of the systems stop but none of the data is lost. To restore the system to an operational state,
   you would need to re-run terraform (exactly the same as the system installation process). Terraform would notice all the changes
   made by the circuit breaker and undo them.

3. Any functionality beyond "blog," including direct messaging, payment processing, etc. These are for subsequent releases.

#### The plugin system will use guard rails, not barricades, between plugins and the main system
Both guard rails and barricades are types of security controls, but their functions are different. Guard
rails protect against accidents, while barricades protect against adversaries. There are two modes where we need
to think about guarding plugin permissions; _installation_ and _operation_.

The _installation_ step is when we're running terraform to install the system and its plugins. This is the riskiest
phase, because we use admin permissions to run terraform, so if a malicious plugin developer got code into this phase,
they could do anything. The strategy for preventing this from happening is that, for now, _there are no plugins except
the ones I've written myself_. This overall system prioritizes _trusting its owner_, which inescapably means that attacks
that target the owner's psychological vulnerabilities--social engineering, etc.--will always be a risk. If we want to minimize
this risk in the installation step, we have a pretty tricky line to walk, because there's no simple way to distinguish
useful actions from malicious actions[^4]. One approach to this is to "sandbox" the permissions that a plugin gets during
installation; restricting it to just the things that it needs to do. I don't feel able to do that _yet_ for two reasons: first,
I want more experience writing plugins before I try to build a sandboxing system; if I try to do it now I will definitely get
it wrong and end up having to rewrite it later. Second, the only designs I can think of at the moment would add complexity to the
installation process. Right now, I'm the only one writing code and there are no other system owners. I can't justify making it _more difficult_
to deploy the system _in anticipation_ of system owners and plugin authors who have yet to materialize. Walk first, run later.
From the point of view of a plugin author, the installation system includes guard rails to prevent mistakes; it does not include barricades
to defend against deliberate attacks.

In the _operation_ mode, I'm pretty confident in the way that things are locked down. As I said earlier, none of the deployed
services--the admin website, the visibility system, etc--have permission to modify the infrastructure beyond writing to storage
locations. If the login system was compromised, the adversary would be able to view, edit, post, and delete blog entries, save things to
(but not delete things from) the archive system, and view (but not edit the underlying data from) several databases of logs. They
would _not_ be able to modify AWS permissions, create cloud functions, alter networking settings, or anything else.

In a [previous post](https://raphaelluckom.com/posts/isolation_proposal_001.html), I outlined my proposal for isolating plugin
permissions from each other during operation. I've tried my best to invite critique of that design; I posted it to [security stack exchange](https://security.stackexchange.com/questions/248281/isolating-permissions-available-to-browser-js-via-oauth-and-referer)
and all my social media except instagram. So far no one has come forward with vulnerabilities, but my network is small. I should
also admit that "inviting critique" in this case equals "soliciting unpaid labor." I happen to think that most of the people capanble
of that kind of critique _owe_ the world a bit of pro-bono work, given the externalities software has imposed on society, but I'm
not volunteering to fight that battle in addition to the unpaid work I'm already doing.

#### Conclusion
In my [early January check-in](https://raphaelluckom.com/posts/early_january_check_in.html), I wrote about the basic components
I was developing, many of which are going to be in this alpha release. I said, "These capabilities and others form the underwater part
of the iceberg--they will take a while to get right and for most of that time it'll seem like not much progress is being made. 
Once they reach a certain critical mass, things will start to happen _fast_." We're still probably a month or two away from that tipping point;
I don't expect it to happen until I've published a beta release after the upcoming alpha. I had hoped to be closer than that by now, but
being a month or two behind schedule at month 7 of a planned 12-month project is not unusual for this kind of work. My progress has
been satisfyingly steady and I've been working at a comfortable pace. 

As always, I welcome comments via email or on social media; I'm not hard to find.

[^1]: As opposed to the deployment side, the operations side, the marketing side, the accounting side, etc.

[^2]: People sometimes use "out-of-scope" to mean "if we have time." That's not how I use the term.
      For me, the purpose of declaring something out-of-scope is to _remove it from the set of things I consider
      in immediate decisions_. It's something that I've deliberately set aside until after the release cycle ends
      (at which point I'll reevaluate if appropriate).

[^3]: A full writeup on this is forthcoming, probably. A place to start looking at the code is [here](https://github.com/RLuckom/terraform_modules/blob/main/aws/visibility/aurochs/components.tf).

[^4]: If you let a plugin author have write access to an S3 path, they can write data to it infinitely, costing
      a potentially infinite amount. If you let them have access to read data, they can spy on it. Capabilities
      that are required for intended uses can be abused for adversarial uses. 
