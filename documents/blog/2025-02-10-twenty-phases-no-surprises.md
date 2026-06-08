---
title: Twenty phases, no surprises
date: 2025-02-10
$author: /authors/bitter-truth
layout: post
summary: A fixed sequence of phases is a strange choice in 2025. Everything else has moved to dependency graphs, declarative orchestration, "the right order is whatever order works." Mikser kept the sequence. The reasons are not the reasons you'd guess.
tags: [architecture, lifecycle]
status: published
---

When a plugin runs in mikser, it runs at a specific phase of a fixed twenty-phase sequence. The phases are: initialize, load, loaded, import, imported, process, processed, persist, persisted, beforeRender, render, afterRender, beforePostprocess, postprocess, afterPostprocess, finalize, finalized, cancel, cancelled, complete. There is no ordering between plugins within a phase; there is strict ordering between phases.

This is a strange choice in 2025. Most modern systems have moved away from fixed orderings. Webpack has plugins that declare their dependencies. Babel has presets that compose. Even something as simple as a CI pipeline like GitHub Actions lets you express "this job depends on that job." The convention is: plugins declare what they need, the system figures out the order.

Mikser doesn't do this. The phases are baked in. There's no way to declare dependencies between plugins. There's no way to insert a phase. There's no way to change the order. If you want something to happen, you find the right existing phase and put your code there.

This sounds limiting. In practice, it's the thing that makes mikser pleasant to work with.

---

The reason fixed phases work is that they trade flexibility for predictability. When the order is fixed, you always know when your code is going to run. You don't have to think about who else has hooked into the same phase. You don't have to wonder if another plugin's dependency-declaration changed the effective order.

This sounds like a small benefit. It compounds enormously.

In a dependency-graph system, plugins implicitly compose with each other through the dependency declarations. You can't reason about your plugin in isolation; you have to know what other plugins are loaded and what they declared. Adding a new plugin can change the order of existing plugins. Removing a plugin can change the order in surprising ways.

In a fixed-phase system, each plugin runs at its phase regardless of what other plugins exist. You write your plugin against the lifecycle, not against other plugins. Adding a new plugin doesn't change anything about existing plugins' behavior; it just adds new code at some phase.

The result is that mikser plugins compose by accident. You don't have to design them to work together. They just do, because each one is independently slotted into the lifecycle.

---

The objection is that fixed phases are restrictive. What if you need a phase that doesn't exist? What if your plugin's logic doesn't fit cleanly into any phase?

The mikser answer is: that's a signal you should rethink the plugin, not change the engine. The twenty phases were chosen carefully. Each one represents a distinct stage of content processing: loading sources, processing them, persisting state, rendering output, cleaning up. If your plugin doesn't fit any phase, it probably has a confused responsibility — it's trying to do two things that should be separate plugins.

This is the same logic that drives microservice boundaries: if a service doesn't fit a single responsibility, split it. The phases are a forcing function for clean plugin design. They are restrictive on purpose.

In two years of mikser, we have not added a phase. There have been proposals. Each proposal turned out to be either: (a) the work could be done at an existing phase if the plugin were redesigned, or (b) the work could be done at a different abstraction level — a sidecar, a separate plugin, a post-processing step. The constraint of "no new phases" forced better designs.

---

The other piece worth naming is what fixed phases enable that dependency graphs don't.

When the lifecycle is predictable, the engine can do things that depend on knowing the schedule. The catalog can be built once at the right phase and read-only thereafter. The journal can be flushed at a known point. The rendering can happen in parallel because we know nothing earlier will mutate the catalog. The schemas plugin can do its deferred validation in a specific cycle because it knows when other plugins have finished.

These guarantees are only possible because the phase order is fixed. In a dependency-graph system, you can't make these guarantees because the effective order depends on what's installed. Mikser gets to make stronger guarantees, which means plugins can be simpler.

---

The deeper lesson is that flexibility is overrated when stability is what you actually need. Dependency graphs let you express any ordering. That's flexibility. But most of the time you don't want any ordering; you want *the* ordering — the one that everyone agrees on, that doesn't change when a plugin is added or removed, that you can rely on.

For content processing, the right ordering exists. Loading happens before processing. Processing happens before rendering. Rendering happens before postprocessing. Cleanup happens last. These are not arbitrary; they reflect the actual structure of the task.

Mikser bets that this structure is general enough to encode in twenty fixed phases. So far the bet has paid off. Plugins are simpler. Composition is implicit. The engine has not had to add phases.

There may come a day when the fixed phases turn out to be insufficient. We will know it because no amount of plugin redesign can fit a real use case into the lifecycle. That day has not come. I don't expect it for a long time.

In the meantime, the lifecycle is the thing that makes mikser composable, and it's composable because it doesn't try to be flexible.
