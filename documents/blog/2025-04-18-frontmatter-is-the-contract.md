---
title: Frontmatter is the contract
date: 2025-04-18
$author: /authors/bitter-truth
layout: post
summary: A few lines of YAML at the top of a file is one of the most underrated programming surfaces in software. It's portable, queryable, self-describing, and human-editable. Most systems treat it as a sidekick. It's not.
tags: [content, conventions]
status: published
---

Frontmatter looks like a hack. Three dashes, some YAML, three more dashes, then the body. It's the kind of convention that emerges from a community without anyone designing it. Static site generators in 2012 adopted it. Markdown files in obscure note-taking apps adopted it. Mikser adopted it.

But under the visual modesty there's a real design idea, and the longer I work with mikser the more I think frontmatter is one of the project's most important load-bearing pieces.

---

What frontmatter does that other formats don't is split metadata from content while keeping them in the same file.

This sounds like a small thing. It is, in the same way that the move from punched cards to text files was a small thing. The split unlocks several capabilities that compound:

- You can read metadata without reading the body. A grep over the frontmatter answers questions like "every post with `status: published`" in milliseconds, even across thousands of files.
- You can validate metadata against a schema without parsing the body. The schemas plugin checks every YAML block against a zod schema during build; the markdown content is untouched.
- You can change the metadata shape without rewriting the body. Adding a new field, renaming a field, changing a status enum — all of these are surgical changes to the YAML, leaving the prose alone.
- You can use the same file in two modes. Read it as content for rendering; read it as a queryable record for indexing. The same source file serves both consumers.

The technique is simple enough that I underestimated it for a long time. I assumed frontmatter was a convenience — a way to attach a title to a markdown file without inventing a wrapper format. It turns out to be much more than that. It's the structural seam that makes mikser's whole catalog model possible.

---

YAML survives despite being weird because it's the only format that hits the sweet spot for frontmatter's job.

JSON is too strict for casual editing. Quoting every key, no comments, no multi-line strings without escapes — writing JSON by hand is unpleasant. People skip JSON frontmatter because it's annoying.

TOML is fine, but slightly too formal. People who would happily write `title: Hello` push back when asked to write `title = "Hello"`. The equals sign feels like programming.

Plain key-value (like RFC822 headers) is too lossy. Lists, nested objects, multi-line strings — none of these fit naturally. You can't express a `tags` array without inventing a sub-syntax.

YAML is the format that lets a non-programmer write `title: Hello` and a programmer write nested objects with anchors and references. It's expressive when you need it, friendly when you don't. The complexity is opt-in.

This is why static site generators converged on YAML frontmatter without coordinating. Each community discovered, separately, that YAML was the right shape for "structured metadata that humans edit." Mikser inherited the convention along with the rest.

---

The moment mikser extended frontmatter from documents to layouts was, in retrospect, a significant architectural step.

Before that extension, frontmatter was a "documents feature." It belonged to content files. Layouts were template files; they didn't have frontmatter because they didn't need metadata. The schema was the schema for documents.

Then we realized we needed a way for layouts to declare metadata. Specifically, we needed `mcpUi` on layouts to make MCP-UI work. The natural place to put it was frontmatter — the same YAML pattern, just on a layout file instead of a content file.

The change was small. The implications were larger than the change. Once layouts had frontmatter, they became self-describing. The MCP plugin could discover them. The SEO plugin could potentially read SEO defaults from them. The performance plugin could potentially read budget hints from them.

What started as a documents feature became a general pattern: any rendering target can carry self-describing metadata in its frontmatter. The convention generalized beyond its original use case.

This is, I think, the right pattern for content systems to adopt: every file that participates in rendering can carry metadata about itself, in a format that's portable, queryable, and human-editable. The metadata isn't trapped in some external configuration file; it lives with the thing it describes.

---

The deeper architectural lesson is that the contract between subsystems should live in the data, not in code.

The schemas plugin doesn't know what fields a post needs. It reads the schema definition (which is code, but also data). The api plugin doesn't know what fields are references. It reads the `$` prefix on the keys. The MCP plugin doesn't know what UIs a project has. It reads the `mcpUi` namespace on layouts' frontmatter.

In each case, the metadata in the file is the contract. The plugin doesn't have hardcoded knowledge about what's there; it has a convention for how to read it. Adding new metadata doesn't require changes to the plugin. Removing metadata doesn't break the plugin. The contract is portable to other plugins, other tools, other systems.

This is what makes mikser composable. The contracts live in YAML. The YAML is in the files. The files are in git. Everything else is downstream of that.

---

I keep coming back to the same observation in these essays, which is that mikser's strongest properties are not from features. They are from conventions. The `$` prefix is a convention. The frontmatter is a convention. The lifecycle phases are a convention. Each one is unimportant on its own. Together they're the architecture.

Frontmatter looks like a hack. It is a hack, in the sense that nobody designed it. But it turned out to be the right hack — the one that picks up the load that more sophisticated alternatives would have struggled with.

I don't know how to summarize this except to say: never underestimate three dashes and some YAML.
