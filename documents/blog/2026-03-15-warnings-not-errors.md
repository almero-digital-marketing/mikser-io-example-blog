---
title: Warnings, not errors
date: 2026-03-15
$author: /authors/bitter-truth
layout: post
summary: Strict validation made sense when content edits were transactional. They're not anymore. File-based editing is incremental, sometimes broken-in-the-middle, sometimes accidentally circular. Errors that fight you are errors that the user disables.
tags: [validation, schemas, philosophy]
status: published
---

The first version of mikser's schemas plugin treated validation as a build-time gate. If your content didn't pass the schema, the build failed. The reasoning was straightforward — content that doesn't match its schema is broken, and broken content shouldn't ship.

This is correct in theory. It was wrong in practice, and the reasons it was wrong are the reasons most strict validators end up getting bypassed.

---

The failure mode showed up the first time the maintainer was working on a content migration. He was renaming an entity — `/authors/dick` to `/authors/d-stoyanov` — and updating every reference to point at the new id. There were eighteen references across the project. He renamed the entity, started updating the references one by one, ran the build to test.

The build failed.

Eighteen of the references hadn't been updated yet. The schema validation said `$author: /authors/dick` no longer resolved, because `/authors/dick` no longer existed. Strict validation interpreted this correctly — the references were broken — and failed the build.

The maintainer was in the middle of fixing them. He knew they were broken. He was working through them in order. The strict validator was telling him something he already knew, while preventing him from running the build to test his progress.

He turned the validator off.

---

This is the failure mode of strict validation in file-based editing. The validator is correct in its observation but wrong in its action. The content is in fact broken; the editor is in fact fixing it; making the build fail does not help the editor work faster. It just adds noise to a process that needs to make progress.

The same thing happens in other normal editing patterns:

- Creating a new entity that references one you plan to create next. The first entity is "broken" until the second exists. Strict validation says "stop and create the second first." The editor knows the order they want to work in.
- Batch importing entities from another system. References may resolve in pieces as the import progresses. Strict validation fails on the first incomplete state. The import never finishes.
- Restructuring a folder. References to old paths need to be updated to new paths, one file at a time. Strict validation makes every intermediate state a build failure.

In each case, the validator is correctly identifying broken state and incorrectly responding to it. The right response is "noted, will check again next cycle." The wrong response is "halt everything."

---

Mikser's schemas plugin, in its current form, treats reference validation as warnings, not errors. The build doesn't fail when a reference is broken. It logs a warning. The warning includes the entity id and the broken reference. The build completes. The site renders. The broken entity might display badly, but the rest of the system keeps working.

The schemas plugin also re-evaluates failing references on every subsequent build cycle. A reference that was broken at cycle 1 might be fixed by cycle 2 (because the missing target was created), and the warning goes away automatically. The validator is tracking the state over time, not checking once and giving up.

This is the deferred-validation model. It's documented in ADR-0007 A6. It looks like a concession to laziness — "we're not going to enforce correctness strictly" — but I think it's actually the right model for file-based editing, and the alternatives are worse.

---

The objection to deferred validation is that it lets broken state ship. If a reference is broken and the build doesn't fail, the broken content might end up in production. The user might not notice. Worse, automated pipelines might miss the warning and ship anyway.

These are real concerns. The mikser response has three parts.

First, "broken reference" is a less severe class of error than "malformed YAML" or "missing layout." The latter break the build hard; you literally can't render. The former just produces output that has a non-resolving link. The render completes. The page exists. The link points somewhere that doesn't exist. This is a soft failure, the kind a normal CMS would call a "404 from this page." Calling it a build error is overreaction.

Second, the warnings are surfaced in a way that automated pipelines can consume. Mikser exposes `mikser://schemas/pending` as an MCP resource — the current list of unresolved validation failures. A CI step can fetch this resource after a build and exit non-zero if it's non-empty. The user gets the strict gate where they want it (in CI) without the strictness fighting them during local edits.

Third, the warnings are loud enough during local development that you'd have to actively ignore them to ship broken state. The console shows them. The dashboard shows them. The agent that's helping you edit shows them. Missing a warning requires effort.

These three together let strict-when-needed coexist with permissive-when-editing. The validator helps you when you want help and gets out of the way when you're in the middle of something.

---

The deeper observation, which I think generalizes past mikser, is that validators that fight the editor will be disabled.

This is not a moral failing. It's a structural one. If the validator's response to "broken state" is "stop everything," and the editor's response to "broken state" is "keep working, I'm fixing it," the two are in conflict, and the editor wins. They disable the validator. They lose the validation entirely.

A validator that defers, warns, and re-checks lets both happen. The editor keeps working. The validator keeps tracking. When the state is good, the warnings clear automatically. Nobody had to make a hard choice between progress and correctness.

This is, I think, the right model for any validator that operates during ongoing editing. The strict-gate model works for transactional operations — submit a form, commit a transaction, build a release — where the state is supposed to be coherent at the moment of validation. It doesn't work for ongoing edit sessions where coherence is a goal achieved over many small changes.

Mikser's content lives in the second world. The schemas plugin is right to operate accordingly.

---

There's a final piece worth naming, which is that the deferred-validation model rewards the editor for completing their work.

When validation defers warnings instead of failing builds, the editor sees their pending list shrink as they fix things. There's a visible counter — `mikser://schemas/pending` returns N entries; tomorrow it returns N-3 because three references were fixed. The editor experiences progress as the warnings clear.

A strict gate doesn't give this feeling. Strict gates are binary: broken (build fails) or fine (build succeeds). There's no sense of "approaching done" while broken. The editor either gets stuck or gets through. The progress is invisible.

Deferred validation makes the progress visible. The editor sees what's still pending and what's been resolved. The work has shape. This is a small UX difference and a large psychological one.

---

What I'd want a younger engineer to internalize is that validation is a tool, not a goal. The goal is correct output. Validation helps achieve that goal when it works with the editor; it hurts when it fights them. Strict gates work for some operations and don't for others. The right validation model is the one that matches the kind of work being done.

For file-based editing, the right model is warnings, not errors. The right enforcement is in CI, not in the local build. The right tracking is deferred and re-evaluated, not strict and one-shot.

These are not concessions to laziness. They are the structural choices that let validation actually do its job — which is to help the editor produce correct output, not to feel rigorous while making the editor's work harder.

The mikser model isn't novel. Other tools have figured this out separately. But it's worth naming explicitly, because the temptation to add strict gates is constant, and the cost of those gates is invisible until the editor disables them and the validation goes away entirely.

Warnings, not errors. The editor keeps working. The validator keeps tracking. The state converges. Nobody had to fight.
