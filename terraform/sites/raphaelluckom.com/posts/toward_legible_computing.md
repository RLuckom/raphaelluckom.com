---
title: "Toward Legible Computing"
author: "Raphael Luckom"
date: 2020-12-28T16:25:34
draft: false
meta:
  trail:
    - systems
    - pedagogy
    - ethics
---
About ten days ago, I was trying to [decide what to do next](https://raphaelluckom.com/posts/deciding_what_comes_next.html). I
identified five broad options:

1. Fix up this site as it exists
2. Package what I've done so far so that others can use it
3. Add new features to make this site more useful
4. Spend some time on crafts like sewing, to recharge and explore use-cases for independent-business services.
5. Find ways to make important technology conversations more accessible to non-practitioner communities.

Since I came up with that list, I've been taking on little housekeeping tasks and giving my subconscious
time to make up my mind. I'm finding myself drawn most strongly to the last item--looking for ways to
include non-practitioner communities in conversations about technology.

In this post, I'm going to propose a program for empowering non-practitioners to participate in building
useful, ethical, day-to-day systems like social media platforms and shops. This model has three goals:

1. For non-practitioners to have accountable systems that they will actually use.
2. To build nuanced critical awareness of technology in non-practitioner communities.
3. To offer the practitioner oral tradition of software writing in a form that can be absorbed usefully into the oral traditions of non-practitioner communities.

I want to define these goals in explicit contrast to a very popular goal that I think is far less usefully
focused: "teach people to code." I'd like to illustrate the contrast by using the concept of _acceptance criteria_ (AC)
from the [Agile](https://agilemanifesto.org/) family of software-writing practices. Agile is a process-focused
structure; it presents software-writing as a cyclic process of planning a small amount of work (usually a week or two),
doing that work, reflecting on it, and planning the next steps. Within this process, acceptance criteria are
the specific conditions under which a task will be considered _done_. If I wanted to describe acceptance
criteria for the task of "doing the dishes," I would say something like "all of the dishwasher-safe dishes are in the dishwasher,
and anything that needs to be washed by hand is clean and drying or already put away." Notice that this formulation
tries to maximize autonomy for the person doing the work--I didn't say _how_ to get those results, and the results I asked for are
not open-ended. The intent is to create accountability in both directions within the planning process. The person
who _sets_ the acceptance criteria is responsible for making them represent something useful. If I'm in charge of managing
cleanup from dinner, and I assign "doing the dishes" to someone with the above AC, and we get to the end of the night and our
team doesn't achieve its cleanup goal because the tablecloth is dirty and needed to be washed, that is my management failure.
By defining acceptance criteria, the planner accepts accountability for the division of the overall objective into tasks. In
contrast, the people doing the work are accountable for meeting their acceptance criteria. They are _not_ accountable for
accurately second-guessing what the AC should have been[^1]. Some varieties of this practice explicitly call out things that
are not part of the AC, so that the person doing the work isn't pressured into doing more than they signed up for.

In the following sections, I propose acceptance criteria for each of the three goals above, with commentary that contrasts the
goal against the generic goal of "learn to code."

#### Non-Practitioners Have Accountable Systems

__Acceptance Criteria__: The people who participate in this program end up with accountable utilities that they use in their day-to-day lives. Here,
"accountable" roughly means the [four freedoms](https://en.wikipedia.org/wiki/The_Free_Software_Definition#The_Four_Essential_Freedoms_of_Free_Software) expressed in the 
Free Software Definition.

This AC can be satisfied in a huge variety of ways, many of which don't include knowing how to code. Setting up a personal
website using open-source software would count (as long as it's actually day-to-day useful). There are also various platforms that
meet my definition of accountability that don't require coding to set up. 

This AC _does_ make meaningful demands of participants. First, it requires participants to have a goal in mind _for themselves_.
Specifically, this excludes goals like "build a better facebook for my community," where success involves changing the behavior
of a whole group of people. It requires that participants feel personally motivated to use these systems for their intended
function, rather than motivated by the potential impact of the systems should network-effects take hold.

#### Nuanced Critical Awareness Of Technology

__Acceptance Criteria__: Participants understand issues of ethics as those issues relate to their own systems, and are able
to identify categories of false claims about those system types.

This goal is intended to give participants access to the perspective of service operators in a practical way. A huge part of
public debate about technologes is threatened by misinformation and disinformation. This takes the form of companies selling
services based on [misleading claims of efficacy](https://en.wikipedia.org/wiki/Base_rate_fallacy#False_positive_paradox),
special interests lobbying for favorable decisions based on [incomplete or biased representations of their domains](https://www.wired.com/story/sorry-facebook-ios-changes-not-bad-for-small-businesses/),
and [human choices masquerading as unavoidable outcomes of technical factors](https://twitter.com/moonalice/status/1340133707831627776).
However, non-practitioner advocates for fair and humane practices have had little success in reining in these abuses so far. I believe
that one of the reasons for this is the difficulty of effective coordination between non-practitioners and practitioners. These two groups
are usually sitting on opposite sides of the table from each other; each side sees itself in a zero-sum, adversarial game to
restrict the opponent while preserving the most freedom[^2] for themselves. One way to bridge that divide is for practitioners and
non-practitioners to create a shared contextual vocabulary that describes the systems in question. That is, instead of approaching
the disagreements from the perspective of what we want people to be _protected from_ or _prevented from doing_, we instead focus on
the _intended_ functions and behaviors of systems, the ethical legitimacy of those intentions, and the risks to mitigate while trying 
to achieve them.

#### Offering Access to Practitioner Oral Tradition to Non-Practitioners

__Acceptance Criteria__: Participants understand how to find and use the same sources of knowledge as practitioners themselves,
without feeling the need to accept existing community norms and structures.

Existing practitioner communities have well-documented failures of diversity. These failures have proved difficult to remediate
by simply inserting members of under-represented groups into practitioner communities and hoping for the best. I ascribe part of the
problem to a persistent misunderstanding on the part of practitioners--that successful diversity initiatives are equivalent to
_incorporating_ under-represented groups into the existing community structures and norms. In fact, we should expect that under-represented
groups will have markedly _different_ goals, expectations, and norms, which are not negotiable as the cost of entry into practitioner
communities. Since these inevitable conflicts aren't predictable or easily resolved, the acceptance criteria of this goal is intended to 
separate _access to practitioner information and capabilities_ from _acceptance of practitioner community values_.

#### Conclusion

This is meant as a conceptual framework for expanding access to technical capabilities and knowledge. Its goal is not to
_train new practitioners_, but rather to erode the language and culture barriers between practitioners and non-practitioners.
One way of doing this that I would personally advocate for is to choose a small number of "atomic" system components
and, from those, demonstrate how larger systems are built. This building-block approach is not usually the one taken by
formal software training programs, which assume that students intend to become practitioners and spend a long time
on conceptual foundations.

This post is an invitation to collaboration on this effort. Various posts already on this blog would be useful in the syllabus
of such a program, and I intend to keep this framing in mind as I write more. If you have a related effort that you think I could help
with, I'd love to hear about it. If you have an idea for a service that you would like to make and use, and you think that
this type of program would help you, please let me know.

[^1]: In practice, teams are often self-managed instead of having a single "manager." In this pattern. the team uses a 
      regular (weekly, biweekly) planning meeting to collaboratively set goals and assign tasks. In this structure, the
      role of the manager is embodied by the entire team while it is making managerial decisions--so the AC for each task are set
      collaboratively in the planning meeting by the whole team. Each task is given clear AC _before_ a team member volunteers
      to take it on. Once a team member has taken responsibility for a task, its acceptance criteria are understood to be
      final. Because these teams are generally small (3-5 people is common) whenever things go badly wrong during the course
      of work (e.g. the AC prove totally wrong, the task turns out to be bigger than expected, someone needs to take personal time unexpectedly)
      the group uses an ad-hoc, informal process to decide how to proceed.

[^2]: That is, the public hears consumer advocates represented by broad categorical demands like "stop user tracking," the interpretation
      of which is left up to regulators, practitioners, and corporate interests. The inevitable ad-hoc patchwork of incentives, regulations
      and practices includes obviously contradictory elements, which are then used by corporate interests to argue that regulation
      is incompatible with useful progress.
