// Skill categories live in categories.json — the single source of truth, also
// read by website/sidebars.ts. Each skills/<name>/metadata.json `category` must
// be one of these slugs; the order is the order of the catalog sections and of
// the website sidebar.
import { readFileSync } from 'node:fs';

export const CATEGORIES = JSON.parse(
  readFileSync(new URL('./categories.json', import.meta.url), 'utf8'),
);
