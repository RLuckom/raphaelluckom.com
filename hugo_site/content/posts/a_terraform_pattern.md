---
title: "Terraform and Software Tectonics"
author: "Raphael Luckom"
date: 2020-09-18
draft: false
---

_This is going to be a more technical post about a way of organizing 
infrastructure with [Terraform](https://www.terraform.io/). If you've
been following along with my exploration of contemporary software systems,
this is going to be a little deeper in the weeds, but hopefully still
interesting. On the other end of the spectrum, if you're already a jaded 
professional or otherwise uninterested in how the sausage is made, feel 
free to skip down to the "Modest Proposal" section below_

### Storytime

Three of my five tech jobs have included using terraform to some degree.
However, all of them were also largely porting existing infrastructure,
not building new systems. This meant that terraform had to accomodate
existing configurations and use patterns. Additionally, the Terraform
[DSL](https://en.wikipedia.org/wiki/Domain-specific_language) has been
improving by leaps and bounds since its introduction. I'm currently
using terraform 13 (using [this](https://github.com/RLuckom/raphaelluckom.com/blob/master/docker/terraform/Dockerfile) docker image)
but I think that most of what I'm going to describe is true of 12+.

Conway's Law (read [the paper](https://www.melconway.com/Home/Committees_Paper.html) if you
have time, it's worth it) states that "Any organization that designs a system 
(defined broadly) will produce a design whose structure is a copy of the organization's communication structure."
Infrastructure is an especially interesting area to look at through this lens,
because it sits right on top of several of the traditional tectonic fault lines
between different groups you find in contemporary software organizations. A brief
digression here is useful to set the stage.

The first group whose desks you generally sidle over to if you want to get
in an argument about infrastructure is _Ops_. The role of this group
is ill-defined but its borders are fairly stable; it doesn't do "application
development" and it likely does not have final sign-off authority on matters
of security. Ops people (and for the purposes of this conversation, "devops"
people are ops people if their organization uses "devops" as a title)
are specialists in the building and maintenance of _infrastructure_. Infrastructure,
again, is kind of nebulous--for our purposes we will say that it
is the sum of the services provided by cloud vendors and any on-site
computing hardware. There's something a bit Stonehenge about the ops mentality,
in that most of the work feels like assembling and living among systems,
both human and mineral, that could easily crush you if they fell over.

The next group are the _application development_ teams. These are the teams
that build the services that customers of the business interact with. Application
dev teams are most visibly responsible for the company's product, so they
tend to stay focused on frontiers of the system--the newest features still in progress.
To an ops person this can sound like a pretty sweet gig, always being able to
work on blue-sky stuff, but anyone who's tried it knows that it turns out
more like Walter Benjamin's famous quote about the [angel of history](https://en.wikipedia.org/wiki/Angelus_Novus).
Application development teams, through organizational pressure or self-preservation,
often _also_ assume an ops-like responsibility for at least some of their infrastructure.
There are usually several application development teams in any moderately-sized
organization, often working in different areas.

Finally, we arrive at the _security_ team, because the security team is always the
last to be included. This is because they ask inconvenient questions, like
"are you sure you want to use social security numbers as public IDs." In one
sense, the security team is a lot like the chocks that keep a 787 from
rolling casually down the runway, except that the response to security concerns
is often "Look, you're a couple of blocks of rubber and we're a f\*cking
massive jet, get out of our way or we're going through you." The only
_reasonable_ job that an organization can give a security team is to guide
the security practices of the _rest of the organization_; nevertheless, many
security teams find themselves responsible for the actual security posture
of the product.

These three groups usually reach a fairly predictable [détente](https://en.wikipedia.org/wiki/D%C3%A9tente).
The _security_ team controls a strategic point on the path to deployment--
either their signoff is needed before anything can be released, and/or
they actually control some of the permissions for relevant systems. A fairly
common arrangement is for a highly-ranked security person to be an administrator
on the company's production cloud vendor accounts and control what permissions other people get.
The _application_ teams usually get full access to a less sensitive "test" or
"development" environment where they can try stuff out. This allows them to
demonstrate progress quickly without needing to include other teams every five
minutes. The _ops_ team is responsible for maintaining the test/dev environment
(in as much of a hands-off way as possible, so the application teams can get
their work done) and helping provide solutions and advance negotiations when the
application teams want to get the security team's sign-off to move something
into the production account. This is the "communications structure," in 
Conway's meaning, that often obtains in the world of system design. 

Terraform, as a tool for organizing (predominantly cloud-based) infrastructure,
sits right in the middle. Since it's clearly an _infrastructure_ tool, the ops team
usually "owns" terraform. But since infrastructure only exists to support the
application teams, those teams will at least dictate what is needed, and frequently
need freedom to experiment on their own (with and without terraform) with different
infrastructure patterns. Meanwhile, the security team still wants to keep an eye
on what happens in the production environment, so they will sometimes have their
own management systems for the IAM (Identity and Access Management) portions of the
organization's cloud accounts, which would otherwise fall under infrastructure
and therefore ops. These divisions introduce complexity into the way that terraform
code can be written and maintained.

### Modest Proposal

The terraform documentation on access control doesn't seem to have been updated
in a while. For instance, the [example](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_policy) for a bucket policy resource looks
bafflingly like this:

```
resource "aws_s3_bucket" "b" {
  bucket = "my_tf_test_bucket"
}

resource "aws_s3_bucket_policy" "b" {
  bucket = aws_s3_bucket.b.id

  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Id": "MYBUCKETPOLICY",
  "Statement": [
    {
      "Sid": "IPAllow",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": "arn:aws:s3:::my_tf_test_bucket/*",
      "Condition": {
         "IpAddress": {"aws:SourceIp": "8.8.8.8/32"}
      }
    }
  ]
}
POLICY
}
```
The first specific thing that's weird about this policy is that its `Resource`
block refers to the bucket defined on the first line, but hardcodes
the [`arn`](https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html).
In practice you would at least want to reference the actual bucket
(i.e. `"Resource": "${aws_s3_bucket.b.arn}/*"`) to guard against drift--if
the name of the bucket changes, you could apply this policy to successfully 
and yet still fail to DENY the actions you're trying to prevent.

The second thing that's outdated about this is that it uses the [_heredoc_](https://en.wikipedia.org/wiki/Here_document)
format to embed the policy JSON into the `aws_s3_bucket_policy` resource
definition. As the terraform docs themselves now state [elsewhere](https://learn.hashicorp.com/tutorials/terraform/aws-iam-policy#recommended-configuration-method-examples),
there is an `aws_policy_document` [data source](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document)
that gives much more fine-grained control over the policy semantics.


```
data "aws_iam_policy_document" "example" {
  statement {
    sid = "1"

    actions = [
      "s3:ListAllMyBuckets",
      "s3:GetBucketLocation",
    ]

    resources = [
      "arn:aws:s3:::*",
    ]
  }

  statement {
    actions = [
      "s3:ListBucket",
    ]

    resources = [
      "arn:aws:s3:::${var.s3_bucket_name}",
    ]

    condition {
      test     = "StringLike"
      variable = "s3:prefix"

      values = [
        "",
        "home/",
        "home/&{aws:username}/",
      ]
    }
  }

  statement {
    actions = [
      "s3:*",
    ]

    resources = [
      "arn:aws:s3:::${var.s3_bucket_name}/home/&{aws:username}",
      "arn:aws:s3:::${var.s3_bucket_name}/home/&{aws:username}/*",
    ]
  }
}

resource "aws_iam_policy" "example" {
  name   = "example_policy"
  path   = "/"
  policy = data.aws_iam_policy_document.example.json
}
```

This example copied from the official docs shows how the policy data source
accepts an arbitrary number of `statement` blocks, with all of the capabilities
outlined in the [AWS docs](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_statement.html).
This is what I mean when I say that terraform has been improving by leaps and bounds--
this is a far better solution than inline JSON. And if you're using terraform 12+,
you can automatically include any number of `statement` items by using the new-ish
dynamic block syntax:

```
# adding the other statement attributes is left as an exercise
# for the reader
variable "role_policy" {
  type = list(object({
    actions = list(string)
    resources = list(string)
  }))
  default = []
}

data "aws_iam_policy_document" "policy" {
  dynamic "statement" {
    for_each = var.role_policy
    content {
      actions   = statement.value.actions
      resources   = statement.value.resources
    }
  }
}
```

In turn, _this_ syntax means that you can construct (and pass around)
policy "statements" as simple objects within terraform, just by defining
objects of the type specified in the `role_policy` variable above. This is 
very useful when it comes to avoiding the type of errors latent in the bucket
policy resource I showed earlier. Now, you can build a module like the following:

```
variable "bucket_name" {
  type = string
}

resource "aws_s3_bucket" "bucket" {
  bucket = var.bucket_name
}

output "permission_sets" {
  value = {
    athena_query_execution = [{
      actions   =  [
        "s3:GetObject",
        "s3:ListMultipartUploadParts",
        "s3:PutObject",
        "s3:GetBucketLocation",
        "s3:GetBucketAcl",
        "s3:ListBucket"
      ]
      resources = [
        aws_s3_bucket.bucket.arn,
        "${aws_s3_bucket.bucket.arn}/*"
      ]
    }]
    move_objects_out = [{
      actions   =  [
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ]
      resources = [
        aws_s3_bucket.bucket.arn,
        "${aws_s3_bucket.bucket.arn}/*"
      ]
    }]
    put_object = [
        {
          actions   = ["s3:PutObject"]
          resources = ["${aws_s3_bucket.bucket.arn}/*"]
        }
      ]
    put_object_tagging = [
        {
          actions   = ["s3:PutObjectTagging"]
          resources = ["${aws_s3_bucket.bucket.arn}/*"]
        }
      ]
    get_bucket_acl = [
        {
          actions = ["s3:GetBucketAcl"]
          resources = [aws_s3_bucket.bucket.arn]
        }
      ]
  }
}
```

This tiny module takes a bucket, which is a typical stateful
resource to which you would want to control access, and, as part of its
outputs, it exports different named groups of permissions that represent the
least-privilege permissions necessary for performing different functions
relative to the resource. Since these are just lists of objects, it's
easy to use them in other places, such as a definition for a module 
that creates a lambda and assigns it appropriate permissions:

```
module "photos_lambda" {
  source = "./modules/permissioned_lambda"
  environment_var_map = local.photo_etl_env.ingest
  mem_mb = 384
  timeout_secs = 20
  lambda_details = {
    name = "rluckom_photos"
    bucket = aws_s3_bucket.lambda_bucket.id
    key = "rluckom.photos/lambda.zip"

    policy_statements = concat(
      module.media_table.permission_sets.put_item,
      local.permission_sets.rekognition_image_analysis,
      module.photos_athena_result_bucket.permission_sets.athena_query_execution,
      module.media_input_bucket.permission_sets.move_objects_out,
      module.media_input_bucket.permission_sets.put_object_tagging,
      module.photos_media_output_bucket.permission_sets.put_object,
    )
  }
}
```

If the module definitions for the stateful resources (buckets, databases, etc) 
are constructed carefully, there will be no way for policies constructed 
from statements like these to drift, because the modules will only be able
to export limited permissions for resources they know about. One common failure
mode that this avoids is the accidental overpermissioning that occurs when someone
tries to expand a policy in a way the original author didn't expect. For
instance, this is a fairly standard policy granting read access only to a single bucket:

```
{
  "Version": "2012-10-17",
  "Id": "list",
  "Statement": [
    {
      "Action": [
        "s3:ListBucket",
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::my_tf_test_bucket/*",
        "arn:aws:s3:::my_tf_test_bucket"
      ],
    }
  ]
}
```

Now imagine that a stressed-out application team member realizes that they
_also_ need permission to list all bucket names. They might do something like this:

```
{
  "Version": "2012-10-17",
  "Id": "list",
  "Statement": [
    {
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:ListAllMyBuckets"
      ],
      "Resource": [
        "arn:aws:s3:::my_tf_test_bucket/*",
        "arn:aws:s3:::my_tf_test_bucket",
         "arn:aws:s3*"
      ],
    }
  ]
}
```
The _intent_ here is clearly to add "list all buckets" permission, but the effect 
is much wider. Since _all_ the actions are allowed on _all_ resources, this policy
now grants permission to read _any object in any bucket_. If this is a
50- or 60-line policy, it can be very difficult to detect when something like this
has happened. It's much easier to be suspicious if a resource like `arn:aws:s3*`
shows up in the `permission_sets` output of a module that's only supposed to
create a single bucket.

If you want to see examples of these modules and others like them, you can follow my
progress building a personal social media alternative on [github](https://github.com/RLuckom/raphaelluckom.com/tree/master/terraform). 
That's all I have time for today, hope it helps!
