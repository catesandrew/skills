#!/usr/bin/env node
// generate-skill-docs — scan skills/*/metadata.json + SKILL.md frontmatter
// and write website/docs/skills-catalog.md: a single markdown catalog page
// for the Docusaurus site, listing every skill with a one-line abstract, an
// auto-derived use-case line, and its install commands.
//
// A "real" skill is any skills/<name>/ directory containing a SKILL.md
// (same discovery filter as generate-marketplace.mjs / generate-skill-package-json.mjs).
//
// Usage:
//   node bin/generate-skill-docs.mjs           # regenerate website/docs/skills-catalog.md
//   node bin/generate-skill-docs.mjs --check   # CI: diff in-memory output against the committed file

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

// Resolved from process.cwd(), not this script's location — every real
// invocation runs from the repo root; cwd-relative resolution also keeps
// this script testable against an isolated fixture directory.
const ROOT = process.cwd();
const SKILLS_DIR = join(ROOT, 'skills');
const OUT_PATH = join(ROOT, 'website', 'docs', 'skills-catalog.md');
const DEEP_DIVE_DIR = join(ROOT, 'website', 'docs', 'skills');

const ABSTRACT_MAX_LEN = 200;
const USE_WHEN_PREFIX = 'Use when ';
const INSTALL_REPO = 'catesandrew/skills';

function fail(msg) {
  console.error(`\n  error: ${msg}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { check: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check') args.check = true;
    else fail(`unknown flag: ${a}`);
  }
  return args;
}

/** skills/<name>/ counts only if it contains a SKILL.md. Sorted for deterministic output. */
function listSkillNames() {
  if (!existsSync(SKILLS_DIR)) fail(`skills/ directory not found at ${SKILLS_DIR}`);
  return readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(SKILLS_DIR, d.name, 'SKILL.md')))
    .map((d) => d.name)
    .sort();
}

function readMetadata(skillName) {
  const path = join(SKILLS_DIR, skillName, 'metadata.json');
  if (!existsSync(path)) fail(`missing ${path}`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * Extracts the SKILL.md frontmatter `description` field. Handles both forms
 * used across this repo's skills:
 *   - a single-line plain scalar: `description: Use when ...`
 *   - a folded block scalar:      `description: >-` followed by indented
 *     continuation line(s), which are folded into one space-joined string.
 */
function parseFrontmatterDescription(skillMd, skillName) {
  const fmMatch = skillMd.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) fail(`skills/${skillName}/SKILL.md has no --- frontmatter block`);
  const lines = fmMatch[1].split('\n');
  const idx = lines.findIndex((l) => /^description:/.test(l));
  if (idx === -1) fail(`skills/${skillName}/SKILL.md frontmatter has no "description" field`);

  const rest = lines[idx].slice('description:'.length).trim();
  if (rest === '' || rest === '>-' || rest === '>' || rest === '|-' || rest === '|') {
    // Folded/literal block scalar — gather the indented continuation lines.
    const collected = [];
    for (let i = idx + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === '' || !/^\s/.test(line)) break;
      collected.push(line.trim());
    }
    const value = collected.join(' ').trim();
    if (!value) fail(`skills/${skillName}/SKILL.md has an empty block-scalar "description"`);
    return value;
  }

  let value = rest;
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return value;
}

/**
 * Most skills in this repo start their description with "Use when ". Where
 * that holds, the use case is whatever comes after that up to (not
 * including) the first sentence-ending period — a period followed by
 * whitespace or end-of-string, excluding `e.g.`/`i.e.` abbreviations.
 * A handful of skills (e.g. session-wrap) lead with a summary sentence
 * instead and only mention "Use when"/"Use at" later — for those, fall back
 * to the truncated raw description rather than hard-failing, since the
 * prefix convention isn't enforced repo-wide the way it is in next-starters.
 */
function deriveUseCase(description, skillName) {
  if (!description.startsWith(USE_WHEN_PREFIX)) {
    return truncateAbstract(description);
  }
  const after = description.slice(USE_WHEN_PREFIX.length);
  const match = after.match(/(?<!\be\.g)(?<!\bi\.e)\.(?=\s|$)/i);
  const useCase = match ? after.slice(0, match.index) : after;
  if (!useCase.trim()) {
    fail(`skills/${skillName}/SKILL.md description has no text between "${USE_WHEN_PREFIX}" and the first sentence-ending period`);
  }
  return useCase.trim();
}

/** Truncates on a word boundary and appends an ellipsis; never mid-word. */
function truncateAbstract(text) {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= ABSTRACT_MAX_LEN) return flat;
  const cut = flat.slice(0, ABSTRACT_MAX_LEN);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : ABSTRACT_MAX_LEN)}…`;
}

/** Escapes markdown table-cell-breaking characters: pipes and hard line breaks. */
function escapeCell(text) {
  return text.replace(/\s+/g, ' ').trim().replace(/\|/g, '\\|');
}

function installCommand(skillName) {
  return `skills add -g ${INSTALL_REPO} --skill skills/${skillName}`;
}

function buildCatalog(skillNames) {
  const rows = skillNames.map((name) => {
    const metadata = readMetadata(name);
    const skillMd = readFileSync(join(SKILLS_DIR, name, 'SKILL.md'), 'utf8');
    const description = parseFrontmatterDescription(skillMd, name);
    const useCase = deriveUseCase(description, name);
    const abstract = truncateAbstract(metadata.abstract || '');
    return { name, abstract, useCase, install: installCommand(name) };
  });

  const lines = [];
  lines.push('# Skill Catalog');
  lines.push('');
  lines.push(
    `This page is auto-generated by \`bin/generate-skill-docs.mjs\` from every skill under \`skills/*/SKILL.md\`. Do not edit by hand — regenerate with \`node bin/generate-skill-docs.mjs\`.`,
  );
  lines.push('');
  lines.push(`${rows.length} skills available.`);
  lines.push('');
  lines.push('| Skill | What it\'s for | Use case | Install | Deep dive |');
  lines.push('|---|---|---|---|---|');
  for (const row of rows) {
    const install = `\`${row.install}\``;
    const deepDive = `[Read more](/docs/skills/${row.name})`;
    lines.push(`| ${escapeCell(row.name)} | ${escapeCell(row.abstract)} | ${escapeCell(row.useCase)} | ${install} | ${deepDive} |`);
  }
  lines.push('');
  return lines.join('\n');
}

function runGenerate(skillNames) {
  const output = buildCatalog(skillNames);
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, output);
  console.log(`\n  generate-skill-docs`);
  console.log(`  skills:  ${skillNames.length}`);
  console.log(`  out:     ${OUT_PATH.slice(ROOT.length + 1)}`);
  console.log('\n  Done.\n');
}

