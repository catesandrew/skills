#!/usr/bin/env node
// check-skills — repo-wide lint for skills/*/. Exits 1 listing every problem.
//
// Checks, per skill (a skills/<name>/ directory containing a SKILL.md):
//   - metadata.json exists and parses
//   - metadata.json `category` is one of bin/lib/categories.mjs
//
// Usage:
//   node bin/check-skills.mjs

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { CATEGORIES } from './lib/categories.mjs';

const SKILLS_DIR = join(process.cwd(), 'skills');
const slugs = new Set(CATEGORIES.map((c) => c.slug));

const names = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(SKILLS_DIR, d.name, 'SKILL.md')))
  .map((d) => d.name)
  .sort();

const problems = [];
for (const name of names) {
  const path = join(SKILLS_DIR, name, 'metadata.json');
  if (!existsSync(path)) {
    problems.push(`${name}: missing metadata.json`);
    continue;
  }
  let meta;
  try {
    meta = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    problems.push(`${name}: metadata.json is not valid JSON (${e.message})`);
    continue;
  }
  if (!slugs.has(meta.category)) {
    problems.push(`${name}: category ${JSON.stringify(meta.category)} is not one of: ${[...slugs].join(', ')}`);
  }
}

if (problems.length > 0) {
  console.error('\n  check-skills: FAILED');
  for (const p of problems) console.error(`    - ${p}`);
  console.error('');
  process.exit(1);
}
console.log(`\n  check-skills: OK — ${names.length} skill(s)\n`);
