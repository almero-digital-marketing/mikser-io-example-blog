// Browser-side live reload via mikser-io-sdk-api.
//
// Uses client.live() — the same primitive sdk-react / sdk-vue /
// sdk-svelte build on. live() handles the SSE protocol internally
// (init / heartbeat events are filtered; only real catalog changes
// surface as onChange calls), so we get the safe path for free
// instead of re-implementing event filtering against raw watch().
//
// Loaded via <script type="module" src="/live-reload.js"> from the
// public layouts. Quietly disables itself when no api endpoint is
// reachable (e.g. the production output served from a static host).

import { createClient } from 'https://esm.sh/mikser-io-sdk-api@3.3.0'

const docs = createClient({ baseUrl: location.origin }).entities('public')

// Debounce reloads — a single watcher rebuild can emit many onChange
// callbacks in quick succession. Collapse them to one reload after a
// short quiet window so the page only refreshes once per cycle.
let pending = null
function scheduleReload() {
    clearTimeout(pending)
    pending = setTimeout(() => location.reload(), 400)
}

// live(filter, onChange) calls onChange ONCE with the initial list,
// then again every time the matching set changes. The initial call is
// just "here's the current state" — not a reason to reload. Skip it.
let initialized = false
const dispose = docs.live(
    {},                              // empty filter — react to anything
    () => {
        if (!initialized) {
            initialized = true
            return
        }
        scheduleReload()
    },
    {
        onError: (err) => {
            // Server shutdown, no api endpoint, network blip, etc.
            // The page stays usable, just without auto-reload.
            console.debug('live-reload disconnected:', err.message)
        },
    },
)

// Close the SSE stream cleanly on navigation away — otherwise the
// connection can leak in tools that profile multiple tab loads.
window.addEventListener('beforeunload', dispose, { once: true })
