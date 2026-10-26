// Self-check for the secret resolver using a fake `op`; needs no 1Password account.
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, chmodSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'fakeop-'))
const op = join(dir, 'op')
writeFileSync(op, `#!/bin/sh\n[ "$1" = read ] || exit 2\ncase "$3" in op://v/i/ok) printf 's3cret-value';; *) echo nope >&2; exit 1;; esac\n`)
chmodSync(op, 0o755)

const run = (env, code) => spawnSync('node', ['--input-type=module', '-e',
  `import {secret,redact} from '${new URL('./env.mjs', import.meta.url).href}'; ${code}`],
  { encoding: 'utf8', env: { PATH: process.env.PATH, OP_BIN: op, ...env } })

test('env var wins over op', () => {
  const r = run({ K: 'direct', K_OP_REF: 'op://v/i/ok' }, 'console.log(secret("K"))')
  assert.equal(r.stdout.trim(), 'direct')
})
test('op:// reference (value or _OP_REF) is resolved via op read', () => {
  assert.equal(run({ K: 'op://v/i/ok' }, 'console.log(secret("K"))').stdout.trim(), 's3cret-value')
  assert.equal(run({ K_OP_REF: 'op://v/i/ok' }, 'console.log(secret("K"))').stdout.trim(), 's3cret-value')
})
test('redact masks resolved values', () => {
  const r = run({ K_OP_REF: 'op://v/i/ok' }, 'secret("K"); console.log(redact("token s3cret-value used"))')
  assert.equal(r.stdout.trim(), 'token *** used')
})
test('default reference is op://app-secrets/<NAME>/credential, overridable via OP_VAULT/OP_FIELD', () => {
  assert.equal(run({}, 'console.log(secret("i"))').stderr.includes('op://app-secrets/i/credential'), true)
  assert.equal(run({ OP_VAULT: 'v', OP_FIELD: 'ok' }, 'console.log(secret("i"))').stdout.trim(), 's3cret-value')
})
test('failing op fails with guidance, never prompt, never echoes op stderr', () => {
  const b = run({ K_OP_REF: 'op://v/i/bad' }, 'secret("K")')
  assert.equal(b.status, 3); assert.match(b.stderr, /op read.*failed/); assert.ok(!b.stderr.includes('nope'))
})
test('python resolver matches', () => {
  const r = spawnSync('python3', ['-I', '-c', `import sys; sys.path.insert(0, ${JSON.stringify(new URL('.', import.meta.url).pathname)}); import importlib.util as u; s=u.spec_from_file_location('t','transcribe.py'); m=u.module_from_spec(s); s.loader.exec_module(m); print(m.secret('K'))`],
    { encoding: 'utf8', cwd: new URL('.', import.meta.url).pathname, env: { PATH: process.env.PATH, OP_BIN: op, K_OP_REF: 'op://v/i/ok' } })
  assert.equal(r.stdout.trim(), 's3cret-value')
})
