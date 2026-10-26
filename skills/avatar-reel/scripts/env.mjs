// Config + secret resolution. Secrets come only from 1Password:
//   1. env var already set to a real value
//   2. `op read` of the reference: <NAME>_OP_REF env, else an op://... value in .env, else the default
//      op://$OP_VAULT/<NAME>/$OP_FIELD (defaults: app-secrets, credential)
//   3. fail with a setup message (never prompt for the key).
// Resolved values live in memory only; use redact() on anything you print.
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const resolved = new Set()

// .env holds non-secret settings and op:// references. Process env wins over the file.
export function loadEnv(dirs = [process.cwd(), join(dirname(fileURLToPath(import.meta.url)), '..')]) {
  for (const dir of dirs) {
    const p = join(dir, '.env')
    if (!existsSync(p)) continue
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
      if (m && m[2] && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
    }
  }
}

export function fail(msg) {
  console.error(msg)
  process.exit(3)
}

export function secret(name) {
  const direct = process.env[name]
  const defaultRef = `op://${process.env.OP_VAULT || 'app-secrets'}/${name}/${process.env.OP_FIELD || 'credential'}`
  const ref = process.env[`${name}_OP_REF`] || (direct?.startsWith('op://') ? direct : '') || defaultRef
  if (direct && !direct.startsWith('op://')) { resolved.add(direct); return direct }
  const r = spawnSync(process.env.OP_BIN || 'op', ['read', '--no-newline', ref], { encoding: 'utf8' })
  if (r.error) fail(`1Password CLI \`op\` not found. Install it (brew install 1password-cli) and run scripts/setup.sh.`)
  if (r.status) fail(`\`op read\` failed for ${name} (${ref}). Run \`op whoami\`; sign in via the 1Password app integration or set OP_SERVICE_ACCOUNT_TOKEN. Check the reference path.`)
  resolved.add(r.stdout)
  return r.stdout
  if (optional) return ''
  fail(`${name} is not configured. Put \`${name}=op://<vault>/<item>/<field>\` in .env (see .env.tpl) or set ${name}_OP_REF. Do not paste the key into chat.`)
}

export const redact = (s) => [...resolved].reduce((t, v) => (v ? String(t).replaceAll(v, '***') : t), String(s))
