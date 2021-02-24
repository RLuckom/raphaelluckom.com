---
title: "On Testing 000"
author: "Raphael Luckom"
date: 2021-02-24T08:25:34
draft: false
meta:
  trail:
    - practitioner-journey
    - practitioner-inn
    - testing
---
I'm in the middle of testing the functions that will control access to private areas
of this social media system, so it's a good time to talk about testing. Just as with
the topic of [security](https://raphaelluckom.com/trails/security.html), there is a deep
well of traditional knowledge within software writing communities about testing. And just like
with security, I want to start from first principles, thinking about what the _purpose_ of testing is,
and working from there to a design that suits my needs, values, and intentions.

So what is testing for? Here are a few testing goals I've seen:

1. Make sure that a program does a thing
2. Make sure that a program _doesn't_ do a thing (sometimes under adversarial conditions)
3. Make sure that a system performs adequately under a given load
4. Make it easier to disassemble, reassemble, and reconfigure code without breaking things
5. Explain what a program does
6. Provide examples of using a program
7. Signal to other software writers that code is high-quality

I would separate these goals into two groups: _functional_ goals and _social_ goals. The
first three are the functional goals; making sure that the program does all the things it should,
none of the things it shouldn't, and can operate adequately in its expected deployed environment.
The other four goals are about how humans perceive and interact with the code. Let's also take a moment
to recognize that there are many different ways to achieve both categories of goals--a test can
be a manual process, a piece of code, or something else. For the rest of this post, we'll be looking
at tests implemented in code, but there are times when it's appropriate to rely on other kinds[^1].

So let's look at an example of a test inplemented in code. The following snippet shows a function and its test:

```javascript
// This is a javascript function that adds one to its argument.
function addOne(number) {
  return number + 1
}

// This is a test that validates that the `addOne` function works 
// correctly, at least for the number 7:
function testAddOne() {
  const answer = addOne(7)
  if (answer === 8) {
    console.log('woohoo, the system works!')
  } else {
    console.log('uh-oh.')
  }
}

testAddOne()
// output: woohoo, the system works!
```

This example shows us a few things:

__Tests In Code Are Additional Code__: What we call "tests" could also be described as "programs that run other programs in
predetermined ways and validate their output." There is no fundamental difference between the type of code that programs
are made from and the type of code that tests are made from; it's all the same stuff. Among other things, this means that
tests, like programs, can have bugs. Bugs in test code can cause false positives (the test fails erroneously; we think something is broken when it isn't),
false negatives (the test passes erroneously; we think something is working when it isn't) and instability (we want to run the tests,
but they fail to run properly and give a result). So when we talk about code being "tested," what we mean is "we tried our best
to write the code; then we tried our best to write more code that exercises the first code, and we eventually became confident
that there weren't any bugs hiding in any of the code." There are different ways of achieving that confidence, some of which
use special tools. Those tools are also made of code.

__Tests Are Often Longer Than Code They Test__: It's true in this small example, and it also happens to be true of lots of
real-world systems. This is because we usually want to understand the code's behavior under a wide variety of circumstances,
and setting up those circumstances, and validating the output, often takes more complexity than writing the code in the first place.
This can also be true of the time it takes to write tests: it can take longer to write the tests than the original code.

__Tests Include Assumptions__: The test in the example above is not very good. For instance, it would pass even if the `addOne`
function was written to _always_ return exactly `8`. That means that this test is assuming that the example _test case_ of "call `addOne`
with an argument of `7`" is sufficiently representative of every argument this function might get, in every circumstance. If we
wanted to do a better job, we might consider numbers with special properties that make them behave differently from other numbers:
we might try `0`, a negative number, and the symbol for infinity[^2]. These "inputs with special properties" are called _edge cases_. 
We also might want to see what happens when we pass in something that _isn't_ a number. There are times when you want a function to
fail loudly and unmissably; if your function to save a file fails, you need to let the person using the program know so that they
can avoid losing their work. Other times it's ok for a function to fail quietly; if your function is trying to delete a file, and it
finds that the file has already been deleted, it should probably just move on to the next thing. We encode these types of decisions
into tests, so that we won't break the desired behavior by mistake.

__Tests Are Examples__: In order to write the test for the `addOne` function, we needed to _use_ the `addOne` function. If someone
else wanted to see an example of using it, they could look at this test.

__Code Structure And Test Structure Affect Each Other__: It's easiest to write tests when the code is organized into sections with
natural boundaries. If we know that we're going to be writing tests, we can deliberately structure the code in a way that makes
the tests easier to write. On the other hand, if we the sections of code that we test are too small, our tests may miss bugs that
only become apparent when the pieces are combined. Our testing priorities will tend to draw us toward certain code structures and vice-versa.

Testing, like security, can be an intimidating part of practicing software writing. Both areas require a foundation of _values_ to orient
them. In the case of security, the values are assumptions about what to protect, from who and what. In the case of testing, the values
are assumptions about what kind of confidence we want about a program. Most of the tribal knowledge within software-writing communities, about
both areas, is biased towards the kinds of foundational assumptions that enable and support commercial software production. In this series, we're
going to resist reflexive obedience to those norms, and instead think critically about which foundational values are appropriate in our context.

[^1]: The type of confidence that we want in a system, like the [values the security design should protect](https://raphaelluckom.com/posts/on_security_001.html),
      is a choice that we should get used to making consciously based on context. As with security, there are lots of ways for a
      test strategy to focus on what we would think of as "the wrong thing," or to have other unintended effects on the system as a whole.
      When we start out by deciding what goals we want our tests to support, and _then_ design a test strategy to support them, we will
      have a better chance of achieving those goals than if we always use a single test strategy based on tradition or tribal affiliation.

[^2]: Most programming languages include a special symbol for "infinity." It's often treated as a special value that behaves like
      a number in many situations.
