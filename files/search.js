// Client-side wiring for the semantic search bar on the index page.
//
// The vector plugin mounts POST /vector/:storeName when an Express app
// is available (i.e. mikser --server is running). Request body:
// { q: string, limit?: number }. Response: { results: [...] } where
// each result is whatever the store's map(entity) returned, plus a
// score field added by the vector plugin.
//
// For the blog the store is `essays` and the map returns
// { url, title, summary, tags, content } per post. We don't render
// content here — the title + summary + a click-through is enough.

const input = document.getElementById('search-input')
const results = document.getElementById('search-results')
const status = document.getElementById('search-status')

if (input && results) {
    let debounceTimer = null
    let lastQuery = ''

    input.addEventListener('input', () => {
        clearTimeout(debounceTimer)
        const q = input.value.trim()
        if (q === lastQuery) return
        if (q.length < 2) {
            results.innerHTML = ''
            if (status) status.textContent = ''
            lastQuery = q
            return
        }
        debounceTimer = setTimeout(() => search(q), 250)
    })

    async function search(q) {
        lastQuery = q
        if (status) status.textContent = 'Searching…'
        try {
            const res = await fetch('/vector/essays', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ q, limit: 8 }),
            })
            if (!res.ok) {
                const { error } = await res.json().catch(() => ({}))
                if (status) status.textContent = error ?? `Search failed (${res.status})`
                results.innerHTML = ''
                return
            }
            const { results: hits = [] } = await res.json()
            renderResults(hits)
        } catch (err) {
            if (status) status.textContent = `Network error: ${err.message}`
            results.innerHTML = ''
        }
    }

    function renderResults(hits) {
        if (!hits.length) {
            if (status) status.textContent = 'No matches.'
            results.innerHTML = ''
            return
        }
        if (status) status.textContent = `${hits.length} result${hits.length === 1 ? '' : 's'}.`
        results.innerHTML = hits.map(h => `
            <li>
                <a class="title" href="${h.url}">${escape(h.title ?? 'Untitled')}</a>
                ${h.summary ? `<p class="summary">${escape(h.summary)}</p>` : ''}
                ${h.tags?.length ? `<p class="tags">${h.tags.map(t => `<span class="tag">${escape(t)}</span>`).join(' ')}</p>` : ''}
            </li>
        `).join('')
    }

    function escape(s) {
        return String(s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
        }[c]))
    }
}
