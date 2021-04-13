---
title: "Plugin Permission Isolation Proposal 001"
author: "Raphael Luckom"
date: 2021-04-13T11:02:22
draft: false
meta:
  trail:
    - implemetation-note
    - security
    - proposal
---
_This post describes a proposal for giving parts of a UI minimal permissions. I think it ought
to work, but I'd like to write it out so that others can try to poke holes in it before I get
too invested. It's going to be somewhat technical._

This proposal concerns a strategy for isolating the permissions given to plugins in
a plugin architecture. I'm looking for insight into whether this design can succeed in isolating
those permissions.

Access to the entire site is controlled via OAuth2. That is, on first logging in, a user completed
the oauth flow [as described in an earlier post](https://raphaelluckom.com/posts/login_system_notes.html). 
On successful sign-in, a `httpOnly` JWT ID token is set in the user's browser for the domain.
This ID token is required for every request. It can _also_ be exchanged for AWS credentials
(but not in the browser, because, as `httpOnly`, it's not accessible to JS running on the page).
The ID token can be associated with multiple roles; that is, a single token may be exchangeable
for any one of several roles.

For the purpose of this discussion, a _plugin_ consists of an arbitrary[^1] directory of files
to be served to a browser over HTTPS. The plugin authors would _not_ be allowed to set response 
headers for these pages--the CSP header, specifically, would restrict the plugin capabilities. 
To prevent cross-plugin attacks, the CSP for each plugin could be narrowed to only allow requests
to whitelisted API paths, even within the host domain.

Plugin authors would specify the permissions required by their plugin. On plugin installation, 
a role with those permissions would be created, and it would be included in the set of roles that 
can be given in return for the ID token of an authorized user[^2]. The goal of this design is 
that the code written by the plugin author should _only_ be able to use the permissions assigned
to that plugin, not the permissions of any other roles for which the user's token may be eligible.

All the plugin directories will be hosted within a single root directory; for the purpose of this
discussion it will be called `/plugins/`. So a blog plugin might include the pages:

```
/plugins/blog/index.html
/plugins/blog/js/main.js
/plugins/blog/css/styles.css
```

My proposal is to write a `get-credentials` endpoint that exchanges the JWT ID token for AWS credentials.
This endpoint would be configured with a map of plugin names to roles. On receiving a request,
the endpoint would use the `Referer` header to determine which page sent the request. It would
look up the appropriate role based on the page prefix (i.e. a request originating from `plugins/blog/index.html` 
would map to the role for the `blog` plugin). The `get-credentials` code would then attempt to
exchange the ID JWT for a set of AWS credentials with the requested role. If successful, these
would be returned to the script running on the page. 

I'm looking for ways that this design could fail, where failure is defined as plugin code gaining
access to permissions outside those included in the requested set, such as those of a different
plugin or another role for which the user's JWT is eligible.

[^1]: I'd like to start out with the assumption that a malicious plugin developer could put
      anything in the plugin. If there turn out to be specific things it's necessary to guard
      against, that will be good to know.

[^2]: Let's assume that a user is placed in groups that give access to different roles. In this
      system, it's likely that there will be exactly one user (the system owner) and that they will
      have all the available permissions.
