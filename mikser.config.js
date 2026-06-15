// mikser.config.js — blog example
//
// Load local .env first so the env-var checks below pick up values
// from a project-local file without the operator needing to `export`
// in their shell. Silent if .env doesn't exist — the example works
// without any of the variables it documents.
import { fileURLToPath } from 'node:url'
try {
    process.loadEnvFile(fileURLToPath(new URL('./.env', import.meta.url)))
} catch { /* .env is optional */ }

// Plugin set chosen to demonstrate the AI agent integration story:
//   - mcp: AI agent transport — substrate + tools (must load FIRST so
//     other plugins' onLoaded gates on runtime.options.mcp pass)
//   - front-matter + yaml: parse the YAML at the top of every .md / .yml
//   - layouts + renderHbs + renderMarkdown + render-file: render essays
//     to HTML. render-file gives us {{readFile}} for inlining shared CSS
//     into MCP-UI layouts (sandbox-safe).
//   - preview: in-memory render cache + GET /preview/:filename route.
//     mikser-io-mcp's mikser_preview_ui / mikser_ui_action tools sit on
//     top of this cache.
//   - vector: semantic search over essays (requires OPENAI_API_KEY)
//
// v9 plugin shape per ADR-0010: factories imported by name, called with
// their options at the call site. Top-level config blocks are gone.

import {
    documents, files, assets,
    frontMatter, yaml, api, preview,
    renderHbs, renderFile,
} from 'mikser-io'
import { betterStack }    from 'mikser-io-better-stack'
import { layouts }        from 'mikser-io-layouts'
import { mcp }            from 'mikser-io-mcp'
import { ngrok }          from 'mikser-io-ngrok'
import { renderMarkdown } from 'mikser-io-render-markdown'
import { vector }         from 'mikser-io-vector'
import { csv }            from 'mikser-io-csv'
import { openai }         from '@ai-sdk/openai'

const BLOG_AUTHORS_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRMZbHc-vSxLwiV_muhABJ_VoQk6BUWgVeqQE3GQSfU377VFdMgIlhDhHcJaCtPpD-TJwXZ6vbP8ko8/pub?output=csv'

// Surface a clear warning when vector search can't load. The blog
// itself works without it — the search bar on the index page is
// hidden and the rest of the site renders normally — but the operator
// should know why search is off so they can set the env var if they
// want it.
if (!process.env.OPENAI_API_KEY) {
    console.warn(
        '\n⚠️  OPENAI_API_KEY not set — vector search is disabled.\n' +
        '   The blog still builds and runs normally, but the semantic\n' +
        '   search bar on the index page will be hidden. Set the env\n' +
        '   var (e.g. export OPENAI_API_KEY=sk-...) and re-run to enable.\n'
    )
}

