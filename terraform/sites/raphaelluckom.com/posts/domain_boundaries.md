---
title: "Mid-May Check-in: On Domain Boundaries"
author: "Raphael Luckom"
date: 2021-05-10T12:11:44
draft: false
meta:
  trail:
    - check-in
---
There's a kind of rhythm to this work. I've written a little about [domain boundaries](https://raphaelluckom.com/posts/diagrams_000.html)--the
places where, for technical or social reasons, one set of practitioners can be differentiated from another, even when both
are working on the same software system. Every time I cross one, I find myself slowing way down, trying to pick up
the context I need for the new work and at the same time translate my overall goals into the language of the new domain. It's
jarring--I usually move to a new domain after I've just finished something, so I'm moving from a place where I'd been for
a while, where I had weeks' worth of tools and techniques and patterns, to a new place where those tools and patterns
don't help me as much. It forces me to recalibrate my expectations about progress, like going from driving a car to building
one. 

The different domains feel different as well. The forces that shape the practitioner community--where the jobs are, how to get them,
the popular tools, the things that were popular 3-5 years ago and are now a big maintenance burden that everyone has to live with,
the type and tone of community events and spaces, the prestige landscape and its inevitably-dysfunctional social dynamics--all of
these things are different depending on whether you're talking to a person focused on databases or UX/I or networks or any other
of a large and growing number of specialties.

Within each specialty, certain metrics assume great significance. For instance, within UI development communities, page-load and
interaction times--the speed at which a browser can show and update a web page in response to user actions--are the basis on which tools
and techniques are most often compared[^1]. 

The main metrics within a domain have predictable characteristics:

1. They describe relationships that are always measurable within the domain. If you're doing UI development on the web, the page-load times
   you acheive can be measured fairly easily, even if you're not focusing on them or measuring them yourself.
2. They imply an unambiguous ranking from best to worst. In the case of interaction times, there is no controversy
   within the UI community about whether faster is better than slower, other things being equal.
3. They are understandable to a beginning practitioner, and often to non-practitioners.

When metrics with these characteristics are found, a domain or subdomain arises to optimize for them. This is a _social process_--when
you try to find an [accessible, authoritative source](https://en.wikipedia.org/wiki/Web_performance) on the standards[^2] for the metric, 
what appears instead is a tangle of industry sources and a superficial veneer of pop psychology. These things only need to be convincing
enough that [competition over who wins the metric](https://krausest.github.io/js-framework-benchmark/2021/table_chrome_90.0.4430.72.html)
can begin in earnest--once that competition starts it tends to encourage greater specialization in pursuit of better numbers. At this level,
the largest forces on the direction of development come from within the domain itself--these are things like what a job interviewer wants to hear
for one to get hired; what a project manager will measure; or what technologies are considered prestigious by practitioners. None of these
things are necessarily accountable to any notion of value that can be understood outside the domain.

When we see this dynamic in history, we aren't exactly impressed. In [Secrets of the Castle](https://en.wikipedia.org/wiki/Secrets_of_the_Castle),
an experimental-archaeology documentary about medieval French and English castles, arbalist Robin Knight observes while assembling
a crossbow:

>  There was no such thing as a crossbow-maker. One man made the tiller, the blacksmith made all of the ironwork, another man made the string--that's
>  where you get the surname "Stringer." When the guy at the end of the process got all the bits together, he didn't know how each individual part
>  was made. Because to him--and this is what the "trades" were, before "guilds," they were called "mysteries"--to him, it was a _mystery_. He just
>  wasn't aware of how it was done.

When I encounter the word "guild" in that context, and then "mystery," the associations that arise are not positive ones. These are,
_precisely_, the original "masonic societies"--mason's communities--which guarded, kept secret, and restricted the use of technologies
required by medieval lifeways, for the benefit of members of the community against the wider world. With our historical perspective
we tend to understand these restraints on _who may do which crafts_ as basically corrupt, unfair, and oppressive[^3].

Now, the comparison between software domains and medieval mysteries only goes so far. I feel in significantly less danger of being
chiseled to death by an aggrieved React developer, for doing UI development without their approval, than I would if I was trying
to do masonry work on a castle site without belonging to the local guild. On the other hand, to ask "why" too loudly and too often
in response to decisions made on the basis of factional or prestige politics is still a fireable offense in most software settings,
making obedience to these norms a de-facto requirement for employment.

It's useful for a solo practitioner to learn how to identify the structures created by these social dynamics, because they represent
the places where the big players--the facebooks and the googles and _especially_ the middle-tier who are _trying_ to be the 
facebooks and the googles--will have the most trouble competing with a solo practitioner unburdened by guild dogma[^4]. You
need to be careful not to overcorrect--most popular technologies are either adequate or very good within their domains, so pluralism
remains a virtue--but when you're building something that is intended to _span_ several domains, such as a personal social media system,
it seems wise to prioritize the values of the system as a whole--that is, the [domain-transcending rationale behind the work](https://raphaelluckom.com/posts/not_draft.html)
over the values that one finds espoused within the domain in which one is working.

[^1]: There are also metrics that derive their importance from these metrics. For instance, npm, the main place where javascript
      libraries are published, [prominently displays the "unpacked size" of each library](https://www.npmjs.com/package/exploranda-core?activeTab=readme).
      This is because size is one of the factors that affects interaction speed; it affects how long a library takes to download
      and, in some cases, how quickly it runs.

[^2]: Within "standards for the metric," I include:

      1. An agreement about how the metric is to be measured
      2. a logic justifying the method of measurement and value scale
      3. an empirically-minded community committed to revising and improving the accuracy and applicability of the measurements for the benefit of humanity. 

      [This](https://en.wikipedia.org/wiki/Seismic_magnitude_scales) is my Exhibit A for a metric that meets all of those qualifications.

[^3]: Once, at a company where I worked, we all got an email from one of the heads of marketing. She said that they were trying to get rid
      of some standing desks, and did we know of any organizations that would accept them as a donation and pay for their removal. After a few
      days when no one seemed to reply, I asked if I could take one for home. That was complicated, she replied, by the fact that we were
      in a "union building"--the company's lease stipulated that we weren't allowed to move furniture into or out of the building ourselves.
      Instead, we needed to use union labor. She suggested that maybe if I could sneak one of the desks out, that might be ok, but she'd deny
      all knowledge. I decided not to proceed. I've [written about my problems with the concept of work](https://raphaelluckom.com/posts/hard_work.html)
      [more than once](https://raphaelluckom.com/posts/late_february_check_in.html), and the way that it seems like a bad metric to use
      when distributing resources. But I don't think I'll ever really accept as morally-valid this kind of restriction--being told that some group
      has an official monopoly on an otherwise-neutral and available capability. This isn't a critique of unions generally; just of that
      tactic.

[^4]: Consider the infrastructure-management system [Kubernetes](https://kubernetes.io/). It is the successor to an internal Google project
      called Borg, and for several years now it has been a popular foundation for new deployed services. I've used it in the past; my preferred
      deployment tool, terraform, supports it, and I think it's a pretty good choice for large-scale infrastructure orchestration. But most
      new deployed services _aren't_ "large-scale infrastructure orchestration." The efficiencies of kubernetes as a system--the point at which you're
      _paying less_ and _getting better performance_ and _experiencing less maintenance burden_ because you're using kubernetes compared to
      something else--don't materialize until you're operating at a larger scale than most products ever acheive. But because kubernetes
      conveys prestige, you can expect people with "software engineer" in their title to use it sort of aspirationally--to add "-and also
      we'll deploy it on kubernetes" to the slide deck for a new project as a way of getting buy-in from higher-ups who associate
      that brand with google. It is this kind of self-sustaining dynamic--something that appears externally as inefficiency, because the projects
      end up costing more than they otherwise would, but which is efficient internally, because it is profitable in prestige within the domain--that
      solo practitioners are uniquely positioned to escape. And for the record, I don't think that venture-capital-funded startups are very
      good at avoiding this dynamic--in fact, they seem uniquely sensitive to industry perceptions of prestige.
