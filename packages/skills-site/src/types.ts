export type SkillEntry = {
  name: string;
  category: string;
  categoryTitle: string;
  /** First sentence of the abstract, short enough for a card. */
  summary: string;
  abstract: string;
  /** Paths relative to the skill folder, sorted. These are exactly the files in the zip. */
  files: string[];
};

export type CategoryEntry = {slug: string; title: string; count: number};

export type Catalog = {
  skills: SkillEntry[];
  categories: CategoryEntry[];
  /** Contains `{name}`, e.g. `skills add -g owner/repo --skill skills/{name}`. */
  installTemplate: string;
  /** Docs page per skill is `${docsBase}${name}`. */
  docsBase: string;
  /** Zip per skill is `${zipBase}${name}.zip` (under the site's static dir). */
  zipBase: string;
};

export type SkillsSiteOptions = {
  installTemplate: string;
  docsBase?: string;
  /** Relative to the repo root (the parent of the Docusaurus site dir). */
  skillsDir?: string;
  categoriesFile?: string;
};
