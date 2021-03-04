---
title: "On Testing 001"
author: "Raphael Luckom"
date: 2021-03-03T08:25:34
draft: false
meta:
  trail:
    - practitioner-journey
    - practitioner-inn
    - testing
---

In the [previous post on testing](https://raphaelluckom.com/posts/on_testing_000.html), I made the same arguments about testing that I've made
in other places about security; namely, that they are best thought of as _pragmatic tools for
achieving goals_ rather than other things[^1]. In this post, I want to describe my testing strategy
for the access-control system I'm working on, as a practical example of what this approach might entail[^2].

This access control system uses the [OAuth 2.0](https://oauth.net/2/) _protocol_[^3] for authorization. If we imagine
it as a physical system for controlling access (such as to a conference), we could visualize it the following way:

![SVG showing an oauth flow as if it was sign-in tables at a convention](/img/on_testing/001/event_security_analogy.svg)

Each of the green, blue, and red trails in the image show a path that a person might take. In the green trail, someone arrives
at the conference and needs to gain entry. She first goes to the main door, where the person checking wristbands sees that she doesn't
have one yet. They direct her to the sign-in desk. At the sign-in desk, she presents her ID, and they print out a little ticket
that she can exchange for a wristband. The ticket has a picture of her printed on it, like a driving learners' permit. She takes
that ticket to the wristband distribution table, where they take it, check that it's valid and that she's the person in the picture,
and then give her a wristband. With the wristband, she goes back to the main door and is allowed through onto the convention floor.
She can enter and leave as she wishes using the same wristband until it expires, which may be for a few hours or a day.
The blue path shows what happens when someone tries to enter the convention floor with an expired wristband. At the main door, he
is directed to the "old wristband replacement" table. At that table, the staff look up his information from a code
on his existing wristband[^4], and use that code to make a new, non-expired wristband. This means that he doesn't
have to do the whole ID/ticket/wristband process if he's already done it recently. The red path shows that there's a place to dispose of
wristbands when you're ready to leave. This is useful, since you don't want valid wristbands just floating around outside the convention,
but they don't check for any kind of validity--they just accept any wristband from anyone and throw it away.

In this diagram, the elements in rectangular boxes correspond to the functions in our access ccontrol system[^5], so _those_
are the elements that we need to write tests for. For the rest of this post, we'll just focus on the `check_auth` function--
the one that's the keeper of the main gate in the diagram above. We can describe what it does as a flow chart:

![SVG showing an oauth check auth flow chart](/img/on_testing/001/check_auth_flow.svg)

This flow chart shows the logic involved in checking a wristband at the main door. The part about "checking at the wristband
validation desk" is not _exactly_ what happens but it's close enough for this discussion. Notice that the blue, mauve, and green
boxes are the only places where the process _ends_, either because the person is let through or because they're sent somewhere else.
Another thing that we can deduce from this diagram is that information _enters_ this process in two places: at the very beginning, when
we start to look at the wristband, and in the middle, when we get or don't get a response from the "validation desk." The places where the
process ends are called _output_. The information that enters the process is called _input_. When we have this flow chart and we've 
identified inputs and outputs, we can describe some of the tests we would like to see, using statements with the pattern "If {something about
the input} then we expect {something about the output}." For instance, one test case could be, "If someone presents an expired wristband,
then we expect that they will be redirected to the refresh desk." This test case "covers" the _branch_ of the logic where there is a token but
it has expired. Software writers sometimes measure _code coverage_, referring to the amount of the production code that is covered by one
or more test cases. One of the ways that coverage is measured is the percentage of branches through the code that are covered by tests[^6]. 

You can usually start an argument among programmers if you can get them on the subject of how much an individual test should cover, and how
many of which kinds of tests you should have. Some people would call the test case I described above a _unit test_, while others might call it
a _functional test_ or a _smoke test_ or maybe even a _behavioral test_. As with security and everything else, I'll tell you what seems reasonable 
to me and note that opinions differ.

I like testing at this level of granularity. Specifically, in a case like this, where we are talking about security code, I want a minimum
of 100% coverage using only tests that deliver a request (and control the other input) and validate the response; after that, I want to add extra
tests for cases that seem tricky or areas where I want to have more confidence in specific properties. When I have these, I know a few things 
about my code:

1. There is probably no code that is unreachable in actual operation
2. There is an example, within the test code, of most of the major ways that the code can be called when it's in production
3. If someone describes a vulnerability in the code, it should be easy to write a test case that reproduces it using only an outsider's description 
   of the issue
4. When I come back to this code and these tests, understanding "what is being tested" is the same as understanding "what the code is supposed to do"

The other benefit of this type of testing is that it's fairly easy to explain to non-practitioners. That might seem like a strange priority
to include in a conversation about testing--surely this is more of a practitioner topic? But it is an often-stated goal of my project that
this system should be [_legible_](https://raphaelluckom.com/posts/toward_legible_computing.html). That means that I want the system to be available 
for inspection, and to offer up coherent and useful details, at the most granular level practical. In a way, the tests I write participate in the 
same attempt at accountability that I am making in this blog: the tests describe how I am translating the things I write here into the code
that I am writing.

[^1]: Security and testing (or Quality Assurance (QA)) have their own practitioner communities and logics.
      What I would describe as _essentialist_ security and QA philosophies--ones that claim to represent
      fundamental, self-evident and universal features of security and testing that are unique to those areas--
      can be identified by their focus on the _borders_ between their area of practice and others. That is, essentialist
      practitioner oral traditions see QA and security as specialties distinguishable from other types of software
      writing. We can imagine how easily this happens: 

      1. A security vulnerability causes a breach at a company
      2. The software leader tells a software writer to review the security posture of the company's services
      3. The software writer notices a pattern of vulnerabilities all resulting from similar errors and misconfigurations
      4. A document of "security best practices" is written
      5. Despite everyone's best efforts, the document assumes legalistic significance, representing all of "security" from
         the perspective of the organization.

      This cycle moves responsibility around by a kind of capillary action--every group that uses the "security best practices"
      document increases the status of the authors, but also increases their risk--whoever sticks their neck out to
      define security for the organization will reap the benefits of grateful attention as long as nothing bad
      happens, but becomes a natural scapegoat when something does. This can lead to a kind of arms race, where those
      responsible for the official security standards notice behavioral adaptation [[PDF](https://aaafoundation.org/wp-content/uploads/2017/12/BehavioralAdaptationADAS.pdf)]
      in the rest of the organization--people come to see the security standards as comprehensive checklists rather than
      elements of a larger holistic design process. To hedge against this concentration of risk, the security team
      finds itself delivering two contradictory messages: that security is _everyone's responsibility_, part of a holistic
      design process inseparable from the organization's regular goals and practices; _and_ that the security team has
      some type of unique insight, independent of that holistic context, to which other teams should defer. Unfortunately
      for everyone, both are usually true.

      As unpleasant and counterproductive as that situation can become, it's the projection of that dynamic _beyond_ organizational
      boundaries that I'm trying to highlight when I stress that testing and security should be thought of as _pragmatic tools
      for acheiving goals_. When practitioners are socialized within an organizational culture like I described above, two things can happen:

      1. Certain practitioners become visible authorities on behalf of their organization: they have "security" or "QA" in their title
      2. From the outside, it appears that the abstract idea of security or QA has been given definition by the set of people
         with these roles

      In fact, it is not _the_ abstract idea of security or QA that is represented by "the set of people with security or QA in their title,"
      but rather _an_ expression of security or QA that happens to be well-adapted to the context of corporate software production. Practitioners
      are not only found in that context; we are pluralistic and heterogeneous. And we can avoid being stunned into obedience to the norms
      of that context by continually appealing to our pragmatic realities.

[^2]: I think that a lot of the best and most insightful commentary on these dynamics suffer from a lack of practical examples. I consider
      it a particular strength of my approach that I can pair commentary like this with the decisions I'm making as I build an actual, non-toy
      system.

[^3]: In this context, "protocol" refers to a standardized set of steps for completing a process. For instance, a lab technician would use
      a _test protocol_ to perform a test on a sample; the protocol is the description of the steps required to get the test result. In this case, the protocol
      I'm working on is a standard way of doing access control. When it's possible to narrowly define the thing you want to do (in this case,
      "control who can see certain web pages") it's usually a good idea to look for an existing protocol that does it (in this case, OAuth2).
      When you rely on a published protocol, you get the benefit of the time and design review that went into it. When you invent your own
      protocol, you run the risk of overlooking something that your adversaries won't. There's a saying in security protocol design: "anyone
      can design a security system that _they personally_ can't think of a way to break." Humility is a healthy impulse here.

      Notice that this is an example where we _do_ want to follow the advice of security-focused practitioners. In footnote 1, I described how
      we should not reflexively accept the _priorities and values_ that arise from corporate software production environments. Here, we are not
      talking about priorities or values; we are talking about a narrow and well-defined situation (controlling access) where what _we_ want
      as an outcome (we, as system operators, control what we share and with who) is identical to what _they_ would want in the same situation.
      This is the type of nuanced distinction that sits at the heart of my project; while I don't share the aims of capitalism or corporate software
      production, I have no compunctions about using the tools of either when they are useful to me.

[^4]: (_well actually_) To be technically accurate regarding OAuth, there are two or three separate "wristbands" that each person is given. There is
      a specific "refresh" wristband, different from the one used to gain entry to the convention floor, that would be used at the "wristband 
      replacement" table to get a new access wristband and a new refresh wristband.

[^5]: (_well actually_) There's also one other function not pictured here, which sets security headers on HTTP responses. It doesn't fit this metaphor
      well and it doesn't affect the relationships between the elements shown.

[^6]: Code coverage can be misleading, and in general I don't set much store by it, but in cases like this kind of security code I think it's
      appropriate. Code coverage can definitively show you what _isn't_ covered, but it doesn't really show you what _is_. When you reach 100%
      test coverage, that means that 100% of your branches or lines of code have _been executed_ during the test. It doesn't tell you whether they
      encountered a representative sample of the data they might encounter during use, and it doesn't even know whether you _checked the output_.
      Given that even with test coverage metrics, you're still on the hook for those other things, you can see why I sometimes think of it as
      mostly meaningless.
