import fieldManualLight from './src/prism/field-manual-light';
import fieldManualDark from './src/prism/field-manual-dark';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import {loadCategories, loadSkills} from './skills-data';

const skills = loadSkills();
const categories = loadCategories();

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'skills',
  tagline: `${skills.length} cross-agent skills for Claude Code, Codex, and other AI coding agents.`,
  customFields: {skills, categories},
  favicon: 'img/favicon.svg',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here.
  url: 'https://skills.catesworks.dev',
  baseUrl: '/',

  organizationName: 'catesandrew', // Usually your GitHub org/user name.
  projectName: 'skills', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {mermaid: true},

  plugins: [
    ['@cogs/skills-site/plugin', {installTemplate: 'skills add -g catesandrew/skills --skill skills/{name}'}],
  ],
  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        indexBlog: false,
        docsRouteBasePath: '/docs',
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/catesandrew/skills/tree/main/website/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'skills',
      logo: {
        alt: 'skills',
        src: 'img/logo.svg',
        srcDark: 'img/logo-dark.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/skills',
          label: 'Skills',
          position: 'left',
        },
        {
          type: 'search',
          position: 'right',
        },
        {
          href: 'https://github.com/catesandrew/skills',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started',
            },
            {
              label: 'Find a skill',
              to: '/skills',
            },
            {
              label: 'Full catalog',
              to: '/docs/skills-catalog',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/catesandrew/skills',
            },
            {
              label: 'next-starters (sibling repo)',
              href: 'https://github.com/catesandrew/next-starters',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} skills. Released under the MIT License.`,
    },
    prism: {
      theme: fieldManualLight,
      darkTheme: fieldManualDark,
      additionalLanguages: ['bash', 'json', 'yaml', 'typescript', 'tsx', 'diff', 'markdown', 'python'],
    },
    // Both modes use mermaid's neutral 'base' theme; src/css/custom.css recolors the
    // rendered SVG from the site's CSS variables so diagrams follow light/dark.
    mermaid: {
      theme: {light: 'base', dark: 'base'},
      options: {
        themeVariables: {
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
          fontSize: '15px',
        },
        flowchart: {curve: 'basis', htmlLabels: true, padding: 12},
        sequence: {actorMargin: 20, width: 120, wrap: true, messageFontSize: 14, noteFontSize: 14, actorFontSize: 14},
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
