---
title: "Terraform module storage dilemma"
author: "Raphael Luckom"
date: 2020-12-24T17:09:34
draft: false
meta:
  trail:
    - terraform
---
_This is going to be a technical post about building cloud functions_

I'm caught in a dilemma. I have a [repository](https://github.com/RLuckom/terraform_modules) for storing
[terraform modules](https://www.terraform.io/docs/modules/index.html). Modules let you bundle sets of infrastructure
together; for instance, you could make a module that created an S3 bucket _and_ IAM identities for interactng with it.
the module could accept as an argument your intended bucket name, and, after creating the bucket, it would export
the bucket [arn](https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html) and the identity arns.
Modules are really good for defining special-purpose systems (like "a logging system") out of general-purpose components
(a set of buckets, functions, and identities, working together).

One _really nice_ feature of these modules is that you can [include them from github](https://www.terraform.io/docs/modules/sources.html#github)
or from other sources. That means that you can start writing a module in your project, and then, once you have something that's ready for
reuse, you can move it to a separate repo for public consumption, thus establishing a set of known-publicly-consumable modules[^1].
With time and attention, a collection of modules comes to embody a consistent style of building--it provides drop-in building blocks
for subsystems like "a monitored, backed-up S3 bucket" or "a static-site generator". When you have standard subsystems that perform well over time,
you have more time for thinking about high-level architecture using those subsystems.

My dilemma concerns the way to include function code in terraform modules. My end goal is to have a module for "a backed-up, monitored bucket" that deploys not just
the bucket itself, but also whatever [lambda functions](https://www.terraform.io/docs/modules/sources.html#github) are needed to actually perform
backups and monitoring. Naturally, it's possible that some of these things could potentially be internal to the module (i.e. the module
creates the function), while others might be external (a centralized function, separate from the module, that does e.g. monitoring for your whole
environment, and which each building block plugs into). Doing this would require that modules be able to create functions.

Unfortunately, this is easier said than done. AWS functions get code in two ways: as [_layers_](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html)
and as function packages. Layers are a way of packaging commonly-used dependencies once and then using them across multiple functions
without having to re-upload them every time. The function package is the bundle of code that includes the entrypoint of your application.
Providing these code packages requires one of:

1. Having the code on the same filesystem as terraform, using terraform to [make a zip archive](https://registry.terraform.io/providers/hashicorp/archive/latest/docs/data-sources/archive_file) from it, and using that archive as your function code
2. Creating the archive outside of terraform, but having it in the same filesystem, and using terraform to upload it
3. Hosting the archive on S3, and using the S3 syntax in the [function resource](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function#s3_bucket) to tell AWS where to get the code from when your function is deployed
4. Including the code, or the archive, in your terraform modules repo on Github, so that when terraform downloads the module it gets the code too
5. Using a different method of hosting the terraform module (https, S3, etc) and including the code there.

None of these options are quite ideal[^2]. Any option that requires you to have the code or artifacts on the same filesystem as your
terraform code breaks the fundamental promise of using a module--that you can publish it to some repo and use it directly from there
without extra local setup. Github would be extremely convenient to _use_, but a `node_modules` directory can be hundreds of MB uncompressed, and
tens of MB compressed. I would argue that to store archives, or many MB of library code (i.e. not the code that your repo is "about")
within a repo is a misuse of git[^3]--the versioning concepts that git is built on become inefficient for that use case. The enticing thing about
git, however, is that it gives you pretty-nice signature verification--once you've stuffed 40MB of zipfile in a git repo, you can retrieve
that commit later and be pretty confident that it's byte-for-byte identical to what you expected[^4].

On the other hand, there are ways of hosting either the entire terraform module, or just the code archive, in S3. From a complexity standpoint,
doing this is about as easy as storing the files in github. From a security standpoint, it feels a little weaker. Terraform's `aws_s3_bucket_object`
data source [only allows you to download text files](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/s3_bucket_object),
so terraform won't let you download an archive, test its sha256 against a known value, and then upload it[^5].

So if it's tough to use github, and seems sketchy to use S3, what's left? I've spent a couple hours trying to think of a solution, but
everything I can come up with has a fair amount of complexity / brittleness for dubious security gains. So for now, I'm going to recognize the
following as the best I can do:

1. It's fine for _me_ to trust the code that's in my S3 bucket, because I put it there. It's also ok for me to let others download it from there. But other people shouldn't _trust a bucket I control_--they should not rely on me protecting that s3 bucket as a precondition of their infrastructure being secure.
2. For others to trust the code that's in an arbitrary bucket, they should be able to verify it against a sha256 hash from a trustworthy place (like github).
3. For now, I can publish on github a sha256 of every archive I'm hosting on s3. Cautious organizations can download each archive, validate its hash, and re-upload the archive in one of their own buckets. People who are ok living dangerously can rely on my S3 bucket.
4. If convenient, I can turn on [requester pays](https://docs.aws.amazon.com/AmazonS3/latest/dev/RequesterPaysBuckets.html), so that anyone who uses my archives directly will cover the bandwidth costs of downloading them.

This isn't a perfect solution, but it's about as good as I can come up with in a reasonable timeframe. It's also extremely simple to implement,
adds no dependencies on any new tools, and doesn't add structure that will be difficult to unwind later. Since module-storage decisions
don't affect module use very much, it should be easy to switch to something better down the road.

[^1]: If you decide to use any modules from a source like this that you don't control, I'd recommed using the `ref` parameter to ensure you get a known commit.

[^2]: Another option that I'm not going to discuss in the main body is using the official terraform registry. Because the registry works by reading a git repo, it has the same drawbacks as using github, plus slightly more complexity.

[^3]: A sentiment echoed by the [github documentation](https://docs.github.com/en/free-pro-team@latest/github/managing-large-files/what-is-my-disk-quota#external-dependencies)--though their limits are generous enough that one could probably get away with storing a zipped node_modules directory without getting caught.

[^4]: This is one of those places where "best practices" conversations get tricky. Code signing is a complex topic, and "the best" code signing
      would be hard to add to terraform as a user (and might also [assume the existence of a public-key infrastructure](https://scholar.harvard.edu/files/mickens/files/thisworldofours.pdf)).
      I'm looking for the easiest thing to do that gets an _acceptable_ amount of security. One way of deciding what's acceptable in a given
      context is to look at what other deployed solutions in the same context use. In that vein, [this](https://blog.tidelift.com/the-state-of-package-signing-across-package-managers)
      is an overview of signing efforts in widely-deployed languages / frameworks, and a significant number still use "none." So I'mma try to 
      do somewhat better than that without attempting heroics.

[^5]: you could do this within terraform using a [null resource](https://registry.terraform.io/providers/hashicorp/null/latest/docs/resources/resource). Null resources
      are discouraged because they add dependencies on external programs (such as the AWS cli).
