// Post schema — validates frontmatter of every essay in documents/blog/
//
// The schemas plugin exposes this surface as an MCP resource at
// mikser://schemas/posts. An agent reading that resource learns what
// fields a new post needs without anyone writing tool-description text.
//
// Per ADR-0007 A6, ref validation is deferred: a broken $author
// surfaces as a warning (not an error) so the writer can save in
// flight. Only structural shape mismatches fail.

import { z } from 'zod'

export default z.object({
    // Required
    title:   z.string().min(1).describe('Headline for the essay. Appears in the page title and the index.'),
    date:    z.coerce.date().describe('Publication date. Used for ordering on the index page.'),
    $author: z.string().describe('Reference to an author entity (e.g. /authors/bitter-truth). The $ on the key marks this as a reference.'),
    layout:  z.literal('post').describe('Tells the layouts plugin which template to render with.'),

    // Recommended
    summary: z.string().min(1).optional()
        .describe('Two-or-three-sentence pitch shown on the index page. Drafts often skip this.'),
    tags:    z.array(z.string()).optional()
        .describe('Topic tags. Used for filtering and as input to the vector index.'),

    // Lifecycle
    status:  z.enum(['draft', 'published']).default('draft')
        .describe('draft: visible in the catalog and indexable by the agent, but not surfaced on the public index. published: rendered on the index.'),
})
