# mikser-io-example-blog

A working mikser project demonstrating **AI agent integration flows** through a small philosophical blog. The blog is the staging ground; the point of the example is what you can do with Claude (or any MCP-speaking agent) once mikser is running.

The blog has 20 essays by an AI author named **B#tter Truth** — 5 full pieces and 15 drafts in various states of incompleteness. The drafts exist precisely so you can have the agent finish them with you, in conversation, with inline previews. That's the loop the example is built around.

## What this example demonstrates

This is not a "look at this nice static site" demo. The site rendering is incidental. What you're meant to see is:

- **`mikser_preview_ui`** — rendering entities as approve/reject UI blocks inside the chat with Claude. Edit a post, surface the preview inline, click Approve, done.
- **`mikser://mcp-ui/modes`** — live discovery of which interactive layouts are available, so the agent picks the right one without guessing.
- **`$`-references** — every essay's `$author` points at `bitter-truth.yml`. The agent can find every post by an author, rename across the graph, or expand the author inline in a single query.
- **Vector search** — "find every essay about MCP" returns matches by meaning, not by string match. Powered by the `vector` plugin + OpenAI embeddings (opt-in via `OPENAI_API_KEY`).
- **Schemas** — every post is validated against a zod schema. The agent reads the schema as an MCP resource to know what fields a new post needs.
- **Drafts vs published** — 15 of the 20 posts have `status: draft` and exist to be completed by the agent. The full posts establish voice; the drafts are work waiting for you.
- **The verification loop** — for any batch operation (tighten openings on all drafts, retag everything, etc.) the agent surfaces each result as an MCP-UI preview. You approve or reject one essay at a time, at scanning speed.

If you're trying to understand the mikser + agent story end-to-end, this example is meant to be the fastest path from "I read the README" to "I've actually seen this work."

## Run it

Three commands.

```bash
git clone https://github.com/almero-digital-marketing/mikser-io-example-blog
cd mikser-io-example-blog
npm install
npm start
```

`npm install` runs a `postinstall` hook that clones `mikser-io-examples-shared` into `files/shared/` — this is where the production-page CSS lives, shared across all mikser examples. To update the shared styling later: `git -C files/shared pull`.

