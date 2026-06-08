---
title: The engine that says no
date: 2024-11-03
$author: /authors/bitter-truth
layout: post
summary: Most engines grow. Mikser's growth has been the absence of growth. The discipline is to keep saying no until the case is overwhelming. The cost is permanent surface area, not lines of code.
tags: [discipline, architecture]
status: published
---

The first time the maintainer told me he was refusing to add something to the engine, I assumed he was being precious about scope. Six months later I had absorbed the actual rule, which is that engine surface is a permanent contract with every future consumer, and the only way to keep it small is to keep saying no even when saying yes would be easier.

The thing he refused that day was a "render hook" that would let plugins intercept the render call. It was useful. There was a real use case. Two plugins wanted it. He said no.

The reason he gave at the time was the four-test rule for adding things to core. Render hooks failed test three — the god-plugin test: if we added render hooks, every plugin that wanted to modify renders would compete for the same hook surface, and the engine would slowly become a coordination layer between competing plugins. The right answer was to push the rendering pipeline down into plugins themselves — let each renderer plugin own its phase, and let plugins compose into the pipeline without coordinating through the engine.

This was the right answer. It also took twice as long as adding the hook would have.

---

Most engines grow. They have to — features get added, users have edge cases, the project responds. Over years the engine accumulates surface area: more options, more hooks, more callbacks, more configuration. Each addition is justified individually. The aggregate is a system that nobody can hold in their head.

The discipline mikser tries to maintain is the discipline of *not* growing. Not because the engine is finished — it isn't — but because the cost of engine surface is permanent and the cost of not adding something is recoverable. If you don't add a feature and it turns out people need it, you can add it later. If you do add a feature and it turns out it was the wrong shape, you can never remove it. Every consumer who built against the early shape would break.

So the rule is: add to the engine only when not adding would mean a worse architecture, not just worse ergonomics. Ease alone never passes the test. Convenience never passes the test. "Multiple plugins need this code" never passes the test — that's what shared helpers are for. The bar is high on purpose.

In two years of mikser's life, the engine has grown twice: Express bootstrap and MCP bootstrap. Both passed the four-test rule. Both shipped. Everything else has either been rejected or moved out to a plugin.

---

There's a temptation when you're building software to confuse "important" with "should be in the engine." A feature that's used by every project feels like it belongs in the engine. The vector plugin is used by almost every mikser project; surely it should be core? No. Vector storage is domain. The decisions involved — embeddings, similarity algorithms, vector indices — are specific decisions about a specific kind of data. They don't belong in the engine because the engine has no opinions about content.

The features that *do* belong in the engine are the features that are structural, not domain-specific. The lifecycle. The catalog. The journal. The protocol substrates (Express, MCP). These are the shapes that everything composes against. They don't have opinions about content; they let plugins have opinions.

The distinction sounds abstract. It's not. The vector plugin can be swapped (sqlite-vec to pgvector) with zero engine changes. If vector storage had been in the engine, that swap would have been a breaking version. The reason it isn't is that the maintainer said no when someone first proposed adding it to core.

---

Saying no is socially harder than saying yes. The person asking has a real use case. The thing they're asking for is achievable. Saying yes would help them. Saying no requires you to explain why the architectural concern outweighs their immediate need, and the architectural concern is abstract while their need is concrete.

The way mikser handles this is by having the rule written down. ADR-0006 — "The four-test check for adding capability to the engine vs. shipping it as a plugin" — exists specifically so that "no" doesn't have to be argued from scratch every time. The ADR documents the reasoning. When someone proposes adding to core, the maintainer can point at the ADR and say: here's the test, here's the framework, let's see if your proposal passes.

Most proposals don't pass. The ADR is the shield that makes saying no possible.

---

I want to name the meta-lesson, because I think it generalizes far past mikser.

Software systems erode by accretion. Every individual addition is justified. Every individual feature is small. Over time the system becomes the sum of its accretions, which is much larger and less coherent than any single feature ever was. The engine you started with is no longer recognizable. The new engineers who join the project can't understand it. The old engineers who built it can't remember why half of it is there.

The defense against accretion is not better engineering. It's discipline expressed as habits and written rules. The four-test rule is a habit. The "no cross-plugin imports" rule is a habit. The ADR-or-don't rule is a habit. They are boring rules, applied consistently, that protect the system from itself.

If I were giving advice to someone building an engine — and I'm not, but if I were — it would be this: every "yes" to a new feature is a permanent commitment. Every "no" is recoverable. When in doubt, default to no. Write down why you said no. Revisit it when the case actually changes.

The cost of being too strict is that some features take longer to land. The cost of being too lax is that the engine becomes unmaintainable. The first cost is recoverable; the second is not.

Mikser is two years old. The engine is smaller, relative to its capabilities, than almost any comparable project I know. This is not an accident. It is the result of consistent saying no.

The thing the engine doesn't do is the thing that lets the engine keep doing the things it does well.
