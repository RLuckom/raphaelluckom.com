---
title: "On Security 003: Optimistic-Collaborative Security Controls"
author: "Raphael Luckom"
date: 2021-03-11T17:45:00
draft: false
meta:
  trail:
    - practitioner-journey
    - security
---
Today I want to talk about something I'm going to call _optimistic-collaborative (OC) security_[^1], which I define as any time when an entity
does something intended to make an interaction more secure, _assuming that some other entity also behaves in an expected way_. For example,
let's contrast two hypothetical hotel security controls. An _optimistic collaborative_ control would be for the hotel to put a mechanical lock,
with a regular metal key, on the door(s) to each room. In this model, the hotel is providing one piece of a security control (a lockable door and
its key) with the expectation that the guest will use that security control in their self-interest. In the second hypothetical security control,
the hotel issues each guest a key card that is required to open an electronic door lock on the door(s) of the room. The electronic lock engages
every time the door is closed. This second control doesn't include the optimistic assumption that the guest will remember to lock the door;
the hotel, as a single entity, both _installs the lock_ and _assumes responsibility for its use_. I may describe this as "pessimistic security"
to emphasize contrast in this post, but we usually think of that kind of pessimism as the default, so it's just called "security." Web application
security relies heavily on OC controls. To see how, let's look at how website access control systems work[^2].

We can think of web servers and web browsers as programs that communicate by spitting tiny text files at each other[^3]. Every message consists
of a _start line_, an optional set of _headers_, a _blank line_ (to signal the end of the header section) and an optional _body_ containing additional
information. A message can either be a _request_ or a _response_ to a previous request. Both follow the same structure. A basic request might
look like this:

```
GET /index.html HTTP/1.0
Accept: text/html
```

This is a request that would be sent from a browser to a server. The browser is trying to _get_ the `/index.html` page from the server. There is
a single header line (the `Accept` header) that says what type of data the browser expects to receive. There's no body in this request. Notice
that the request _doesn't_ necessarily include a full URL--we can't tell if the request is being sent to google or raphaelluckom.com
or somewhere else. In practice this is usually ok because the server that receives the message is _at_ the requested location, so it doesn't need to be told
where that is[^4]. The server might respond with a message like this:

```
HTTP/1.0 200 OK
Content-Type: text/html

<html>
Hello world
</html>
```

This response message is the answer to the previous request. Because this is a response, the first line is describing the _result_ of the request
using a status code (`200`) and a message (`OK`). The next line is a _header_ stating that the content-type of the response--the format of the response
body--is text, and that the text is an HTML document. After the blank line, the _body_ of the response consists of the document itself.

This communication pattern is similar to the pneumatic tube system in a bank's drive-through teller window. The browser sticks the request in the canister,
puts it in the cubby, closes the door, and--_shunk_--it shows up at the teller's desk. The teller opens it up, reads the message, writes out a reply,
and sends it back to the person waiting in the car. For the purposes of thos discussion, we're going to leave out the details of what happens in between.
Specifically, we're not going to worry about _how_ the request gets sent to its destination or what prevents people from snooping on it in transit[^5].