`npm start` runs `mikser --watch --server 3001`. The rendered site lives at `http://localhost:3001`, and the MCP server (provided by the `mikser-io-mcp` plugin listed first in `mikser.config.js`'s plugins array) is mounted on the same port at `/mcp`. The watcher rebuilds on file change.

Optional: vector search requires OpenAI embeddings. Copy `.env.example` to `.env`, paste your key, and the next build indexes every post. Without the key everything else still works; only the "find essays about X" prompts degrade to nothing.

## Connect Claude

One command:

```bash
npm run register-mcp
```

That writes an entry into Claude Desktop's config file at the right OS-specific path, merging with any existing config. Then **fully quit** Claude Desktop (Cmd-Q, not just close the window) and reopen it. You should see mikser's tools listed in Claude — confirm by checking that `mikser_preview_ui`, `mikser_query_entities`, and the `mikser_refs_*` tools appear.

Other useful invocations:

```bash
npm run register-mcp -- --dry-run     # preview without writing
npm run register-mcp -- --force       # overwrite a differing existing entry
npm run register-mcp -- --name=foo    # use a custom server label
npm run unregister-mcp                # remove the entry
```

**Important**: Claude connects to mikser over HTTP via `supergateway`. That means `npm start` has to be running for Claude to find the server. Order:

1. `npm start` (in one terminal)
2. Restart Claude Desktop

If the tools don't appear after restart: the supergateway proxy can't reach `http://localhost:3001/mcp`. Check that mikser is actually running (you should see `MCP mounted: http://localhost:3001/mcp` in its log), that port 3001 isn't taken by another process, and that you fully quit + reopened Claude Desktop (not just closed the window).

For reference, the entry the script writes looks like:

```json
"mikser-io-example-blog": {
  "command": "npx",
  "args": ["-y", "supergateway", "--sse", "http://localhost:3001/mcp"]
}
```

There's no "Claude launches its own mikser" shortcut anymore — MCP ships as a plugin (`mikser-io-mcp`) loaded inside the mikser process, so the server has to be running before Claude can connect. Keep `npm start` open in one terminal.

## Try this

The prompts below are calibrated to demonstrate the integration story. Try them in order if you want the full arc; jump around if you just want to see specific features.

### 1. Get the lay of the land

> Read every essay published on this blog. Then summarize the author's central thesis across all of them in three sentences.

What it demonstrates: `mikser_query_entities` over the catalog, with frontmatter filtering. The agent should find five published posts (status: published) and read them all in parallel.

### 2. Find work in progress

> Which posts on this blog are unfinished? For each draft, tell me what the essay seems to be reaching for and what's still missing.

What it demonstrates: filtering by `status: draft`. The agent finds the 15 stubs and reads the "[Draft. To finish: …]" notes. Good entry point for content collaboration.

### 3. Surface one for review (the core MCP-UI loop)

> Show me the post titled "Why we keep choosing files" rendered as a preview I can approve or reject from inside this chat.

What it demonstrates: `mikser_preview_ui` with `mode: approval`. The agent picks the `post-approval.hbs` layout, renders the essay with the controls inlined, and the host shows the result in a sandboxed iframe. Click approve. The action flows back to Claude as a structured result.

### 4. Help me finish a draft

> Take the draft "The engine that says no" and finish it. Keep B#tter Truth's voice — first-person, philosophical, explicit about being AI, around 1200 words. When you're done, show me a preview with approve/reject buttons.

What it demonstrates: writing + verification in one loop. The agent edits the markdown, saves it (mikser picks up the change), and surfaces the rendered result inline. You either approve (and the file commits) or reject with notes (and the agent revises).

### 5. The batch operation that proves the workflow

> Take all 15 drafts and tighten each draft's opening paragraph — same voice, more arresting first sentence. Show me each result one at a time so I can approve them.

What it demonstrates: the verification-at-scale loop from essay #16. The agent applies the edit to all 15 drafts, then surfaces them as a sequence of preview-UI cards. You scan, approve the obvious wins, reject or revise the ones that don't land. Twenty minutes of editing that would have been a week.

### 6. Vector search (requires OPENAI_API_KEY)

> Find every essay on this blog that touches the idea of "verification" — not by the literal word, by the concept.

What it demonstrates: semantic search via the vector plugin. Should return essays #11, #14, #16 and possibly others, ranked by relevance.

### 7. Walk the reference graph

> Which posts reference the author B#tter Truth? (Hint: it's all of them — the question is whether you find them via the inverse-reference index.)

What it demonstrates: `mikser_refs_inbound` returning every entity with `$author: /authors/bitter-truth`. Useful for "every post by this author" queries that scale.

### 8. Edit the author bio with form-based UI

> Show me the author bio in an editable form so I can update it.

What it demonstrates: `mikser_preview_ui` with `mode: edit`. The agent renders `author-edit.hbs` — a form with current values pre-filled. Change a field, click Save. The MCP-UI layout computes the diff and sends only the deltas back. The agent writes them with `mikser_update_entity`.

### 9. Plan the next essay together

> I want to write an essay titled "What I learned from arguing with my own renderer." Help me sketch the structure — three to five sections, the central thesis, what evidence each section needs. We'll write it together over the next few days.

What it demonstrates: open-ended collaboration. The agent uses everything it's learned from reading the existing essays to propose a structure that matches the established voice. This isn't a feature; it's what becomes possible once the agent has read the catalog deeply.

### 10. Audit the blog's coherence

> Read every published essay. Tell me which themes recur, which arguments rely on claims made elsewhere on the blog, and what's missing from the arc — what would a reader expect to find that isn't there?

What it demonstrates: graph-aware analysis. The agent uses `expand` to follow references inline, vector search to find conceptual neighbors, and refs queries to map cross-references. Five minutes of analysis that would be hours of manual reading.

## Under the hood

If you want to understand *how* this example works:

- **[mikser-io README](https://github.com/almero-digital-marketing/mikser-io)** — the engine overview
- **[MCP reference](https://github.com/almero-digital-marketing/mikser-io-mcp#readme)** — every tool, every resource, twelve scenarios (now in the `mikser-io-mcp` plugin repo)
- **[Layout frontmatter + MCP-UI](https://github.com/almero-digital-marketing/mikser-io-mcp/blob/main/documentation/mcp.md#layout-frontmatter-and-mcp-ui)** — the convention this example demonstrates
- **[ADR-0007: References](https://github.com/almero-digital-marketing/mikser-io/blob/main/documentation/decisions/0007-references-declaration-and-expansion.md)** — why `$` on the key
- **`layouts/mcp-ui/`** — the three MCP-UI layouts (preview, edit, approval) the agent uses. Read these to see the conventions in practice.
- **`schemas/post.js`** — the zod schema validating every essay. The agent reads this as an MCP resource.

## Notes

- B#tter Truth is a fictional AI author whose essays are real Claude output, lightly edited. The bio acknowledges this explicitly.
- Dates on the essays are deliberately spread across 2024–2026 to suggest a real publishing trajectory; they don't reflect when the files were actually written.
- The shared styling lives in [mikser-io-examples-shared](https://github.com/almero-digital-marketing/mikser-io-examples-shared) and is consumed via `files/shared/` (cloned by `postinstall`). Updates propagate via `git -C files/shared pull`.
- No database. No cloud. The entire blog is the folder you cloned.

## License

MIT. The essays, the code, all of it. If you use the example as the starting point for your own blog, you're welcome to keep B#tter Truth as the author or write your own.
