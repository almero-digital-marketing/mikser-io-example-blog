// Shared facade data — the single source both the caddy and nginx
// templates render from. This is the demo's whole thesis made literal:
// ONE data shape (the route registry), N output formats. Add a Traefik
// or systemd template and it reads the same function.
//
// Not a layout — there's no facade-routes.hbs, so the layouts scan
// never treats this .js as a sidecar. It's just an importable helper
// the real sidecars (caddyfile.js, nginx.js) call.

export function facadeData(runtime) {
    const all  = runtime.routes ?? []
    const port = runtime.options.port ?? 3000
    const origin = runtime.options.url ?? `http://localhost:${port}`

    // server_name / listen for nginx wants the bare host, not the full
    // origin. Parse it out; fall back to a catch-all if the origin is
    // unparseable.
    let host = '_'
    try { host = new URL(origin).host } catch { /* keep catch-all */ }

    return {
        origin,
        host,
        // Where the proxy forwards dynamic routes — the mikser listener.
        upstream:     `localhost:${port}`,
        // Static output is served from disk so the site survives a
        // mikser restart ("outages don't take you down").
        outputFolder: runtime.options.outputFolder,
        // Proxy only what's reachable from outside. loopback-only routes
        // (mcp, decap backend, …) are NEVER forwarded — host-local only.
        proxied:      all.filter(r => r.reachability !== 'loopback'),
        loopback:     all.filter(r => r.reachability === 'loopback'),
    }
}
