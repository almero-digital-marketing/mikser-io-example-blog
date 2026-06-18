// Sidecar for nginx.hbs — the SAME facade data the caddy template uses,
// rendered to an nginx server block instead. The point of having both:
// one registry, one data helper, two outputs. Nothing here is mikser
// code — fork the template, keep the data.
//
// Inline render, --server only — same constraints as caddyfile.js.

import { facadeData } from './facade-routes.js'

export async function load({ runtime }) {
    return facadeData(runtime)
}