function runCheck(skillNames) {
  const output = buildCatalog(skillNames);
  if (!existsSync(OUT_PATH)) {
    fail(`${OUT_PATH.slice(ROOT.length + 1)} does not exist — run \`node bin/generate-skill-docs.mjs\` first`);
  }
  const existing = readFileSync(OUT_PATH, 'utf8');
  if (existing !== output) {
    console.error(`\n  generate-skill-docs --check: FAILED`);
    console.error(`  website/docs/skills-catalog.md is stale — run \`node bin/generate-skill-docs.mjs\` and commit the result.\n`);
    process.exit(1);
  }

  const missingPages = skillNames.filter(
    (name) => !existsSync(join(DEEP_DIVE_DIR, `${name}.md`)),
  );
  if (missingPages.length > 0) {
    console.error(`\n  generate-skill-docs --check: FAILED`);
    console.error(`  missing deep-dive page(s) under website/docs/skills/:`);
    for (const name of missingPages) console.error(`    - ${name}.md`);
    console.error('');
    process.exit(1);
  }

  console.log(`\n  generate-skill-docs --check: OK — ${skillNames.length} skill(s), website/docs/skills-catalog.md is in sync, all deep-dive pages present.\n`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const skillNames = listSkillNames();
  if (skillNames.length === 0) fail('no skills found under skills/*/SKILL.md');

  if (args.check) runCheck(skillNames);
  else runGenerate(skillNames);
}

main();
