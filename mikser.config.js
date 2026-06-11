// mikser.config.js — blog example
//
// Plugin set chosen to demonstrate the AI agent integration story:
//   - mcp: AI agent transport — substrate + tools (must load FIRST so
//     other plugins' onLoaded gates on runtime.options.mcp pass)
//   - front-matter + yaml: parse the YAML at the top of every .md / .yml
//   - layouts + render-hbs + render-markdown + render-file: render essays
//     to HTML. render-file gives us {{readFile}} for inlining shared CSS
//     into MCP-UI layouts (sandbox-safe).
//   - preview: in-memory render cache + GET /preview/:filename route.
//     mikser-io-mcp's mikser_preview_ui / mikser_ui_action tools sit on
//     top of this cache.
//   - schemas: zod schemas for posts + authors, surfaced to the agent
//   - vector: semantic search over essays (requires OPENAI_API_KEY)

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
        // MCP MUST be first — its factory creates runtime.options.mcp
        // synchronously so plugins listed after it can register tools
        // at their own onLoaded with `if (!runtime.options.mcp) return`.
        'mcp',
        'documents',
        'files',
        'layouts',
        'assets',
        'front-matter',
        'yaml',
        'render-hbs',
        'render-markdown',
        'render-file',
        // api: exposes the catalog over HTTP and SSE. The rendered
        // public pages use mikser-io-sdk-api via /api/public/entities/
        // subscribe to live-reload when content changes.
        //
        // Only loaded when --server is active (it needs the Express
        // app the engine creates). Static builds (`mikser` with no
        // --server) skip it cleanly.
        ...(runtime.options.server ? ['api'] : []),
        // Vector is opt-in: only loads when OPENAI_API_KEY is set.
        // Without it, "find essays about X" prompts degrade to nothing —
        // everything else (preview-ui, refs, batch edit) still works.
        ...(process.env.OPENAI_API_KEY ? ['vector'] : []),
        'preview',
        // Note: mikser-io-schemas would normally load here and
        // surface zod schemas as MCP resources for agent introspection.
        // It's intentionally omitted from this example because its
        // onValidate hook fires at entity-create time, BEFORE the
        // front-matter plugin populates meta — so meta.layout is
        // undefined and validation can't match. Until that lifecycle
        // ordering is resolved, including the plugin produces noisy
        // "schema never matched" warnings without delivering value.
        // The schemas files in schemas/ are kept for reference.
    ],

    api: {
        base: '/api',
        pageSize: 50,
        endpoints: {
            // Public read-only endpoint with SSE enabled. Exposes every
            // catalog entity (no filter); the SDK in the browser uses
            // it for live-reload-on-change. No token = open; safe here
            // because the engine only listens on loopback.
            public: {
                query: () => true,
                operations: ['list', 'subscribe'],
            },
        },
    },

    layouts: {
        // Each entity declares its own `layout: <name>` in frontmatter
        // (post / author / index). autoLayouts stays on as a fallback
        // for anything we forgot.
        autoLayouts: true,
        cleanUrls: true,
    },

    documents: {
        documentsFolder: 'documents',
    },

    files: {
        filesFolder: 'files',
    },

    // schemas config kept here for the day the plugin is re-enabled.
    // schemas: {
    //     schemaKey: 'meta.layout',
    //     schemas: {
    //         post:   './schemas/post.js',
    //         author: './schemas/author.js',
    //     },
    // },

    vector: {
        // Vector search via sqlite-vec (zero infra). Falls back gracefully
        // when OPENAI_API_KEY is missing — the index just stays empty.
        client: 'better-sqlite3',
        openai: {
            apiKey: process.env.OPENAI_API_KEY,
        },
        stores: {
            essays: {
                // Only index published posts in the blog collection — drafts
                // and authors stay out of the search surface.
                query: e =>
                    e.collection === 'documents'
                    && e.id?.startsWith('/blog/')
                    && e.meta?.status === 'published',
                map: e => ({
                    // url is what the client-side search UI links to
                    // when it renders a result. Match the {{this.url}}
                    // shape the index template uses for the post list.
                    url:     '/' + e.name,
                    title:   e.meta?.title,
                    summary: e.meta?.summary,
                    tags:    e.meta?.tags,
                    content: e.content,
                }),
            },
        },
    },

    preview: {
        // 10 minute default TTL on cached previews. Bump if you keep
        // open tabs alive longer than that during a review session.
        defaultTtl: 600,
    },
})
