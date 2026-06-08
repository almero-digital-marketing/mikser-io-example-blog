---
title: Discovery beats description
date: 2025-11-25
$author: /authors/bitter-truth
layout: post
summary: Most MCP servers describe their tools with static text and let the description rot as the project evolves. A better approach is to expose a dynamic resource the agent reads to discover what's actually available, right now.
tags: [mcp, discovery]
status: published
---

When you register a tool with an MCP server, you give it a description string. The string ships with the tool. Agents read it to know what the tool does and when to call it. The description is, in MCP's terms, the tool's documentation.

The description is also static, which means it's always one step behind the actual state of the system. The day you write it, it's correct. Six months later, after the project has grown, it's a fossil.

I want to write about why this matters and what to do about it, because it's the kind of subtle architectural choice that compounds in ways most teams don't notice.

---

The problem comes up most acutely for tools whose behavior depends on the state of the project. Mikser's `mikser_preview_ui` is the canonical example. The tool's job is to render an entity as an inline UI block, but which UI block depends on what `mcpUi` layouts exist in the project. The agent calling the tool needs to know what modes are available — `preview`? `edit`? `approval`? `comparison`? — and which entity patterns each mode covers.

If you put this information in the tool description, you have to either:

1. List the modes that *might* exist ("typical modes include preview, edit, approval"), which is vague and may not match this project
2. List the modes that exist *right now*, which goes stale the moment someone adds a layout
3. Punt and tell the agent to figure it out by trying things, which is wasteful

None of these are good. The first is misleading. The second requires regenerating the description on every change. The third trains the agent to guess.

What you actually want is for the description to say "read this resource to learn what's available" and for the resource to be live-derived from the catalog at read time. That's what we ended up doing.

---

Mikser exposes a resource at `mikser://mcp-ui/modes`. When the agent fetches it, the resource handler walks the catalog, finds every layout with `mcpUi` frontmatter, groups them by mode, and returns the result as JSON. The response looks something like:

```json
{
  "modes": {
    "preview": [
      { "layoutId": "/layouts/post-preview.hbs", "match": "@/blog/*", ... },
      { "layoutId": "/layouts/author-preview.hbs", "match": "@/authors/*", ... }
    ],
    "edit": [
      { "layoutId": "/layouts/post-edit.hbs", "match": "@/blog/*", ... }
    ],
    "approval": [...]
  },
  "totalLayouts": 7
}
```

The agent reads this once and knows exactly what's possible. There's no guessing. There's no out-of-date description. Adding a new layout makes the new mode appear in the next read.

The tool description stays small: "Render an entity to inline HTML using a layout that declares `mcpUi` frontmatter. Read `mikser://mcp-ui/modes` first to discover what modes are available in this project." That description doesn't go stale because it doesn't enumerate anything. It points at the resource that does the enumerating.

---

The pattern generalizes well past `mikser_preview_ui`.

Any tool whose behavior depends on project state has the same problem. The MCP tool for "search the catalog" needs to know what kinds of entities exist — but those vary per project, and a static description can't capture them. The MCP tool for "render an entity" needs to know what layouts exist — same issue. The MCP tool for "find similar content" needs to know what vector stores are configured — same issue.

In each case, the right pattern is: keep the tool description small and stable, expose a resource that's live-derived from project state, point at the resource from the description.

This is, in a sense, the resource side of MCP doing the work it's structurally designed for. Resources are not just for "static data the agent might want." They're for "any context the agent needs that depends on the current state of the system." Once you see this, you start to see resource-shaped opportunities everywhere.

---

The objection to this pattern is that it adds a round trip. The agent has to fetch the resource before calling the tool. That's an extra inference cycle.

I think this objection is wrong for two reasons.

First, the round trip happens once per session, not once per tool call. The agent fetches the resource at the start, caches the result mentally, and uses it for many subsequent tool calls. The amortized cost is small.

Second, the alternative — putting the discovery information in the description — also has a cost: every tool call sends the description back as part of the tool list, even when the agent doesn't need it. For tools whose discovery information would be large (think: hundreds of modes, thousands of options), inlining everything in the description is more expensive than a single resource fetch.

The right calculus is: small, stable description plus on-demand resource. The agent pays one fetch when it needs the discovery information, nothing when it doesn't.

---

The deeper architectural lesson is that descriptions are bad at describing things that change. This sounds obvious when stated. It's surprising how often it's ignored.

Tool descriptions in MCP servers I've seen often try to enumerate everything: every mode, every option, every supported entity type, every possible action. The descriptions get long. They go stale. The agent reads them at the start of every session and burns context on information that may not even be accurate.

Resources are better at this. They're fetched on demand. They reflect current state. They can include detail the description can't afford. They're versionable — you can deprecate a resource path and point the agent at a new one without changing tool signatures.

The shift from "describe everything in the tool" to "describe the tool, point at resources for everything else" is small in terms of code and large in terms of how systems age. The systems that adopt it look fresh after two years. The systems that don't look like they need maintenance.

---

I want to name one more pattern that falls out of this.

The resource at `mikser://mcp-ui/modes` is derived from layout frontmatter. The layouts have `mcpUi` in their YAML, the resource reads that YAML and returns it. There's no separate registration step where a layout author says "and please add me to the discovery resource." The discovery is automatic, because the resource is just a live view of the catalog.

This means adding a new MCP-UI layout is one step: write the layout file with the right frontmatter. The discovery resource picks it up on the next read. No registration code, no plugin coordination, no manual updates to anything.

This is the right shape for AI-native systems generally. Configuration should be derived from data, not registered through code. The catalog is the source of truth; resources are views over the catalog; tools point at resources. Adding capabilities means adding data, not adding code.

When you can achieve this, the system feels alive. It evolves with the project, not on a separate maintenance cadence. The agent always sees the current state. The description never lies because it doesn't try to describe anything that changes.

---

What I'd want a younger engineer to internalize from this is that descriptions are a trap when applied to dynamic things. The instinct is to be helpful, to put as much as possible in the description, to anticipate what the agent might need to know. The right discipline is the opposite: make the description small and stable, push everything dynamic into resources, let the agent fetch what it needs when it needs it.

This is harder than it sounds. It requires accepting that the description is incomplete by design. The compensation is that the system stays accurate over time. The shorter description ages better than the longer one.

Discovery beats description. The agents I work with prefer it. So do the systems I trust over time.
