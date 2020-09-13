---
title: "Anatomy of a Web App"
author: "Raphael Luckom"
date: 2020-09-13
draft: false
---

In this post I'm going to describe, in non-technical terms, the basic structure of a web service
like Facebook. Last week I wrote a post about [how to get started in programming](https://www.raphaelluckom.com/posts/foundations.html),
and before that I wrote about some [trends in system design](https://www.raphaelluckom.com/posts/hardware.html). I intend
that anyone who follows along with these posts will come away with
enough understanding of computer systems to be conscious of the social, economic,
and political issues they raise. But before we can talk about the social, economic,
and political dimensions, we need to define some terms, and in this post we're
going to look at _web service_ and _web app_.

I'm adopting a broad definition of _web service_ here: a web service is any system where
information has to travel between two or more computers for the system
to function. I'm going to focus on web _apps_, which are a very common
type of web service that provide a UI on a website as the main venue for
interacting with the service. Web apps are usually understood to be interactive--
a site like this one in September 2020, that does not provide any way
for readers to interact with what's here, would be a _web service_ under
my definition but it wouldn't be a _web app_. By my definition any site where
you can log in is automatically a _web app_. This includes highly interactive
systems like Facebook as well as less interactive systems like Craigslist
and Wikipedia.

Throughout this post, I'll use a fictional "To-Do" app as an example. This
type of app helps you keep track of your task list. You go to a website
or phone app where you have an account, and you're able to add, edit, and
check off items from your personal to-do list. For the purposes of this
discussion, I'm also going to say that the app stores your data--that is, even
if you close the browser window you started out in, you can open a new one,
log back in, and your list will still be there. If you google "todo app," you'll
find many apps that fit this description; I'm not going to link any because
the specifics don't really matter. I'm going to cover the parts of the app in
a sort of barebones way--these are the things that make the app an app; whether
it's a _good_ app is a different post.

An app like this can be divided into six areas: access control, User Interface (UI), API logic,
application data, logging, and analytics. The access control part is the user
management system--who can login, and what permission they have to see and interact with data. The UI is
all of the code and markup that tells your browser what to display (this
includes assistive technologies--the way your website interacts with a screen reader
for someone with a visual impairment is equally part of "UI"). The API logic
is the code on the server that handles interactions like "add a task" or "mark
this task complete." The application data is the actual data storage system
used to save your todo items--probably a database, but other types of storage, like
regular text files on a hard drive, _could_ also do the same job. The logging
consists of the records that the system keeps about what it does;
logs are usually written to a text file full of lines like 

```
2020/09/13 03:30:50.789 [INFO] User testUser added Todo item with ID=a4th983e
```
The analytics system consists of the tools used by whoever is running the app
to interpret the logs written by the system and answer questions like "when
is the highest traffic period" or "what features do the people who use this
app like most?" or "where do people who use this app encounter errors?"

### Access Control
Access control includes _Authentication_, _Authorization_, and _Audit_. _Authentication_ (Authn)
is the way that the system verifies that you are who you say you are--a username
and password, a code sent to your phone, etc. _Authorization_ (Authz) is the way
the system decides what you're allowed to do. For instance, if you're logged in to
Instagram, you are _authenticated_ (Instagram trusts that you are the owner of your account)
but unless you have 10k followers you are not _authorized_ to include links
in your stories--only users with more than 10k followers are allowed to do that.
Audit (the ability to go back and look up who did what in the system) is also
included in access control, but for the purposes of this discussion it's included
later as a specialized form of logging.

### UI
The UI includes both _markup_ and _code_. _Markup_ is text that includes
hints about how it should be displayed--the text is "marked up" with
formatting data. If you imagine an old-timey newspaper editor walking over to the
typesetter's desk with a pile of handwritten articles, the articles would
have the actual text, but they would also have notes for the typesetter like
"this goes on the front page" or "this headline needs to be really big" or "this
ad should be business-card sized." That whole thing--the text and the formatting
information--is the markup. On the internet, [HyperText Markup Language](https://html.spec.whatwg.org/multipage/) (HTML) is 
the dominant markup format, and it is augmented by [Cascading Style Sheets](https://www.w3.org/Style/CSS/) (CSS),
which carries additional formatting information.

Markup all by itself is sufficient for every book that's ever been printed,
but if you want significant interactivity, you need _code_. _Code_ consists
of instructions that specify the behavior of the page after it has been displayed.
It does things like submit data when you want to post something, or display the
next page of search results when you click an arrow, etc. The most important thing
to understand about UI code is that it runs on the computer that is _showing_ the 
content. When we talk about web apps, the computer that requests the page and displays
it to a person is called the _client_. The computer that sends the information is called
the _server_. UI code runs on the client. When Google's servers send your computer the text
of the Google homepage, they _also_ send a bundle of computer code. Your web browser, on
your computer, runs that code, which controls how Google's site looks. Almost
all UI code that runs in the browser is written in the JavaScript language.

### API Logic
The code that runs on a web app's UI needs to be able to talk to a server
to do its job. The Application Programming Interface (API) is the code
that runs on the server, listens for requests, and answers them. The
most basic and generic part of this system is the _web server_--the part that sends the client
a web page: the bundle of markup and code that makes up the UI. Since this
bundle is usually the same for all users (everyone's Facebook UI has the
same structure, even though they see different content) there is sometimes a Content
Delivery Network (CDN) that tries to speed up delivery of these standard parts.

Unlike the main markup-and-code bundle, any user-specific content (like
the items in your feed or your profile information) is served by an _application
server_. Rather than send whole web pages, the application server listens for
requests like "mark this task as done" or "show me my outstanding tasks." To answer
these questions, the application server will read the request, check that the requester
is allowed to perform the action (this is the Authn and Authz system), and then it
might get data out of the data store (e.g. the list of todo items) or it might 
modify the data (e.g. to mark a task as complete). Often when a programmer says that
they work on "back-end" code, this is what they mean (the "front-end" means the UI).

### Application Data
The data that the application uses to do its job is what I define as _application data_.
In the todo app, this would include information about users, the information about
individual items in people's task lists, etc. It would _not_ include things like audit
logs and server logs--those are data _about_ the application, but not used _by_ the application.

Data storage is a very deep subject, but it all boils down to what you want to store
and how you plan to use it. Some types of databases are very fast at responding to
requests to read data, but much slower at processing requests to add or modify data.
Others are very good at handling large files like images or videos, but not as good
at manipulating that data in complex ways. Different data storage systems also make 
different tradeoffs when things go wrong--some databases are designed to return errors
unless several conditions can _all_ be satisfied, while others are designed to tolerate
certain types of failures. For instance, when a financial database needs to move money
between two accounts, it is designed so that if _either_ the withdrawal from the source _or_
the deposit to the destination fails, the whole transaction gets reversed. However, a database
that tells you how many "likes" a facebook post has might give you the most recent data
that it can find, even if it's unable to verify that it's _exactly_ up to date.

A single application might use more than one data store if it has to support different
data access patterns.

### Logging
Logging refers to the records that an application saves about what it does. At various
points within front-end and back-end code, the programmer writes instructions for the
program to output information. What this information looks like is up to the programmer
and varies based on the situation. An access control system's audit log is a highly structured
document, making it possible for an analytics program to quickly determine things like
when a specific login or logout happened. An application server's log might be much less
structured; each line might be a descriptive statement about something that the programmer
thought would be useful to know, like `TestUser signed in` or `wtf foo=true?!?!` or, in
certain exceptional cases `1. raph, remember to remove this log before merging`.

Technically, most logging is actually part of one of the other subsystems--the UI code writes some logs,
the API code writes others, the access control system writes still others. But the logs
as a body of information are so crucial to understanding how and if the system is working
that they deserve to be treated separately. 

Logs are also incredibly powerful tools for learning about people. Logs can tell
system operators what pages people visited, how log they stayed, and sometimes
what they were looking at. This makes log data the most important subject to consider
when thinking about the privacy of people who use a system.

### Analytics
The analytics system is what tries to use the logs and other data generated
_about_ the application to give the operators insight about what the system is doing.
The analytics might warn about errors, display traffic graphs, or help business
intelligence people make strategic decisions about what to build. A simple low-traffic
app might not have any dedicated analytics at all; a system like Facebook would have much
more investment and complexity in its analytics than in what the people who use it would
describe as the "product."

### Conclusion
This is a pretty rough-and-ready description of the structure of an app as it would
be deployed. I've left out important disciplines like testing and (general) security,
which are not a specific part of the deployed application but which influence each
part in a different way. But I would argue that this is also, in important ways, a _complete_ definition--
anything that has all these parts working together is definitively An App. It might
be insecure, it might be full of bugs and crash all the time, it might not be
useful, but it would have all the necessary parts for me to consider it a web app.
And I find that it's often very useful to have a list like this when I'm trying to start
out designing something, so that I can make sure that I've at least thought through all of the
individual aspects of the thing, even if I haven't figured out all the details.
