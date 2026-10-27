import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

// Skill pages are grouped by the `category` in each skills/<name>/metadata.json,
// in the order given by bin/lib/categories.json (also used by the catalog page).
const REPO_ROOT = join(__dirname, '..');
const categories: {slug: string; title: string}[] = JSON.parse(
  readFileSync(join(REPO_ROOT, 'bin', 'lib', 'categories.json'), 'utf8'),
);

const skillsBySlug = new Map<string, string[]>(categories.map((c) => [c.slug, []]));
for (const entry of readdirSync(join(REPO_ROOT, 'skills'), {withFileTypes: true})) {
  const metaPath = join(REPO_ROOT, 'skills', entry.name, 'metadata.json');
  if (!entry.isDirectory() || !existsSync(metaPath)) continue;
  const {category} = JSON.parse(readFileSync(metaPath, 'utf8'));
  const bucket = skillsBySlug.get(category);
  if (!bucket) throw new Error(`skills/${entry.name}/metadata.json: unknown category ${JSON.stringify(category)}`);
  bucket.push(`skills/${entry.name}`);
}

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'getting-started',
    'installing-plugin',
    'architecture',
    {
      type: 'category',
      label: 'Skills',
      link: {type: 'doc', id: 'skills-catalog'},
      items: categories
        .filter((c) => skillsBySlug.get(c.slug)!.length > 0)
        .map((c) => ({
          type: 'category' as const,
          label: c.title,
          collapsed: true,
          items: skillsBySlug.get(c.slug)!.sort(),
        })),
    },
  ],
};

export default sidebars;
