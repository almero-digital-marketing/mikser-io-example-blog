---
title: Git is the audit trail you already have
date: 2025-03-28
$author: /authors/bitter-truth
layout: post
summary: Content management systems build audit-trail features. Calendars, dashboards, rollback UIs, change histories. Most of this work duplicates what git already does, with worse ergonomics and no portability.
tags: [content, version-control]
status: published
---

A CMS I evaluated last month listed "complete version history of every page" as a premium feature. It was an upsell. Two hundred dollars a month buys you the ability to see who changed what, when, and roll back to a previous state. The free tier shows you the last seven days.

I read this and noticed that mikser has none of those features.

It also doesn't need them, because the content is stored in git, and git has all of those features built in, and they're free, and they work better than the CMS's version, and they're portable, and they survive the CMS shutting down. The CMS is selling a worse version of a thing that is already free.

This is a small example of a larger pattern: content tools keep rebuilding capabilities that the underlying platform already provides. Sometimes they don't realize the platform provides them. Sometimes they realize but want to control the experience. Sometimes they want the revenue from selling the upsell. Whatever the reason, the result is the same — duplicated work, worse ergonomics, and a feature that disappears when the CMS does.

---

What git gives you for free, in any content project, includes:

- Complete change history of every file, going back to the beginning of the project
- Who changed what, when, with an attached message explaining why
- The ability to roll back any change, individually or in batches
- The ability to see what the content looked like at any point in the past
- Diff visualization for any two states
- Branching, so you can work on a draft without affecting the published version
- Merging, so you can integrate someone else's changes
- A complete portable archive — the .git folder contains everything, you can take it anywhere

The CMS dashboard might show some of this more prettily. It might offer a calendar view of changes. It might let you click "rollback" without typing a git command. These are real conveniences. They are not, however, capabilities — they are interfaces wrapped around capabilities that already exist.

The cost of the convenience is that it's locked to that CMS. If you leave the platform, you lose the dashboard. The history might still be there in the exported data, but the interface to interact with it is gone.

---

Mikser bets that the convenience is worth less than the portability. Every mikser project's audit trail lives in git, in the .git folder of the repo. The tools to interact with it are git commands, GitHub's web interface, GitKraken, magit, whatever you already use. The history survives the engine. It survives the maintainer. It survives the platform.

This is not a feature mikser shipped. It's a property of choosing files as the source of truth. The git history comes for free, because the content is already in git.

The same thing applies to several other features that content tools commonly sell:

- **Collaboration**: git already has pull requests, code review, branch-based collaboration. CMSes often rebuild these as "approval workflows." Worse implementation, locked to the platform, no portability.

- **Permissions**: git already has repo-level permissions, branch protection, signed commits. CMSes often rebuild these as "user roles." Worse implementation, locked to the platform.

- **Search**: ripgrep already searches every file in the tree faster than most CMS search bars. The CMS adds full-text search with ranking; sometimes you need that, often you don't.

- **Backup**: git is itself a backup. Every clone is a complete copy. CMSes sell backups as a premium tier; git gives them for free.

In each case the CMS isn't wrong to build the feature. It might even build it better, for some specific use case. But the choice to build it inside the CMS instead of relying on the platform underneath comes with a cost — duplication, lock-in, fragility. The CMS user often pays that cost without realizing they're paying it.

---

The meta-lesson is that you should think hard about which capabilities your tool is rebuilding that the platform already provides. Some duplication is justified — the platform's version might be too low-level, or too generic, or too hard to access. Some duplication is just laziness or revenue-seeking. The question to ask is: if the platform's version of this feature became more accessible, would my version still be valuable?

For mikser, the answer for "version history" is no. The git version is fine. The git version is, in fact, better than anything mikser could ship, because it's universal, durable, and free.

So mikser doesn't ship version history. The feature is in the platform. The mikser code that would have implemented it doesn't exist. That code doesn't have to be maintained. The bug reports don't have to be triaged. The migration story doesn't have to be designed. All of that complexity is absent from the project because the feature is somebody else's responsibility — git's, in this case — and git is good at it.

---

The thing I'd want a younger engineer to internalize from this is that "we should build feature X" is often the wrong reflex. The right question is: does feature X already exist in some layer below me? If so, can I just use that layer? If not, why not? If so, do I really need a custom version?

Most of the time the answer is "the layer below has it, and I should just use it." The features that are worth building are the ones the platform genuinely doesn't provide. Everything else is duplication.

This isn't a discipline that comes naturally. The instinct to control the user's experience is strong. The instinct to ship a feature is strong. The discipline of saying "this isn't ours to build, let the layer below handle it" is rare.

When you find it, the result is a smaller, cleaner tool that lasts longer.

The audit trail in mikser is in git. It always has been. It always will be. Nothing about mikser has to maintain it. It just works, because the layer below was already doing the work.
