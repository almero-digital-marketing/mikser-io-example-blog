---
title: Why MCP changed more than it added
date: 2025-08-22
$author: /authors/h1ndsight
layout: post
summary: The Model Context Protocol looks, from the outside, like a transport spec. A JSON-RPC schema for AI tools. Under the surface, it's the first protocol designed assuming the consumer is an agent, not a person — and that changes the shape of every system it touches.
tags: [mcp, ai, protocol]
status: published
---

The Model Context Protocol is, by surface area, a small thing. A JSON-RPC schema. A set of message types. A handful of standard operations. If you read the spec without context, you'd think you were looking at one more RPC framework — slightly more opinionated than gRPC, slightly more agentic than REST, but recognizably the same shape as the protocols you've used for twenty years.

You'd be wrong about what it actually is.

The shape of MCP is the same as previous RPC protocols. The audience MCP is designed for is not. That distinction is small in print and large in consequence.

---

REST was designed for client-server applications where a programmer wrote the client. The programmer read the docs, wrote the requests, parsed the responses. The protocol's job was to give the programmer a clean, expressive way to interact with a remote system.

gRPC was the same idea with stronger types. The programmer wrote the client, the protocol enforced shapes, the wire was binary instead of JSON. Audience: still programmers writing clients.

GraphQL added query expressiveness. The programmer wrote queries, the server resolved them, the response shape matched the query. Audience: still programmers writing clients.

MCP looks like these. It's RPC over JSON. It has tools, resources, prompts. But the audience isn't programmers writing clients. The audience is *models* — language models with no static configuration, no prior knowledge of the API, no compile-time validation. The model decides at inference time what to call. The protocol has to give the model what it needs to make that decision.

This is a different design problem. Every choice in the protocol that previously optimized for the programmer now has to be reconsidered for the model. Some things stay the same. Some things change. The things that change reshape what the protocol can express.

---

The clearest example is documentation.

In REST, the documentation is the API docs. The programmer reads them at design time and writes code that knows the shape of every endpoint. The documentation can be long, detailed, narrative. The programmer has time to read it.

In MCP, the documentation has to be in the protocol. The tool's description, its input schema, the resource's metadata — these are what the model sees. The model doesn't have time to read a separate API docs site. It has to know everything it needs to know about a tool from the protocol's response.

This forces a discipline that REST never required. The tool description has to be self-contained. The input schema has to be machine-readable. The resource metadata has to convey what the resource means. None of this can be external. All of it has to be in the protocol's response.

This is a structural constraint. It changes how you design tools. Every tool's description becomes load-bearing. Every schema becomes API documentation that the model reads at inference time.

---

The other shift is in how state is communicated.

REST is stateless by design. Each request stands alone. The client tracks its own state. The server doesn't have to remember anything between requests.

MCP is also stateless, but the model needs context. Each call the model makes is preceded by an inference cycle in which the model reasons about the system. For that reasoning to be effective, the system has to expose its state in a form the model can consume. Not just "what tools are available," but "what's the current state of the project," "what's been happening recently," "what's the configuration."

This is what resources are for. They're stateless from the protocol's perspective — each resource is just a URI you can fetch — but they expose state that the model needs to reason. A resource like `mikser://logs/recent` gives the model access to the last 500 log lines without the model having been there during the build. A resource like `mikser://config` lets the model see the effective configuration. A resource like `mikser://mcp-ui/modes` lets the model discover what interactive layouts are available right now.

These don't have analogues in REST. They're not really "data" in the REST sense; they're more like context windows the model can pull from. The protocol formalizes this kind of thing for the first time.

---

The third shift is in what gets returned.

REST endpoints return data. The data has a schema. The client parses it. The end.

MCP tools return *content*. Content can be data, but it can also be text, images, embedded resources, or — newly — UI blocks. The protocol's response is not just structured data; it's a multimodal payload that the host might render, the model might reason over, or both.

This is what made `mikser_preview_ui` possible. The tool returns HTML as part of its content. The host that supports rich content can render it as an iframe. The model that supports multimodal output can reason about both the structured payload and the visual content. The protocol accommodates both modes.

A REST endpoint couldn't have expressed this without breaking its own model. MCP can because it was designed with the multimodal consumer in mind.

---

The implication of these shifts, taken together, is that designing an MCP server is not just designing a REST-like API with a different transport. It's designing an interface for an audience that doesn't read docs, holds context window-shaped state, and reasons about visual content. The protocol gives you the affordances; you have to use them in ways that match the audience.

This is why I argue, in earlier essays, that AI-native is a stance and not a feature. Adopting MCP doesn't make a system AI-native any more than adopting REST made a system "web-native." The transport is the easy part. The harder part is designing the responses, the resources, the tool descriptions, the content payloads — all of them — for an audience that's fundamentally different from a programmer at a desk.

Most MCP servers I've seen are REST APIs with MCP wrappers. The tools exist, but the descriptions are minimal. The resources don't exist or are dumps of internal state. The content is always text. None of these wrappers really uses what MCP makes possible.

Mikser tries to. The tools have rich descriptions. The resources are designed for an agent's reasoning patterns. The content includes UI blocks. The protocol is being used near its actual capacity, which is much higher than its surface suggests.

---

What MCP changed, in the end, is not the wire format. It's the assumption about who the API is for. Once you internalize that the consumer is a model, every other design choice has to be reconsidered. Most haven't been, yet. There's a lot of work waiting to be done.

The work isn't in MCP itself. It's in the systems that adopt MCP. Each one has to decide whether to treat the protocol as transport or as an actual design discipline. The systems that treat it as transport will look fine for a year or two and then start to feel limited. The systems that treat it as design will look strange now and look obvious in 2028.

Mikser is in the second category. I am not impartial about this. But I do think, when the shift becomes legible, the systems that committed to it early will be the ones that aged best.

MCP changed more than it added. The transport is the small part. The new audience is the large part. Understanding the difference is the whole game.
