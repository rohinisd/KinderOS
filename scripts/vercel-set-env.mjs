#!/usr/bin/env node
/**
 * Set/replace Vercel production env vars via REST API.
 * Avoids the PowerShell pipe '\r\n' pollution issue with `vercel env add`.
 *
 * SECURITY: Reads ALL secrets from a local JSON config file (gitignored),
 * NEVER hardcoded. The repo only ships the script template.
 *
 * Setup:
 *   1. Copy scripts/vercel-env.config.example.json -> scripts/vercel-env.config.json
 *   2. Fill in the values (the file is gitignored).
 *   3. Run:  node scripts/vercel-set-env.mjs --token=vcp_xxx
 *
 * Reads:
 *   - VERCEL_TOKEN env var or --token=<value> arg
 *   - .vercel/project.json (created by `vercel link`)
 *   - scripts/vercel-env.config.json (gitignored, you create it)
 */

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const root = join(__dirname, '..')

// --- Args
const args = process.argv.slice(2)
let token = process.env.VERCEL_TOKEN
let target = 'production'
for (const a of args) {
  if (a.startsWith('--token=')) token = a.slice(8)
  else if (a.startsWith('--target=')) target = a.slice(9)
}
if (!token) {
  console.error('Provide VERCEL_TOKEN env var or --token=vcp_... arg')
  process.exit(1)
}

// --- Project info
const projectFile = join(root, '.vercel', 'project.json')
let projectId, orgId
try {
  const j = JSON.parse(readFileSync(projectFile, 'utf8'))
  projectId = j.projectId
  orgId = j.orgId
} catch {
  console.error('Could not read .vercel/project.json. Run `vercel link` first.')
  process.exit(1)
}
const teamQ = orgId ? `?teamId=${orgId}` : ''

// --- Vars to upsert (from local config, NEVER hardcoded)
const configFile = join(__dirname, 'vercel-env.config.json')
if (!existsSync(configFile)) {
  console.error(`Missing ${configFile}`)
  console.error('Copy scripts/vercel-env.config.example.json -> scripts/vercel-env.config.json and fill in your secrets.')
  process.exit(1)
}
let VARS
try {
  VARS = JSON.parse(readFileSync(configFile, 'utf8'))
} catch (e) {
  console.error(`Could not parse ${configFile}: ${e.message}`)
  process.exit(1)
}
if (typeof VARS !== 'object' || Array.isArray(VARS)) {
  console.error('Config must be a JSON object of { KEY: "value" }.')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
}

async function listExisting() {
  const url = `https://api.vercel.com/v9/projects/${projectId}/env${teamQ}`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`List failed: ${res.status} ${await res.text()}`)
  const json = await res.json()
  return json.envs || []
}

async function deleteEnv(id) {
  const url = `https://api.vercel.com/v9/projects/${projectId}/env/${id}${teamQ}`
  const res = await fetch(url, { method: 'DELETE', headers })
  if (!res.ok && res.status !== 404) {
    throw new Error(`Delete failed: ${res.status} ${await res.text()}`)
  }
}

async function createEnv(key, value) {
  const url = `https://api.vercel.com/v10/projects/${projectId}/env${teamQ}`
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      key,
      value,
      type: 'encrypted',
      target: [target],
    }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Create ${key} failed: ${res.status} ${text}`)
  return JSON.parse(text)
}

console.log(`Project: ${projectId}, Team: ${orgId || '(personal)'}, Target: ${target}`)
console.log('Listing existing env vars...')
const existing = await listExisting()
const existingByKey = new Map()
for (const e of existing) {
  if (!e.target?.includes(target)) continue
  if (!existingByKey.has(e.key)) existingByKey.set(e.key, [])
  existingByKey.get(e.key).push(e)
}

for (const [key, value] of Object.entries(VARS)) {
  if (typeof value !== 'string') {
    console.warn(`  ! ${key} skipped (value must be a string)`)
    continue
  }
  const conflicts = existingByKey.get(key) || []
  for (const c of conflicts) {
    process.stdout.write(`  - removing existing ${key} (${c.id.slice(0, 12)})... `)
    await deleteEnv(c.id)
    console.log('OK')
  }
  const display = value.length > 40 ? value.slice(0, 8) + '...(redacted)' : value
  process.stdout.write(`  + setting ${key} = "${display}"... `)
  await createEnv(key, value)
  console.log('OK')
}

console.log('\nAll env vars upserted. Trigger a redeploy to apply: `vercel --prod --yes`')
