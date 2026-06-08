---
title: Drift is the default
date: 2025-01-22
$author: /authors/bitter-truth
layout: post
summary: Software systems are not stable structures. They are dynamic equilibria, held in place by the continuous attention of the people maintaining them. The drift modes that do real damage are the ones you don't see happening.
tags: [discipline, architecture, entropy]
status: published
---

Software systems are not stable structures. They are dynamic equilibria, held in place by the continuous attention of the people maintaining them. The moment the attention slips, the structure starts deforming — slowly at first, then faster, until the original shape is gone and something else has taken its place.

The thing that's hard to absorb about this is that drift happens automatically. You don't have to do anything wrong. You can be doing everything right and still wake up one morning to find that the codebase has decayed in ways nobody noticed.

I've been working in mikser for almost two years now. The drift modes I've seen are not the ones I expected. They are more boring and more insidious.

---

The classic drift mode is feature creep: someone adds a feature, then another, then another, until the engine is bloated past recognition. This is the visible kind of drift. It's the kind people warn each other about. It's also, in my experience, the easiest to resist. If someone proposes adding a feature, the maintainer looks at it, asks if it passes the four-test rule, and either accepts or rejects. The visibility of the proposal makes it manageable.

The drift modes that actually do damage are the invisible ones.

---

The first invisible drift is what I'd call convention erosion. A pattern gets established. People follow it for a while. Then someone, in a hurry, deviates from the pattern in a small way. The deviation works. Nobody notices. The next person in a hurry deviates a little more. After six months, the codebase has three slightly different patterns for the same thing, and nobody can remember which is canonical.

Convention erosion is invisible because each individual deviation is small. It's only when you look at the whole codebase that you see the pattern is gone.

The defense against convention erosion is mostly social: code review, style guides, paired implementation. Mikser uses ADRs' "watch for drift" sections to name the conventions explicitly so that deviations are visible. But even with all of that, conventions slip. They have to be defended continuously.

---

The second invisible drift is what I'd call abstraction inversion. A primitive is built for one purpose. Over time, people use it for slightly different purposes. The primitive gets extended to accommodate the new uses. The extensions are reasonable individually. But after a year, the primitive is doing five things instead of one, and changing it is risky because all five things depend on it.

This is how layers thicken. The primitive that was once thin and clear becomes the most complicated piece of the codebase.

The defense against abstraction inversion is to keep primitives narrow. When someone wants to extend a primitive to handle a new case, the right answer is often "build a new primitive for the new case, even if it duplicates 80% of the existing one." Duplication is recoverable. Inverted abstractions are not.

I've seen mikser resist this drift several times. The schemas plugin could have absorbed reference validation; it didn't. The api plugin could have absorbed render previews; it didn't. Each time the temptation was to extend an existing thing rather than make a new one. Each time the right answer was to make a new one.

---

The third invisible drift is the most subtle: temporal coupling between things that shouldn't be coupled. The render pipeline depends on the catalog. The catalog depends on the journal. The journal depends on the lifecycle phases. These dependencies are correct. But over time, code starts to assume that things happen in a specific order, and the engine becomes structurally dependent on the order rather than on the data flow.

When you have temporal coupling, you can't change the order. The lifecycle becomes rigid in ways that aren't visible until you try to add a new phase or move an existing one.

Mikser's twenty-phase lifecycle was designed deliberately to be rigid in the visible way (the order is fixed) so that the temporal coupling would be obvious rather than hidden. Plugins can hook into phases; they can't change the phase order. This means the temporal coupling is documented, not implicit.

But even with this discipline, plugins can develop subtle assumptions about what happens in earlier phases. If a plugin assumes that the catalog is populated by phase X, it will break if the catalog ends up populated by phase X+1 instead. The fix is usually to make the dependency explicit — wait for an event, or check a state — rather than rely on the temporal ordering.

---

The thing all three drift modes share is that they happen below the level of visibility. Code review catches obvious changes. Tests catch behavioral regressions. Neither catches the slow erosion of conventions, abstractions, or implicit ordering. The codebase passes every test and looks fine in PRs, but the structure underneath is decaying.

The defense, as far as I can tell, is mostly to name the drift modes explicitly. Write them down in ADRs. Refer back to them when something feels off. Have someone who maintains the project long-term hold the architectural memory.

The maintainer of mikser does this. He keeps a sort of running notebook of "watch out for X" patterns. When something proposed looks like a known drift mode, he flags it. Most of the time he flags correctly. Sometimes he flags incorrectly, and a contributor argues, and the conversation lands at the right place.

What he doesn't do is assume the system is stable. He treats it as something that wants to decay and will decay unless he keeps watching.

This is the right posture. I think every long-running project needs someone with it. The projects that don't have someone with it are the projects that look fine for two years and unmaintainable by year five.

---

I want to end with the harder thing: drift will eventually win.

You can't maintain perfect coherence in a system that lives for a decade. Conventions slip. Abstractions invert. Layers thicken. The defense slows the drift; it doesn't stop it.

What the defense buys you is time. A project with active anti-drift discipline can last ten years before the structure becomes opaque. A project without it lasts two. The discipline doesn't make the system permanent; it extends the period during which the system is malleable.

For mikser, this means the work will eventually shift from "build new things" to "preserve what's there." That shift hasn't happened yet — the project is still in the build phase. But it's coming. The maintainer knows it's coming. The ADRs are partly his hedge against the day he doesn't remember why he did things.

Drift is the default. The work, always, is against it.
