// Sidecar for index.hbs — loads + paginates post entities at build time.
//
// Note: the SDK's `paginator` helper does client-side pagination
// (one HTTP request per nav action). It's not the right tool here —
// SSG sidecars run inside mikser with the catalog already in memory,
// and the layouts plugin renders all pages at build time. So we just
// chunk the in-memory array.

const PAGE_SIZE = 6

export async function load({ findEntities }) {
    const all = await findEntities()

    const allPosts = all
        .filter(e => e.meta?.layout === 'post')
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

    return { posts, pages, pageNumbers }
}
