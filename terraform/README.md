Basic configuration for my site, using an S3 bucket and cloudfront distribution.

TODO: The cloudfront logs go to a bucket, but I'm not doing much else
with them. based on [this blog post](https://www.quicksprout.com/website-analytics-quickstart-guide/)
I ought to be using Google Analytics for counting pageviews and referral sources,
but I'm loathe to go to the trouble of standing up my own SSL-protected domain
just to turn around and invite the snoops in. Cloudfront provides lackluster-but-
possibly sufficient data on its own; past that, I could look into AWS Athena or roll
my own.
