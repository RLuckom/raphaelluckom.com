---
title: "Design Outline 002: Visibility System Details"
author: "Raphael Luckom"
date: 2021-04-28T10:36:44
draft: false
meta:
  trail:
    - implemetation-note
---
In this post, we're going to take a closer look at the _visibility system_. The visibility
system is the part of a web application that stores _operational data_--things like request
logs, function logs, and metrics.

So what do we want from a system like this? There is one fairly obvious thing: we probably want
page view statistics. We also want to know about any errors that occur. If we make improvements
to our metrics later, or if we get curious later about something we haven't been measuring, we'd like
to be able to add those metrics or satisfy that curiosity based on the data we already have.
And there are some other things we _don't_ want from this system. We don't want it to require
maintenance. We don't want--and I mean this more seriously than it might seem--we don't want 
any **stuff** collecting in the account over time that might require cleaning out. We are humans;
humans make mistakes with predictable frequency. If we get used to manually deleting things,
sooner or later we're going to delete the wrong thing by mistake[^1]. Or we might avoid deleting
things altogether, and they'd just sit there, costing money and making the evemntual cleanup 
more perilous.

The good news is that we're really only talking about text files. A line from a request log looks like this
(you're going to have to scroll sideways; this is unfortunately the nature of _row oriented_ file formats[^2]--the rows are
always too long):

```
2021-04-26 13:10:07 JFK51-C1 269 73.60.145.199 GET d2f3w7wija7w5j.cloudfront.net /posts/mid_april_check_in.html 304 https://raphaelluckom.com/ Mozilla/5.0%20(X11;%20Ubuntu;%20Linux%20x86_64;%20rv:87.0)%20Gecko/20100101%20Firefox/87.0 - - Miss yq_sHUDgnFpCnEV-VBiU_Oysd8JP2PZpUAa5Damooy1W1IUsHMsEOw== raphaelluckom.com https 302 0.068 - TLSv1.3 TLS_AES_128_GCM_SHA256 Miss HTTP/2.0 - - 41314 0.068 Miss - - - -
```

If you have a site with a moderate amount of traffic, you might have several thousand lines like this[^3]
every day (I get around 10-20 plausibly-human pageviews a day, so less is also likely). I'm not going
to go into the structure here; it's somewhat arbitrary. The point is, _this is what log data looks like_.
It's text, but there might be a lot of it.

So those things we wanted earlier: page views, errors, questions we think of later, lack-of-maintenance,
etc.--all of them boil down to managing text files[^4]. And it turns out that we can _define_, really quite
concretely, exactly what we want that file management to look like:

1. The logs should go there automatically
2. They should be conveniently available when we want to use them to answer questions
3. After a certain period of time, they should get deleted

