#!/usr/bin/env node
// scripts/register-mcp.js
//
// Idempotently register this example as an MCP server in Claude
// Desktop's config so the user doesn't have to paste JSON by hand.
//
// Usage:
//   node scripts/register-mcp.js              # register (or update)
//   node scripts/register-mcp.js --unregister # remove
//   node scripts/register-mcp.js --dry-run    # show what would change
//   node scripts/register-mcp.js --force      # overwrite differing entries
//   node scripts/register-mcp.js --name=X     # custom server label
//
// What it does
// ------------
// Connects Claude Desktop to a *running* mikser server via supergateway
// (an HTTP→stdio MCP proxy). That means:
//   1. You run `npm start` to keep mikser alive (watch + server + mcp).
//   2. Claude Desktop talks to that same mikser instance over HTTP,
//      so both your browser and Claude see the exact same catalog state.
//
// Alternative: edit the entry to launch mikser directly via stdio if
// you don't want to keep a separate process running. See the README.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { homedir, platform }                                  from 'node:os'
import { join, dirname, resolve }                             from 'node:path'
import { fileURLToPath }                                      from 'node:url'

const __dirname    = dirname(fileURLToPath(import.meta.url))
const projectRoot  = resolve(__dirname, '..')

const args         = process.argv.slice(2)
const flag         = (name) => args.some(a => a === name || a.startsWith(name + '='))
const value        = (name) => {
    const found = args.find(a => a.startsWith(name + '='))
    return found ? found.slice(name.length + 1) : undefined
}

// Read the package name as the default server label so two example
// projects don't collide in Claude's config.
const pkg          = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'))
const serverName   = value('--name') ?? pkg.name ?? 'mikser-io-example'
const unregister   = flag('--unregister')
const dryRun       = flag('--dry-run')
const force        = flag('--force')

// Locate Claude Desktop's config file per OS.
function configPath() {
    const home = homedir()
    switch (platform()) {
        case 'darwin': return join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
        case 'win32':  return join(process.env.APPDATA ?? join(home, 'AppData', 'Roaming'), 'Claude', 'claude_desktop_config.json')
        case 'linux':  return join(home, '.config', 'Claude', 'claude_desktop_config.json')
        default:       throw new Error(`register-mcp: unsupported platform "${platform()}"`)
    }
}

// The entry we want Claude Desktop to use. Connects via supergateway
// (npx-installed on demand) to the streamable-http endpoint mikser
// exposes at /mcp when --server is on and the mikser-io-mcp plugin is
// loaded (see this project's mikser.config.js). The mikser server has
// to be running for Claude to find anything; see README.
//
// Note: mikser uses StreamableHTTPServerTransport (the modern MCP SDK
// default), so we use --streamableHttp here. The earlier --sse flag
// is the OLD two-endpoint SSE transport and won't work with mikser.
const entry = {
    command: 'npx',
    args: [
        '-y',
        'supergateway',
        '--streamableHttp',
        'http://localhost:3001/mcp',
    ],
}

const path = configPath()
let config = {}
let configExisted = false

if (existsSync(path)) {
    configExisted = true
    try {
        config = JSON.parse(readFileSync(path, 'utf8'))
    } catch (err) {
        console.error(`! Existing Claude Desktop config at\n    ${path}\n  is not valid JSON. Refusing to overwrite — please fix it manually first.`)
        console.error(`  Error: ${err.message}`)
        process.exit(1)
    }
}

config.mcpServers = config.mcpServers || {}

if (unregister) {
    if (!(serverName in config.mcpServers)) {
        console.log(`✓ "${serverName}" is not registered. Nothing to do.`)
        process.exit(0)
    }
    if (dryRun) {
        console.log(`[dry-run] Would remove "${serverName}" from ${path}`)
        process.exit(0)
    }
    delete config.mcpServers[serverName]
    writeFileSync(path, JSON.stringify(config, null, 2) + '\n')
    console.log(`✓ Removed "${serverName}" from ${path}`)
    console.log(`  Restart Claude Desktop to apply.`)
    process.exit(0)
}

// Idempotent — bail early if already registered identically.
const existing = config.mcpServers[serverName]
if (existing && JSON.stringify(existing) === JSON.stringify(entry)) {
    console.log(`✓ "${serverName}" is already registered with the matching config.`)
    console.log(`  Nothing to change. (Use --force to re-write anyway.)`)
    process.exit(0)
}

if (existing && !force) {
    console.error(`! "${serverName}" is already registered but with a different config:`)
    console.error(`    ${JSON.stringify(existing)}`)
    console.error(`  Wanted:`)
    console.error(`    ${JSON.stringify(entry)}`)
    console.error(`  Re-run with --force to overwrite, or with --name=<new-label> to add as a separate entry.`)
    process.exit(1)
}

if (dryRun) {
    console.log(`[dry-run] Would ${existing ? 'overwrite' : 'add'} "${serverName}" in ${path}:`)
    console.log(JSON.stringify(entry, null, 2))
    process.exit(0)
}

config.mcpServers[serverName] = entry
mkdirSync(dirname(path), { recursive: true })
writeFileSync(path, JSON.stringify(config, null, 2) + '\n')

console.log(`✓ Registered "${serverName}" in`)
console.log(`    ${path}`)
console.log(`  ${configExisted ? '(merged into existing config)' : '(created new config file)'}`)
console.log()
console.log(`Next steps:`)
console.log(`  1. Make sure mikser is running:  npm start`)
console.log(`  2. Restart Claude Desktop (quit it fully, then reopen)`)
console.log(`  3. In Claude, you should see mikser tools — try:`)
console.log(`     "Use mikser_preview_ui to show me the post at`)
console.log(`     /documents/blog/2024-09-15-why-we-keep-choosing-files.md in approval mode"`)
console.log()
console.log(`To remove: npm run unregister-mcp`)
