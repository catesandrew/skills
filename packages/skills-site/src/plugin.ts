import {mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {zipSync} from 'fflate';
import type {LoadContext, Plugin} from '@docusaurus/types';
import {loadCatalog} from './catalog';
import type {Catalog, SkillsSiteOptions} from './types';

/**
 * Exposes the skills catalog as plugin global data (`usePluginData('skills-site')`)
 * and writes one `<name>.zip` per skill into `<site>/static/skills-zips/` so the
 * dev server and the production build both serve them. The folder is generated:
 * gitignore it.
 */
export default function skillsSitePlugin(context: LoadContext, options: SkillsSiteOptions): Plugin<Catalog> {
  const repoRoot = join(context.siteDir, '..');
  const skillsDir = options.skillsDir ?? 'skills';
  const zipDir = join(context.siteDir, 'static', 'skills-zips');
  return {
    name: 'skills-site',
    async loadContent() {
      const catalog = loadCatalog(repoRoot, {
        installTemplate: options.installTemplate,
        docsBase: options.docsBase ?? '/docs/skills/',
        skillsDir,
        categoriesFile: options.categoriesFile ?? 'bin/lib/categories.json',
      });
      rmSync(zipDir, {recursive: true, force: true});
      mkdirSync(zipDir, {recursive: true});
      for (const s of catalog.skills) {
        const entries: Record<string, Uint8Array> = {};
        for (const f of s.files) entries[`${s.name}/${f}`] = readFileSync(join(repoRoot, skillsDir, s.name, f));
        writeFileSync(join(zipDir, `${s.name}.zip`), zipSync(entries));
      }
      return catalog;
    },
    async contentLoaded({content, actions}) {
      actions.setGlobalData(content);
    },
    getPathsToWatch() {
      return [join(repoRoot, skillsDir, '**/*'), join(repoRoot, options.categoriesFile ?? 'bin/lib/categories.json')];
    },
  };
}