#### Where do logs come from?
When an http request arrives at a server, _one_ of the things the server does is to write down a record
of the request in a log. In this system, we are not renting entire servers; instead, we're using a
[_content delivery network_](https://en.wikipedia.org/wiki/Content_delivery_network) (AWS Cloudfront) to serve web
pages. Since we're not operating the servers, we can't go get the logs ourselves; instead, we provide a place
for the CDN to drop the logs off as they're generated. We do this by creating an S3 bucket for the purpose 
and giving the Cloudfront service permission to put things there. This bucket is where the request logs
enter the visibility system.

#### What happens to logs when they arrive?
When Cloudfront delivers a request log to the input bucket, an [`archiver` function](https://github.com/RLuckom/terraform_modules/blob/main/aws/visibility/aurochs/src/configs/s3_to_athena.js)
picks it up and moves it into the main visibility bucket[^5], under a path structure that makes the logs
easy to sort by time. Next, the archiver adds that file path to an index in [AWS Athena](https://athena.guide/articles/athena-basics-what-is-athena/).
Athena is a pay-as-you-go service that allows you to search a collection of logs _stored in S3_ using database queries. Using
it lets me avoid writing log-parsing and querying code myself[^6].

#### How do we search the logs?
From a practitioner's perspective, we search the logs by running database queries on Athena. From a non-practitioner's
perspective, we make web requests to an on-demand search service and it responds with the data we asked for.

#### How do the logs expire?
S3 buckets let you set _retention policies_. Using these policies, you can say something like, "I want every
object stored under the path `/logs/cloudfront/` to be deleted after one year." Each log storage path in the visibility
bucket has a retention policy specifying when it should be deleted.

-----

The answers to the four questions above describe the _values-driven_ aspects of the visibility system. They establish
how this system meets the goals we have for it. They also show us where we can be flexible about _how_ we achieve those
goals; just because _I'm_ using AWS services doesn't mean that those services are required--_any_ way of doing log
storage and analysis that meets those operational goals and maintains privacy would be fine. As I've said before, my
specific choices are based on my experience, preferences, and my goal for easy distribution at planet scale. In the next
few paragraphs I'm going to describe how the visibility system design fits with the other components of a
personal social media service; please note that these details are ones that are _convenient for my use case_,
not things that I think are required in general.

----

The personal social media service I'm prototyping consists of a few different parts. The visibility system
is one of those parts, and since it needs to collect information about all of the other parts, there needs to be
a way for it to "tell" those other parts of the system things, like where they should send their logs and where
they should direct their queries. When we consider the log lifecycle described above, we can see that there are
several different pieces of data related to request logs that need to be shared between the visibility system
and the other systems:

1. What S3 bucket and path does cloudfront use to drop off the logs? The visibility system needs to know this
   to collect the logs; the blog system needs to know this to drop them off.
2. What database and table include the request logs?
3. Where should the results of database queries be stored?

It's very useful to identify these pieces of _shared_ information and manage them carefully in the overall system.
Ideally, we want a _single source of record_--we want these pieces of information to be defined in _one_ place
and then shared with _all_ the consumers. We do not want the visibility system and the relying systems to be making
their own assumptions about what the shared information will be[^7]. In my exploration, I've found it convenient to use
the visibility system as the _source of record_ for originating those pieces of shared information. This decision makes
the visibility system the root of the rest of the infrastructure. One of the configuration inputs to the visibility system
is a [data structure](https://github.com/RLuckom/raphaelluckom.com/blob/main/terraform/variables.tf#L55) that describes the state of all of the infrastructure:

```
{
  prod = {
    subsystems = {
      prod = {
        serverless_site_configs = {
          raphaelluckom_com = {
            route53_zone_name = "raphaelluckom.com."
            domain_parts = {
              top_level_domain = "com"
              controlled_domain_part = "raphaelluckom"
            }
          }
        }
      }
      human = {
        serverless_site_configs = {}
      }
    }
  }
  test = {
    subsystems = {
      admin = {
        serverless_site_configs = {
          test_admin = {
            route53_zone_name = "raphaelluckom.com."
            domain_parts = {
              top_level_domain = "com"
              controlled_domain_part = "admin.raphaelluckom"
            }
          }
        }
      }
      test = {
        serverless_site_configs = {
          test = {
            route53_zone_name = "raphaelluckom.com."
            domain_parts = {
              top_level_domain = "com"
              controlled_domain_part = "test.raphaelluckom"
            }
          }
        }
      }
    }
  }
}
```

At the top level, this specifies an arbitrary number of _security scopes_ (In this case, `prod` and `test`).
The security scopes are groupings of log data for permission purposes--a user can be granted access to the logs
from a security scope as a whole.

Within each security scope is an arbitrary number of subsystems. Each subsystem is automatically assigned a path
to send its lambda logs, and may additionally specify a number of _serverless sites_--cloudfront-hosted websites whose
logs are to be managed by the visibility system. 

This is the most basic definition of the entire personal social media service--a simple grouping of systems and subsystems
based on their security and informational characteristics. The visibility system takes this definition and uses it as the basis
for the pieces of shared information I mentioned before--log locations, database names, etc. In turn, these pieces of shared
information are [exported](https://github.com/RLuckom/terraform_modules/blob/main/aws/visibility/aurochs/variables.tf#L487)
from the definition of the visibility system so that they can be used by the other client systems.

----

I tried to cover two views of the visibility system in this post: _how it behaves_ and _its place in the overall structure_.
I'm not sure if I've done a good job; this feels right at the edge of requiring a conversation or demonstration to convey.
But I think there's enough here for a non-practitioner to get the gist, and there's enough for a practitioner to start pulling
on the right threads, and for now I think that's the best I can do.

[^1]: S3 had a ~3-hour service disruption in 2019 caused by [incorrectly entering a command manually](https://aws.amazon.com/message/41926/);
      reducing the number of manual steps isn't just a non-practitioner thing. In addition to the
      potential for errors, manual steps increase the surface area for social engineering attacks,
      since they set a precedent for doing tasks from instructions without understanding them.

[^2]: Files in which each line represents a record, like CSV files or logs.

[^3]: This line has been modified from one of my own visits to my site. You should _not_ publicly
      share the contents of your server logs; that's information about the people who visit your site.
      We should respect others' privacy and expect ours to be respected. This also means that it would be best not
      to employ third-party tools (such as, unfortunately, google analytics) that may use our visitors'
      data in objectionable ways. This follows the strong precedent in human society that hospitality requires
      a host to protect their guests from harm.

[^4]: My current-favorite metaphor for a good visibility system is the [dhunge-dara](https://en.wikipedia.org/wiki/Dhunge_dhara),
      a type of water fountain built in Nepal. These fountains were built so that water would flow
      through them from underground sources; they have cisterns, or drains that send the water to other fountains
      or to agricultural land. In this system, the water is constantly moving--there is always something
      coming from up ahead and disappearing downstream. But despite this, there is always water exactly _at_
      the fountain for anyone who wants to collect it. That's the dynamic I want to see from a visibility
      system. I want the data to flow in at one end and out at the other all the time, without me doing anything.
      And I _also_ want to be able to dip into that flow whenever I have a reason to, and to have a relatively
      convenient and pleasing way to do that.

      Another advantage of this view of the system is that it allows us to make estimates about the total resources
      that the system will use over time. If we specify a retention period in days, then we know that the system
      will require enough storage for that number of days' worth of logs. We could also write a program to manage
      the logs dynamically; say, if we suddenly found that we were generating too many logs, we could write a program
      to adjust the retention period to match the total amount of log data we wanted to store.

[^5]: Two reasons: first, if something goes wrong with the cloudfront agent and it writes to an incorrect place, I don't
      want it overwriting anything I care about. Second, the agent requires fairly broad permissions that I'd rather not
      allow on the storage system.

[^6]: My very first computer-related job was writing scripts to parse and manage logs. It's an excellent challenge for
      a new practitioner to take on, because the things that make it difficult come equally from human and technical
      factors.

[^7]: that is, we don't want the visibility system to define the log drop off path _and_ the blog system to define
      the log drop off path, _even if they do it the same way_. In that situation, there is a big risk that those
      systems will drift into incompatibility over time.
