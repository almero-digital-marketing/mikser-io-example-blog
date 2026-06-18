// Sidecar for caddyfile.hbs — renders a Caddy facade config from the
// engine's route registry (runtime.routes).
//
// This is the "config as just another output" demo: the Caddyfile is
// not special, it's a render target like HTML or PDF. The route
// registry is the input, caddyfile.hbs is the recipe, mikser's render
// pipeline is the engine. Want nginx / Traefik / a systemd unit
// instead? Same registry, a different template — none of it is plugin
// code to maintain.
//
// Must render INLINE (no `task: worker` on the layout): runtime.routes
// is populated in the main process when plugins mount their routes at
// onLoaded; render workers have a separate, empty runtime. Inline is
// the default, so just don't opt this layout into the worker pool.
//
// Routes only populate when the plugins actually mount — i.e. under
// `mikser --server` (or an embedded Express app). A plain build has no
// listener, no mounts, an empty registry, and this renders a static-
// only Caddyfile. That's correct: no server, nothing to proxy.

export async function load({ runtime }) {
    const all  = runtime.routes ?? []
    const port = runtime.options.port ?? 3000

    return {
        // External origin for the site block. Public --url wins; falls
        // back to the local listener for dev.
        origin:       runtime.options.url ?? `http://localhost:${port}`,
        // Where Caddy forwards dynamic routes — the mikser listener.
        upstream:     `localhost:${port}`,
        // Static output is served straight from disk so the site
        // survives a mikser restart (the "outages don't take you down"
        // property).
        outputFolder: runtime.options.outputFolder,
        // Proxy only what's reachable from outside. loopback-only routes
        // (mcp, decap backend, …) are NEVER forwarded — they stay local.
        proxied:      all.filter(r => r.reachability !== 'loopback'),
        loopback:     all.filter(r => r.reachability === 'loopback'),
    }
}
