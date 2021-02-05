---
title: "On Security 002: Security Approaches For Personal Social Media Systems"
author: "Raphael Luckom"
date: 2021-02-05T18:30:00
draft: false
meta:
  trail:
    - practitioner-journey
    - security
---

The blogging system deployed in the [previous exercise](https://raphaelluckom.com/posts/practitioner_journey_004.html) marks our
first foray into usable[^1] infrastructure. That means it's time to talk about security.

The [first security post](https://raphaelluckom.com/posts/on_security_000.html) in this series describes how
security overall means _appropriately protecting value_. In the [second post](https://raphaelluckom.com/posts/on_security_001.html),
I proposed a list of values that I believe social media should support, focusing on both _capabilities_ (things the system should
enable you to do) and _risks_ (things the system should protect you from). The capabilities I identified center around the ability
to use public, semi-public, and private speech via text, photos, sound, videos, and other media. The _risks_ I identified include
harassment, misinformation and disinformation, and both small and large-scale threats to privacy. Looking at the list again, I think
I also need to add an explicit point about cost, since the operating cost of the system (in time, money, and complexity) affects its availability
to different users.

Now that we have a stable idea of what we mean by _security_ and a general idea of the kinds of things we expect this system to _do_,
we can use them to articulate a system of _controls_ that plausibly protect the system as a whole. One of the best resources for
this task is a document called NIST Special Publication 800-53 ([PDF](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf)).
This document describes how to match security controls to the intended use[^2] of a system--just what we're trying to do now.
It describes three different security approaches that systems can use:

1. _Common_ security approach: In this approach, a _single system_ handles a security control for a number of client systems.
   You can think of this as a "building security guard" approach. Imagine a condo building in a city. All the occupants of the condo
   building want the property to be secure, so they hire a security guard _in common_ to sit at the front desk and control building
   access. In this approach, _one_ system (the security guard role) is responsible for the "building security" function for
   each individual unit. Every unit depends on the same system.

2. _System-specific_ security approach: In this approach, _each individual system_ handles its own security. Imagine a neighborhood
   of the super-rich. Each house is set way back from the street, and there's a big fence around each property. Every house has its own
   gate with its own security staff controlling access. Every gate guard on the street has basically the same job, but they are only accountable
   to what the individual homeowner wants.

3. _Hybrid_ security approach: This approach combines the common and system-specific approaches. In the case of a big condo building,
   the hybrid security approach would be for a _common_ security guard to control building access, but each resident might have an 
   individual alarm system. The security guard role would be an element of common security, while the alarm systems within the units
   would be an element of system-specific security.

By using cloud services, we are firmly in the hybrid security approach category. When we use our credentials to put a text file in
a bucket, we're relying on the _cloud provider_ to make sure the bucket and its contents are secure against attackers and operational
mistakes. However, when we deploy services in the cloud, it's our job to make sure that those services don't _introduce_  or present their own
vulnerabilities. AWS (as a representative example of a cloud provider) describes this as the [shared responsibility model](https://aws.amazon.com/compliance/shared-responsibility-model/)--they
(AWS) are responsible for clearly documenting the security features of their products and we (people who use those services) are responsible
for _using_ those security controls in sensible ways.

Since we're talking about services like data storage, let's look at the difference between facebook and the idea of a _cloud provider_
I've been using in this post. A _cloud provider_ is a company you rent services from under some agreement. That agreement spells out
what services you're paying for, such as data storage and processing, what it costs, and what the service operator can do. The cloud
provider is not allowed to look at your data at all except in special circumstances, such as with a court order or if they notice
suspicious activity. This might (correctly) give some people pause, but it is _worlds apart_ from the relationship you have with a
social media company like facebook. Facebook may not allow _human_ employees to look around at users' private data, but their entire
business model is based on selling access to that data through tools like ad targeting. If everyone with a facebook account managed
to switch to their own services hosted on a cloud provider, the cloud provider would not be able[^3] to use their data in a comparable
way. 

So when we talk about a hybrid security approach, we are _not_ talking about letting AWS make decisions about our data. We are talking about
using AWS as hired security for resources under our control. We're also acknowledging that we are going to _rely_ on that security
for some of our operational needs. We're going to trust that AWS will not let anyone put an object into our bucket unless we've explicitly
allowed it. We're going to trust that, as giant companies with huge security budgets and financial reasons to care, cloud providers
will tend to do a better job at being security guards than we could on our own[^4]. 

In general, I would suggest that we rely on security systems provided by cloud services in a few different scenarios:

1. Within specific areas, I may not feel comfortable building certain components from scratch by myself. For instance, I'm strongly
   considering using an AWS service to handle login. This would likely allow us to have two-factor security for login to _our own sites_,
   which would be _awesome_. I don't think I could build a system as reliably secure, and if I tried I don't think I'd feel comfortable
   asking others to use it.
2. Every cloud service includes security controls of one kind or another. An object store like S3 offers access controls for each
   object. Whenever we are using a service, we will _first_ use the security controls provided for that service, and only implement
   our own security controls if we need some specific control not included in the built-in ones.
3. Some of the security controls we want will be _about_ cloud providers. For instance, the [billing alert](https://raphaelluckom.com/posts/practitioner_journey_002.html)
   that we set up in a previous post was a security-adjacent control that had to do with AWS itself. In general, we'll trust the cloud
   providers to make sure those security controls work.

There are also some things that we're going to handle ourselves:

1. Practice good security: Choose a good password for your AWS account and set up [MFA](https://aws.amazon.com/iam/features/mfa/)[^5].
   Do _not_ give out credentials to anyone. Do not run terraform configurations except from people you trust. Don't run _any_ command
   unless it's from someone you know and trust. Be _highly_ skeptical of anyone claiming to be from Amazon--they don't do house calls.
   By far, the human factor (you and me) is the biggest source of risk in this whole equation.
2. Practice least-privilege: each component of the system should only have access that it needs to perform its functions. That means that
   I am being careful to strictly limit the access given to different components. 
3. Openness and reviewability: Just because I'm being careful doesn't mean I won't mess up, so if you think you've
   found a flaw please let me know, and thanks for paying attention. All the code involved is in my github repos, linked at the top
   of this page.

These security posts are kinda hard to write. On one hand, I hope you can tell that I _really believe_ what I'm saying. On the other hand,
a lot of the problems we have in the world are because someone like me _really believed_ in something and it turned out to be wrong.
The best I can do is to try to show my reasoning for each decision and hope that people will either find it convincing or help
me see the problems so I can fix them. Security is very personal; at the end of the day. everyone has to decide for themselves what
they value and what they trust.

[^1]: In this sentence, "usable" means that it's _potentially adequate for some users indefinitely_, not that it's accessible to all
      users. The blogging platform in the last exercise is not an end-point; it's a _very basic_ thing that I think a person might
      call "good enough." My evidence for this claim is that I'm a person.

[^2]: _Intended use_ hides a multitude of sins when we talk about security. Publications like NIST 800-53 trust the _owner_ of a
      system to fairly represent all the system's stakeholders. In practice, this means that if the system owner _wants_ to do something
      like track all the users all the time, they can define that capability as an intended use. When that kind of capability
      is defined as an intended use, the priority of the security system is to _protect_ it, such as by making sure the data collection
      is efficient and stable and protecting the collected data from adversaries. In my personal and professional opinion, this reliance
      on corporations like Google and Facebook to self-regulate the intended functions of social media systems is _the biggest_ threat
      that exists in this space. It's precisely why I've chosen the approach of building systems that perform well and cost little
      when under individual control--so that the definition of "_intended functions_" with respect to these systems is accountable to the system 
      owners / users as directly as possible. This means that when those intended uses are turned into a set of actual security controls, 
      the controls have a better chance of protecting the individuals' values, rather than those of rent-seekers.

      The next question to consider, if we're being honest with ourselves, is: "If the sum of the system that is now facebook (for instance) 
      actually acted in the self-interest of its users, would that be _better_ or _worse_?" That's a very important and interesting question,
      and I _believe_ the answer is "it would be better," but it deserves its own blog post. With the big questions like that, I don't really
      trust anyone who's sure they're right.

[^3]: Here "able" has two separate meanings. First, a cloud provider's customer agreements are dominated by the needs of _big_ customers--
      the ones who drop hundresds of thousands on their bill in a month. Those customers--like media companies, pharmaceutical companies,
      etc. do _not mess around_ when it comes to their confidentiality needs. When a movie studio uses AWS in their editing pipeline,
      the expectation is that an AWS employee _cannot_ leak the unreleased footage. It would be a _disaster_ for a cloud provider to be seen
      not to prioritize the confidentiality of its customers' data--it could be a business-ending event. This, much more than any person's
      assurance, is the kind of security I like to rely on--a case where I have reason to believe that my interests line up with those
      of a supplier.

      The second meaning of "able" in this context is technical. One of the big advantages that a company like facebook enjoys is that
      it controls the structure of its data. It has massive databases of highly structured data to which it sells different kinds of access.
      In a distributed system, even if individuals all collected exactly the same data, it would be stored in a wide variety of much smaller
      data sets, making it a much bigger logistical challenge to put together even if anyone could get access to it in the first place.

[^4]: This is one of those dangerous arguments that's basically-true but needs to be applied and interpreted carefully. My whole project
      is in a precarious position, ethically speaking, as long as it's tied exclusively to AWS (see an earlier discussion of this [here](https://raphaelluckom.com/posts/practitioner_journey.html#fn2)).
      There are good reasons for not wanting to have anything at all to do with Amazon as a company, so I don't take lightly the decision
      to advocate the use of AWS. The reason that I _do_ take that position is because, for now, my priority is to provide system designs
      in the easiest and most accessible way I can, and my familarity with AWS makes it easiest for me to use as an example system. If this
      experiment works--if people start to follow along--it will be incumbent on me to demonstrate how these systems can be hosted on _any_
      cloud provider that offers a small set of generic services, so that consumers can pressure suppliers to behave ethically.

      Mostly, I don't mean to say that it's as simple as "Amazon does a better job than we could, so we should use AWS." The goal is to
      design the system in a way that it can be hosted anywhere, but _for now_ AWS satisfies the other criteria best.

[^5]: Unless you want to buy a [security key](https://www.yubico.com/product/yubikey-5-nfc/) a multifactor authentication app for your phone
      is probably the most secure second factor you can get--they're _very_ secure. [Authy](https://authy.com/) has a good reputation.
