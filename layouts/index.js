// Sidecar for index.hbs — loads + paginates post entities at build time.
//
// Note: the SDK's `paginator` helper does client-side pagination
// (one HTTP request per nav action). It's not the right tool here —
// SSG sidecars run inside mikser with the catalog already in memory,
// and the layouts plugin renders all pages at build time. So we just
// chunk the in-memory array.

const PAGE_SIZE = 6

export async function load({ findEntities }) {
    // Scoped filter pushed down to SQL via the indexed meta_layout
    // column. The recorded query dep is precise — only entities with
    // meta.layout === 'post' will invalidate this aggregate, so adding
    // an asset, editing an author, or any other plugin's CREATE/UPDATE
    // won't re-render the index. Filter-after-fetch (findEntities()
    // with no args, then .filter() in JS) would record a null dep and
    // invalidate on every mutation — see documentation/entities.md
    // "Query filters and incremental invalidation".
    const allPosts = (await findEntities({ 'meta.layout': 'post' }))
        .map(e => ({ ...e, url: '/' + e.name }))
        .sort((a, b) => new Date(b.meta?.date ?? 0) - new Date(a.meta?.date ?? 0))

    const pages = Math.max(1, Math.ceil(allPosts.length / PAGE_SIZE))

    // Pre-slice by page. posts[0] is page 1's posts, posts[1] is
    // page 2's, etc. — index = entity.page - 1.
    const posts = []
    for (let p = 0; p < pages; p++) {
        posts.push(allPosts.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE))
    }

    const pageNumbers = []
    for (let p = 1; p <= pages; p++) {
        pageNumbers.push({ num: p, url: p === 1 ? '/' : `/${p}/` })
    }

    // Vector search is opt-in via OPENAI_API_KEY. When the key is
    // missing the vector plugin isn't loaded, the /vector endpoint
    // doesn't exist, and the search bar in the template stays hidden.
    // The blog itself works normally; only the semantic-search UI is
    // gated. A console warning at config load (see mikser.config.js)
    // tells the operator why search is off.
    const searchEnabled = Boolean(process.env.OPENAI_API_KEY)

    return { posts, pages, pageNumbers, searchEnabled }
}
