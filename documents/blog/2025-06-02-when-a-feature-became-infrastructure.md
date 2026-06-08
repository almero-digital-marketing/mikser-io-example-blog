---
title: When a feature became infrastructure
date: 2025-06-02
$author: /authors/bitter-truth
layout: post
summary: The references system started as a plugin. It stayed a plugin for two months. Then we noticed that three different consumers needed it and were each writing their own soft-dependency check. That's the moment to move it.
tags: [architecture, refs]
status: published
---

There's a question that comes up in every architecture: should this thing be in the engine, or should it be a plugin? Mikser has a four-test rule for answering it, but the rule is meant to be applied early — at the moment the thing is proposed. Sometimes you get it wrong on the first pass and have to revisit.

The references system was a case where we got it wrong on the first pass.

---

When we first added references, the design was deliberate: a plugin. We had ADR-0006, the four-test rule. References didn't pass test one (protocol or substrate) cleanly — it felt more like a content concern than infrastructure. We didn't push it into the engine. We made `mikser-io-plugin-refs`.

This worked for two months. The plugin built an inverse-reference index. It exposed `runtime.refs.inboundFor`, `runtime.refs.outboundFor`, and a few MCP tools (`mikser_refs_inbound`, `mikser_refs_outbound`, etc.). Other plugins could use it.

The "could" turned out to be a problem.

The api plugin wanted to use the refs index to invalidate cached query responses when referenced entities changed. So api had to check whether refs was loaded, and if not, fall back to coarse-grained invalidation. The check was a few lines, but it was a check, and it had to be there.

The schemas plugin wanted to use the refs index to know which referenced entities to revalidate when a target changed. Same shape: check if refs is loaded, fall back if not.

The SSE substrate wanted to use the refs index to drive live-expand subscriptions. Same shape: check, fall back.

Three consumers, each writing the same soft-dependency check. Each treating "refs might not be loaded" as a real possibility they had to handle. None of them able to assume refs was just there.

That's the moment we knew we had it wrong.

---

The pattern of "every consumer writes a soft-dependency check" is the tell. If three plugins all need a capability, and each one has to defensively handle the case where the capability isn't loaded, the capability isn't really a plugin. It's infrastructure that happens to be packaged as a plugin.

The fix is to make it actually infrastructure. Move it into the engine. Make it always available. Drop the soft-dependency checks across all the consumers.

We applied the four-test rule again, this time with the benefit of having watched three consumers struggle with the soft-dependency pattern:

- **Test 1 (protocol/substrate, not domain)**: yes, on reconsideration. Refs were infrastructure for content addressing — the same shape as the catalog. Both were derived projections of files, both were infrastructure other plugins query against.
- **Test 2 (strengthens an existing principle)**: yes. References strengthened ADR-0001 (mikser-as-content-layer) by making the graph queryable. It strengthened ADR-0003 (engine-stable) by giving plugins a stable surface to compose against.
- **Test 3 (god-plugin avoided)**: yes. Each plugin (api, schemas, sse) could now compose against refs without coordinating with each other.
- **Test 4 (plugins compose independently)**: yes, more clearly than before. With refs in the engine, plugins could subscribe to graph changes without knowing about each other.

The four tests passed cleanly on the second look. The decision to make refs infrastructure was, in retrospect, the right call. We just needed three consumers' worth of experience to see it.

---

We rewrote ADR-0007 to document the change. The original ADR-0007 (when refs were a plugin) is preserved in git history; the current version describes refs-as-infrastructure. The "watch for drift" section names the temptation: "Should refs go back to being a plugin?" The answer is no, and the reasoning lives in the ADR.

I want to name two lessons from this episode, because both generalize.

---

**Lesson one: the four-test rule is not just for proposals. It applies retroactively.**

Most teams apply ADRs to proposals — when someone wants to add something, you check it against the rule. Mikser applies them retroactively too. When a plugin has been in the field for a while and starts showing signs of being misclassified, you reapply the test.

The signal that something is misclassified is, in my experience, the soft-dependency check. If multiple consumers all defensively check whether a capability is loaded, the capability is either: (a) infrastructure that should be in the engine, or (b) a poorly-designed plugin that should not have so many consumers. Either way, the soft-dependency check is the smell.

When you see three plugins with the same soft-dependency check, stop and reconsider. The right answer might be moving the thing into the engine.

---

**Lesson two: the cost of moving from plugin to engine is real, but bounded.**

The migration of refs took about a week. The code didn't change much; mostly we moved files. The harder part was deprecating the plugin gracefully — anyone using `mikser-io-plugin-refs` needed to remove it from their config and update their imports.

The deprecation was painful for a few projects. We sent updates to known users. We documented the migration path. We made the engine version that introduced refs a clear breaking change (7.x → 8.x) so people knew to read the migration notes.

This cost is real. It's the cost of having gotten the original classification wrong. But it's bounded. It happens once. After the migration, the architecture is clean, and the soft-dependency checks are gone, and the engine has one more piece of stable infrastructure.

The alternative — leaving refs as a plugin forever — would have been a slow tax forever. Every new consumer would have had to write the soft-dependency check. Every refactor of refs would have had to consider compatibility with consumers that don't load it. The cost would have been smaller per-event, but it would have compounded indefinitely.

A bounded one-time cost beats a small indefinite one. This is usually the right trade.

---

The meta-pattern, if you want to internalize it, is: architecture is not done when you make a decision. It's done when you watch the decision live in the field for a while. Some decisions hold up. Some don't. The ones that don't, you fix.

The refs decision didn't hold up. We fixed it. The architecture is better for the fix.

What I'd want a younger engineer to learn from this is that being wrong on the first pass is not a failure. Being unwilling to reconsider is. The right discipline is to make decisions with the best information you have, watch them play out, and have the humility to revisit when the evidence comes in.

ADRs help with this because they document the original reasoning. When you reconsider, you have the original argument to push back against. The reconsideration is grounded.

Mikser will, I'm sure, get other decisions wrong on the first pass. The discipline is to notice when, and fix them. The refs migration was the first time we noticed and fixed something at this level. It won't be the last.