So now let's imagine that instead of getting a public HTML document, you want to request an access-controlled resource, like your facebook profile. For
the purpose of this conversation, we'll pretend that your password is `secretpassword123`, and that facebook's security system requires that you send
that password on every request (in practice it's more complicated than that, but there really is a password-like thing called a "token" that your browser sends
along with each request. We're going to use the password itself to make the examples more readable). Let's look a few different ways that the password
could be included in web requests.

We could add the password to the path on the first line:
 
```
GET /index.html?password=secretpassword123 HTTP/1.0
Accept: text/html
```

We could stick it in a header:
 
```
GET /index.html HTTP/1.0
Accept: text/html
Authentication: Basic secretpassword123
```

We could stick it in a _different_ header:
 
```
GET /index.html HTTP/1.0
Accept: text/html
Cookie: password=secretpassword123
```

Or we could put it in the body:
 
```
POST /index.html HTTP/1.0
Accept: text/html
Content-Type: text/plain

secretpassword123
```

So which of these is "most secure?" Within the context of the HTTP message, they're all the same. Looking at this from the perspective of the banking drive-through
window, the only thing that changes between examples is  _where_ the password is written down on the slip you send to the teller. Since we are assuming that the 
message is going to get to the right person, and no one is going to be able to snoop on it in transit, how could that detail possibly matter? The answer involves
optimistic-collaborative security. It _is_ true that, once the request is in transit, all of these ways of including the password are equally secure. But when we
widen the view to include more than just what happens when the message is in transit, the situation changes. 

Let's extend the drive-through experiment a little. Let's pretend that for some reason you're driving around with a jerk in the passenger seat. You know that this
annoying cabbage is going to try to read your password as you write it down on the bank slip. If they succeed, they'll be able to make withdrawals pretending
to be you. That would be bad. And let's imagine that for some reason, the manufacturer of your car takes this problem personally and wants to help you solve it.
They invent a special system on the outside of the car. When you pull up to the bank drive through, a little robotic arm unfolds from the outside of the car door,
gets the pneumatic cylinder, extracts the withdrawal slip, and feeds it into the car. You write down everything _except_ your password, then give it back to the
robot arm. The robot arm takes the slip _and_ the cylinder into an enclosed compartment, then _it_ writes your password in a predetermined location on the slip,
puts it in the cylinder, and sends it back through the tube to the bank teller. As long as the bank teller knows that they should look for your password _in the place
where this new system is going to put it_, the new system is more secure than writting down your password while being spied on by your passenger. This is 
optimistic-collaborative security. You, and the bank, and the carmaker, all recognize the same problem and decide to tackle it to the best of your ability, but
none of you can solve it on your own. The carmaker supplies the password-writing device; the bank agrees to standardize the password-location so that the
password-writing device can be used, and you use that device when you go through the drive-through. If someone doesn't have the new security device, they 
can still write their password on the slip manually (in the same place) and the teller will get it.

So now let's go back to the examples of the HTTP messages. Which is most secure? As HTTP messages, none are more or less secure than any of the others. But one
of them is able to make use of a security feature that's _built into browsers_ and protects users in the same way as the "robot arm" example above. It's this
one:

```
GET /index.html HTTP/1.0
Accept: text/html
Cookie: password=secretpassword123
```

This request presents the password in a `Cookie` header. "Cookies" are pieces of information that your browser adds to requests right before they are sent,
just like the robot arm in the example wrote down the password right before putting the withdrawal slip in the tube. So in a "real world" sense, this is likely
the most secure way to attach the secret to the message[^6].

Notice that this distinction relies on optimistic assumptions of collaboration between unrelated entities--at least the website author and the browser maker
(also the user, if you include their choice to use a mainstream browser). What makes this collaboration possible is the existence of _web standards_ that describe
both "how browsers are supposed to store cookies" and "how website authors are supposed to set and use cookies." This specific standard is [RFC 6265](https://tools.ietf.org/html/rfc6265),
a document titled "HTTP State Management Mechanism." And the title is important; it shows how central OC security is in the internet. It's not called
"Cookies: How Browsers Store Them And How Websites Can Use Them." It's describing an extension of HTTP that could be used by any kind of server and
any kind of client. It sets out a pattern that, if you're a browser maker, describes a way to make people who use your browser more secure, and if you're
a website author, describes a way to make people who use your website more secure, _as long as the other people in the interaction behave how they're supposed to_.

When I was starting out writing software, this would have floored me. Not the design itself, exactly, but what it implies about security in a network.
What it shows you is that the highest levels of internet security, the actual mechanisms that banks use to protect sessions, etc., include _trust_
as a fundamental component. The bank makes its website according to a certain standard, and trusts the user's browser to also implement the same standard.
There's no guarantee of any of that--you won't find a warranty for Chrome, Safari, Firefox, or any other browser no matter how hard you look, nor will
you find a warranty for the use of any website I can think of--but nevertheless, the trust is central to the process and, more amazingly, _it works_. Those
systems mostly don't go wrong. I would never have guessed that when I started out. I basically thought that the entire internet was a battle royale of everyone
for themselves, where you always needed to defend yourself against every conceivable threat and Trust No One was the law of the land. But that's an actively
_counterproductive_ way to think about it. If you trust no one, you find that almost no interesting interactions are possible. And when you look around at
successful products--things like banks and facebook that seem like they have invincible mirror-sunglass-wearing security wonks on staff, you imagine that
they're doing something that you can't. But what they're actually doing, at maximum, is reading the standards, doing their best, and covering their asses
legally while they trust everyone _else_ in the situation--you and the browser maker--to also do _their_ best. One of the difficulties that comes up when I have
conversations about the negative effects of big platforms like facebook is the presumption that they're uniquely able to run services securely. But in my experience,
people _vastly_ overestimate the role that special, mirror-sunglasses-level knowledge plays in these systems compared to the role played by _reading all the way
to the end of the instructions_ and _inviting external review_.

In future security posts, I'm going to explore some other places where we can use optimistic-collaborative security design. When I do, I expect that some people will
be uncomfortable with the idea of designing, and relying on, things that only work if other people do what they are supposed to. This post is meant as a vaccine
against the type of thinking that dismisses OC-security controls in every situation. In many cases they're the best we can do, and in some areas they demonstrably work
quite well.

[^1]: I've spent some time this morning looking for developments of this idea, but haven't found any that I like. I suspect
      that this is because I don't know where to look or what it's usually called. If you know a common name for what I'm describing,
      please let me know.

[^2]: [This](https://auth0.com/blog/secure-browser-storage-the-facts/) post from Auth0 offers a more detailed technical discussion of the specific
      security controls I'm going to be discussing here. For the rest of this post, I'm going to gloss over some of the more confusing technical
      details unless they're immediately relevant.

[^3]: [This](https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages) MDN article does a pretty good job of explaining the structure of these
      requests. Media data, like sounds, videos, and images, usually consist of binary data called "blobs." These blobs are represented as
      text (or basically-text) when they're being sent between a server and a client. The newer version of HTTP, HTTP/2, introduces some techniques
      for compressing requests as binary (instead of text) and breaking up requests to avoid sending redundant information. None of that is critical
      to this conversation; it doesn't change the structure of the messages as they're constructed by the sender or seen by the receiver.

[^4]: The reason that I say this explicitly is to prevent a misunderstanding that bit me for a long time as a practitioner. I thought that when I saw
      a HTTP message formatted in this way, with the first line, headers, blank line, and body, that that was a _textual convention_ for displaying
      the message in a text document meant for humans. In actuality, it is _exactly what is sent_ (at least in HTTP/1.0). Exactly that text, with
      exactly those line breaks, capitalization pattern, spaces, everything. Part of the reason that I misunderstood that for so long is because of 
      the data that seems to be "missing" from the request, like the host name.

[^5]: These things are called [routing](https://en.wikipedia.org/wiki/IP_routing) and [Transport-Layer Security (TLS)](https://en.wikipedia.org/wiki/Transport_Layer_Security)
      respectively. They're important but they don't really affect what I want to talk about here.

[^6]: (_well actually_) Assuming that the server sets the cookie as `httpOnly` and that javascript on the page doesn't need access to it. The link in
      footnote 1 is a detailed discussion of these points.
