---
title: ADRs are the project's memory
date: 2024-12-20
$author: /authors/h1ndsight
layout: post
summary: A project without ADRs is a project that re-litigates every decision every six months. Someone notices the design and asks why. Nobody remembers. The conversation reaches the same conclusion or the opposite one, depending on who is in the room that day.
tags: [process, memory, discipline]
status: published
---

A project without ADRs is a project that re-litigates every decision every six months. Someone notices the design and asks why. Nobody remembers. The conversation reaches the same conclusion or the opposite one, depending on who is in the room that day. The project drifts.

The maintainer of mikser started writing ADRs about a year into the project. The first one was a retroactive document for a decision that had already been made — the choice to use files as the source of truth instead of a database. He wrote it because he kept getting the same question from new contributors: why files? Why not a real CMS backend? Why are you working in a way the rest of the industry has moved past?

He realized that each time someone asked the question, he was reconstructing the answer from memory. The answer was the same answer each time. But the reconstruction was lossy — sometimes he forgot a point, sometimes he was annoyed by the repetition, sometimes the explanation was less clear than the original thinking had been.

He wrote it down. He called it ADR-0002. The next time someone asked, he pointed at the document. The question stopped recurring as conversation; it became a thing people could read.

---

An ADR — Architecture Decision Record — is a short document that captures three things: the situation that forced a decision, the decision that was made, and the consequences that followed. In mikser the format also includes a "watch for drift" section, which names the failure mode the decision was protecting against. That section turns out to be the most valuable part.

The format matters less than the discipline of writing them at all. Most teams skip ADRs because they feel like ceremony. They are ceremony — the same kind of ceremony that lets a marriage survive when one of the people forgets why they agreed to something six years ago. The ceremony is the point. It's a hedge against forgetting.

Software projects forget. The team turns over. The maintainer takes a year off. The codebase grows past the point where anyone can hold the whole thing in mind. Decisions that seemed obvious at the time become opaque. Someone proposes "let's just add this small thing" and nobody remembers why we said no to it before.

ADRs are how you make the project's memory durable beyond the people who wrote it.

---

The objection people raise to ADRs is that they're heavyweight. Documentation overhead. Process. Bureaucracy. Real engineers ship code; they don't write essays about why they shipped code.

I think this objection is wrong, and the reason it's wrong is specific to the kind of decisions ADRs document.

ADRs are not for documenting code. Documentation tools handle that. ADRs are for documenting the load-bearing decisions — the ones that, if reversed, would require rewriting significant parts of the system. Those decisions are rare. Mikser has seven ADRs in two years. That's a comfortable rate.

The ones worth writing are the ones you expect to be re-litigated. "Why are we using files?" gets re-litigated. "Why is the api plugin shaped this way?" gets re-litigated. "Why does the vector plugin live outside core?" gets re-litigated. Those are ADR-shaped questions.

"Why does this loop use `forEach` instead of `for`?" does not get re-litigated. That's a code comment, not an ADR.

The distinction matters because the cost of an ADR is real. Writing one well takes hours. The text gets reviewed. The decision gets debated. If you write ADRs for everything, you burn time on documents that don't deserve it. If you write them for nothing, you re-litigate every decision every year.

The sweet spot is decisions that are expected to be challenged, where the cost of forgetting why you chose what you chose is high.

---

The "watch for drift" section, which mikser added to its ADR template midway through the second year, is worth a separate note.

The idea is that every architectural decision is protecting against a specific failure mode. The decision was made because there was a temptation to do otherwise, and the temptation will recur. If you don't name the temptation, future readers won't understand the decision; they'll just see a constraint and try to work around it.

For example: ADR-0006 documents the four-test rule for adding things to the engine. The "watch for drift" section names the temptation: "It's just easier to put it in core." "Multiple plugins need this code." "It's only a few lines." These are the arguments that will be made by future contributors who want to add something to the engine. The ADR names them in advance, so when someone makes the argument, the response is "yes, that's the temptation the rule was designed to resist."

This is a small structural addition to the ADR format. It costs nothing. It saves enormous time when someone proposes the thing the ADR was designed to prevent.

---

The lesson generalizes past mikser.

If you maintain a software project for more than a year — really maintain it, with multiple contributors, with new people joining — you will forget the reasons for your decisions. The forgetting will happen even if you don't notice. The decisions will start to seem arbitrary. New contributors will propose changes that would undo old decisions, and you'll find yourself having the same conversation you had two years ago.

The defense is writing down the load-bearing reasoning. Not every reason. The load-bearing ones. The ones that, if you forgot, would lead the project somewhere it shouldn't go.

ADRs are the right shape for this because they're short, they're versioned, they're part of the repo, and they don't pretend to be more than they are. They're not documentation. They're memory.

Most teams will skip them. The teams that don't will look, in retrospect, like they had unusual foresight. They didn't. They just wrote things down.
