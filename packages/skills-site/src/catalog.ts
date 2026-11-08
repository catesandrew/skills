import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join, relative, sep} from 'node:path';
import type {Catalog, SkillEntry} from './types';

const SKIP = new Set(['node_modules', '.git', '.DS_Store']);

function summarize(abstract: string): string {
  const first = abstract.split(/(?<=\.)\s/)[0] ?? abstract;
  return first.length > 170 ? `${first.slice(0, 167).trimEnd()}…` : first;
}

function listFiles(root: string, dir = root): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, {withFileTypes: true})) {
    if (SKIP.has(e.name)) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(root, full));
    else if (e.isFile()) out.push(relative(root, full).split(sep).join('/'));
  }
  return out.sort();
}

export function loadCatalog(repoRoot: string, o: {
  installTemplate: string;
  docsBase: string;
  skillsDir: string;
  categoriesFile: string;
}): Catalog {
  const titles = new Map<string, string>(
    (JSON.parse(readFileSync(join(repoRoot, o.categoriesFile), 'utf8')) as {slug: string; title: string}[]).map(
      (c) => [c.slug, c.title],
    ),
  );
  const skills: SkillEntry[] = [];
  const skillsRoot = join(repoRoot, o.skillsDir);
  for (const e of readdirSync(skillsRoot, {withFileTypes: true})) {
    const metaPath = join(skillsRoot, e.name, 'metadata.json');
    if (!e.isDirectory() || !existsSync(metaPath)) continue;
    const {abstract = '', category} = JSON.parse(readFileSync(metaPath, 'utf8'));
    skills.push({
      name: e.name,
      category,
      categoryTitle: titles.get(category) ?? category,
      summary: summarize(abstract),
      abstract,
      files: listFiles(join(skillsRoot, e.name)),
    });
  }
  skills.sort((a, b) => a.name.localeCompare(b.name));
  const counts = new Map<string, number>();
  for (const s of skills) counts.set(s.category, (counts.get(s.category) ?? 0) + 1);
  const categories = [...titles]
    .filter(([slug]) => counts.has(slug))
    .map(([slug, title]) => ({slug, title, count: counts.get(slug)!}));
  return {skills, categories, installTemplate: o.installTemplate, docsBase: o.docsBase, zipBase: '/skills-zips/'};
}
