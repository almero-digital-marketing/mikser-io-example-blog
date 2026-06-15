// Sidecar for post.hbs — resolves the post's $author ref into the
// actual author entity so the byline shows real data (name + role)
// instead of a hardcoded string.
//
// The post's frontmatter has `$author: /authors/<slug>` which mikser's
// refs system tracks. At render time the value is a string on
// `entity.meta.$author`; this sidecar follows it via findEntity using
// the standard refs lookup keys (id, meta.href, id-without-extension —
// see ADR-0007 + mikser-io's refs.js). One findEntity call per post;
// the sidecar's query is auto-recorded in the render's track so any
// edit to the author entity invalidates the post snapshot, and the
// page re-renders on the next cycle.
//
// Cross-source demo highlight: the same lookup works for the local
// YAML author (matched via meta.href) AND for CSV-sourced authors
// (matched via id). Post templates don't know or care which source
// provided their author.

export async function load({ entity, findEntity }) {
    const ref = entity.meta?.$author
    if (!ref) return { author: null }

    const author = await findEntity({
        $or: [
            { id: ref },
            { 'meta.href': ref },
        ],
    })

    return { author: author ?? null }
}
