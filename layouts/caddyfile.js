// Sidecar for caddyfile.hbs — renders a Caddy facade config from the
// engine's route registry (runtime.routes), via the shared facadeData
// helper. The Caddyfile is not special, it's a render target like HTML
// or PDF: registry in, template out. Want nginx instead? See nginx.js —
// same data, different template.
//
// Must render INLINE (no `task: worker` on the layout): runtime.routes
// is populated in the main process when plugins mount at onLoaded;
// render workers have a separate, empty runtime. Inline is the default.
//
// Routes only populate under `mikser --server` (or an embedded app) —
// a plain build has no listener, no mounts, an empty registry, and
// this renders a static-only Caddyfile. Correct: no server, nothing to
// proxy.

import { facadeData } from './facade-routes.js'

export async function load({ runtime }) {
    return facadeData(runtime)
}
