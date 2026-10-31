import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

// Build-time source for the home page, the /skills finder and every count shown
// on the site. Reads the same files as sidebars.ts and bin/generate-skill-docs.mjs,
// so a count or description never needs to be edited by hand.

export type Category = {slug: string; title: string};
export type Skill = {name: string; category: string; summary: string};

const REPO_ROOT = join(__dirname, '..');

export function loadCategories(): Category[] {
  return JSON.parse(readFileSync(join(REPO_ROOT, 'bin', 'lib', 'categories.json'), 'utf8'));
}

// First sentence of the abstract, kept short enough to read in a card.
function summarize(abstract: string): string {
  const first = abstract.split(/(?<=\.)\s/)[0] ?? abstract;
  return first.length > 170 ? `${first.slice(0, 167).trimEnd()}…` : first;
}

export function loadSkills(): Skill[] {
  const skills: Skill[] = [];
  for (const entry of readdirSync(join(REPO_ROOT, 'skills'), {withFileTypes: true})) {
    const metaPath = join(REPO_ROOT, 'skills', entry.name, 'metadata.json');
    if (!entry.isDirectory() || !existsSync(metaPath)) continue;
    const {abstract = '', category} = JSON.parse(readFileSync(metaPath, 'utf8'));
    skills.push({name: entry.name, category, summary: summarize(abstract)});
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}
