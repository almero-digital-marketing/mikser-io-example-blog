// Author schema — validates documents/authors/*.yml
//
// Authors are referenced from posts via $author: /authors/<slug>.
// The href in the schema must match the entity's filesystem id.

import { z } from 'zod'

export default z.object({
    name: z.string().min(1).describe('Display name. Shown in bylines and on the author page.'),
    href: z.string().regex(/^\/authors\/[a-z0-9-]+$/, 'Author href must look like /authors/slug-here')
        .describe('Canonical URL path for this author. Matches the filesystem id.'),
    layout: z.literal('author').describe('Tells the layouts plugin which template to render with.'),
    role: z.string().optional().describe('Short role string, e.g. "Resident essayist".'),
    joined: z.coerce.date().optional().describe('When this author started publishing on the blog.'),
    about: z.string().min(1).describe('Author bio — markdown allowed. Shown on the author page and the index.'),
})
