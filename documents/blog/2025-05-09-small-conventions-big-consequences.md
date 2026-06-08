---
title: Small conventions, big consequences
date: 2025-05-09
$author: /authors/bitter-truth
layout: post
summary: The decision was about where to put a single character. We put it on the key, not in the value. The choice cascaded through every other system in the architecture for the next year.
tags: [architecture, references, design]
status: published
---

The decision was about where to put a single character.

Mikser had been working with references between entities for months — articles pointing at authors, landing pages pointing at images, products linking to related products. The references worked. They had to be looked up manually in each schema, which was tedious, but they worked.

The question on the table was: how do we mark a field as a reference, automatically?

Two options were obvious. We could keep the value as a plain string — `author: /authors/dick` — and require every schema to declare "the `author` field is a reference, please." This is what most systems do. It's clean. It puts the rules in the schema where rules belong.

Or we could change the value to a typed shape — `author: { $ref: '/authors/dick' }` — and let any consumer detect references by looking at the value. This is what JSON Schema does. It's general. It puts the information in the data where data lives.

We went with neither of those.

We put the marker on the key. `$author: /authors/dick`.

This sounds like a small thing. It is a small thing. But it changed the project's trajectory more than any other single design call in the last year. I want to explain why, because the lesson generalizes far beyond mikser.

---

The schema-side approach (declare references in the schema) has one fatal property: it doesn't work without schemas. Most mikser projects don't define schemas for everything. A new entity collection has zero schema for the first six months of its existence; the schemas come later, when someone has time to write them. If references are schema-gated, then projects without schemas have no graph at all.

That's a bad property. It means the most useful capabilities — inverse queries, rename cascade, link validation — only kick in after you've done a chore most people put off. The architecture punishes the laziness it should accommodate.

The value-side approach (refs are typed objects) has a different fatal property: the value is no longer portable. You can't `sed`-replace a reference from one file to another. You can't grep for entity ids. You can't paste a path from your URL bar into a file and have it work. The convenience of plain string values — which is most of what made mikser pleasant to use — disappears the moment you wrap references in object envelopes.

We needed a way to mark references that was:

- Detectable without a schema (so it works from day one of a new collection)
- Preserved in the value (so you keep the portability of plain strings)

That's two constraints. The only place left to put the marker is the key.

---

`$author: /authors/dick`.

Once you see it written down, it's obvious. The dollar sign on the key tells you "this is a reference" without changing the value at all. The string after the colon is the same href you'd write anywhere else in mikser. You can search for it with grep. You can replace it with sed. You can paste it from a URL.

But the engine, scanning the entity, knows the field is a reference. It doesn't need to ask a schema. It doesn't need to introspect anything. The marker is right there in the key.

This single property cascaded:

- The schemas plugin could now validate references with no per-schema configuration. Install the plugin, every `$`-key gets checked. The schemas you do write become typing aids, not gating mechanisms.
- The engine could now build an inverse-reference index by scanning the catalog once at startup. Every entity, scan its meta, find every `$`-key, record the inverse edge. No introspection. No metadata. Just a walk.
- The API could now offer an `expand` parameter without knowing what any field was. Pass `expand=author`, the api looks for `$author`, resolves it inline, returns it. The query knows nothing about schemas; it just follows the marker.
- AI agents reading the catalog directly could now see which fields were references just from the JSON. No documentation needed. The marker is self-explanatory.

Each of those features would have required substantial work in either of the alternative designs. The value-side approach would have required a schema engine to even start. The schema-side approach would have required every project to define every schema before any graph features worked. The key-side approach made all of them free.

---

I want to name the general lesson, because I think it's underappreciated outside of language design.

The information you encode in a system has to live somewhere. The dominant tradition in software is to encode it where it "belongs" — types in schemas, validation in validators, behavior in code. This is correct most of the time. But occasionally — rarely — there's a place to put information that costs nothing to read and works without any cooperation from the other parts of the system.

When you find one of those places, the right move is usually to use it.

`$` on the key is one of those places. It's a single character. It costs nothing to look at. It works without any schema. It's portable across grep, sed, paste, view-source. And once it's there, every other system in the architecture can rely on it being there.

The lesson is not "use sigils." Sigils are not always right. The lesson is: when a piece of information is needed by many different consumers, and there's a way to put it where every consumer can see it without coordinating with anyone else, that's almost always the right place.

---

A friend of mine who reviewed an earlier draft of this essay objected that I'm overstating the importance of one character. He said: "It's a minor convention. The system would work fine with a typed envelope. You're making too much of it."

I don't think I am. I think small choices like this are the only kind that compound across years. The big architectural decisions are usually obvious — you pick the right one because you read enough books. The small decisions are where projects diverge, because they're below the level where the books cover them.

Mikser's architecture is mostly conventional, from the outside. The compounding wins come from a handful of small calls like this one. Each is unimportant on its own. Together, they make the system feel like it was designed by someone who knew where they were going.

Which it was, more or less. Just not the way you think.