export default async (runtime) => ({
    plugins: [
        // ngrok opens a tunnel to --server's local port and stamps the
        // public URL on runtime.options.url. Downstream plugins (mount
        // logs, MCP preview URLs, post-email tracking links, future
        // webhook receivers) pick it up automatically. Skips cleanly
        // when --server is off or NGROK_AUTHTOKEN is unset.
        ngrok(),

        // betterStack ships every mikser log line to Better Stack
        // Telemetry (via @logtail/pino) AND sends a heartbeat to
        // Better Stack Uptime so the dashboard knows mikser is alive.
        // Either surface is independent — set only BETTERSTACK_SOURCE_TOKEN
        // for logs, only BETTERSTACK_HEARTBEAT_TOKEN for uptime, or
        // both. With neither set, the plugin no-ops with an info log
        // line and doesn't affect anything else. Included here as a
        // smoke check that the no-token case is harmless.
        betterStack(),

        // MCP MUST be first — its factory creates runtime.options.mcp
        // synchronously so plugins listed after it can register tools
        // at their own onLoaded with `if (!runtime.options.mcp) return`.
        mcp(),
        documents({ documentsFolder: 'documents' }),
        files({ filesFolder: 'files' }),
        layouts({ autoLayouts: true, cleanUrls: true }),
        assets(),
        frontMatter(),
        yaml(),
        renderHbs(),
        renderMarkdown(),
        renderFile(),

        // api: exposes the catalog over HTTP and SSE. The rendered
        // public pages use mikser-io-sdk-api via /api/public/entities/
        // subscribe to live-reload when content changes. Only loaded
        // when --server is active (it needs the Express app the engine
        // creates). Static builds skip it cleanly.
        runtime.options.server && api({
            base: '/api',
            pageSize: 50,
            endpoints: {
                // Public read-only endpoint with SSE enabled. Exposes
                // every catalog entity (no filter); the SDK in the
                // browser uses it for live-reload-on-change. No token =
                // open; safe here because the engine only listens on
                // loopback.
                public: {
                    query: () => true,
                    operations: ['list', 'subscribe'],
                },
            },
        }),

        // Vector is opt-in: only loads when OPENAI_API_KEY is set.
        // Without it, "find essays about X" prompts degrade to nothing —
        // everything else (preview-ui, refs, batch edit) still works.
        process.env.OPENAI_API_KEY && vector({
            client: 'better-sqlite3',
            model: openai.embedding('text-embedding-3-small'),
            stores: {
                essays: {
                    // Only index published posts — drafts and authors
                    // stay out of the search surface. Same shape the
                    // index layout uses when listing posts
                    // ({ 'meta.layout': 'post' }).
                    query: e =>
                        e.meta?.layout === 'post'
                        && e.meta?.status === 'published',
                    map: e => ({
                        // url is what the client-side search UI links
                        // to when it renders a result. Match the
                        // {{this.url}} shape the index template uses for
                        // the post list.
                        url:     '/' + e.name,
                        title:   e.meta?.title,
                        summary: e.meta?.summary,
                        tags:    e.meta?.tags,
                        content: e.content,
                    }),
                },
            },
        }),

        // ── Cross-source demo ──────────────────────────────────────────
        // Authors live in TWO places:
        //   - documents/authors/bitter-truth.yml — local YAML, version-
        //     controlled with the blog itself.
        //   - The CSV at BLOG_AUTHORS_CSV — remote spreadsheet hosted
        //     anywhere (Google Sheets "Publish to web", GitHub raw,
        //     S3 — anything that returns text/csv). Editor team can
        //     manage these authors without touching the repo.
        //
        // Posts reference authors as `$author: /authors/<slug>` — refs
        // resolve by meta.href, so a post can name either source's
        // author with no plumbing.
        //
        // Skipped cleanly when the env var isn't set: the local author
        // (bitter-truth) still renders; existing posts authored by them
        // still link correctly; posts that reference a CSV-only author
        // get refs.broken warnings (the system tells you what's missing
        // without crashing).
        csv({
            match: {
                [BLOG_AUTHORS_CSV]: {
                    idColumn:   'slug',
                    collection: 'documents',
                    prefix:     '/authors/',
                    coerce:     true,
                    // Defaults merged into every row's meta. The CSV
                    // stays clean (just author data); the layout
                    // dispatch + href routing are operator-config, not
                    // per-row redundancy.
                    meta: {
                        layout: 'author',
                    },
                    pollIntervalMs: 30_000,    // 30s — fast feedback for the demo
                },
            },
        }),

        preview({
            // 10 minute default TTL on cached previews. Bump if you keep
            // open tabs alive longer than that during a review session.
            defaultTtl: 600,
        }),

        // Note: mikser-io-schemas would normally load here and surface
        // zod schemas as MCP resources for agent introspection. It's
        // intentionally omitted from this example because its
        // onValidate hook fires at entity-create time, BEFORE the
        // front-matter plugin populates meta — so meta.layout is
        // undefined and validation can't match. Until that lifecycle
        // ordering is resolved, including the plugin produces noisy
        // "schema never matched" warnings without delivering value.
        // The schemas files in schemas/ are kept for reference.
    ].filter(Boolean),
})
