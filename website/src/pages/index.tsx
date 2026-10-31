import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type {Category, Skill} from '../../skills-data';

import styles from './index.module.css';

function HomepageHero({count}: {count: number}) {
  return (
    <header className={styles.hero}>
      <div className="container">
        <Heading as="h1" className={styles.heroTitle}>
          {count} skills for coding agents, each with a deep-dive page
        </Heading>
        <p className={styles.heroSubtitle}>
          For Claude Code, Codex and other agents that read the Agent Skills format. Every skill
          documents what it does, how to use it, and where it breaks.
        </p>
        <div className={styles.install}>
          <Tabs groupId="install" className={styles.installTabs}>
            <TabItem value="claude" label="Claude Code" default>
              <CodeBlock language="text">
                {'/plugin marketplace add catesandrew/skills\n/plugin install cw@skills'}
              </CodeBlock>
            </TabItem>
            <TabItem value="cli" label="Any agent (skills CLI)">
              <CodeBlock language="sh">{'skills add -g catesandrew/skills'}</CodeBlock>
            </TabItem>
          </Tabs>
        </div>
        <div className={styles.heroCtas}>
          <Link className="button button--primary button--lg" to="/skills">
            Find a skill
          </Link>
          <Link className="button button--secondary button--lg" to="/docs/getting-started">
            Getting started
          </Link>
        </div>
      </div>
    </header>
  );
}

function CategoryIndex({categories, skills}: {categories: Category[]; skills: Skill[]}) {
  const rows = categories
    .map((c) => ({c, items: skills.filter((s) => s.category === c.slug)}))
    .filter((r) => r.items.length > 0);
  return (
    <section className={styles.section} aria-labelledby="index-heading">
      <div className="container">
        <Heading as="h2" id="index-heading" className={styles.sectionTitle}>
          Browse by category
        </Heading>
        <ol className={styles.index}>
          {rows.map(({c, items}) => (
            <li key={c.slug} className={styles.indexRow}>
              <Link className={styles.indexLink} to={`/skills?category=${c.slug}`}>
                <span className={styles.indexTitle}>{c.title}</span>
                <span className={styles.indexCount}>{items.length}</span>
                <span className={styles.indexExamples}>
                  {items
                    .slice(0, 3)
                    .map((s) => s.name)
                    .join(' · ')}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function DeepDiveExcerpt() {
  return (
    <section className={styles.section} aria-labelledby="excerpt-heading">
      <div className="container">
        <Heading as="h2" id="excerpt-heading" className={styles.sectionTitle}>
          What a deep-dive page tells you
        </Heading>
        <div className={styles.excerpt}>
          <p className={styles.excerptSource}>
            <code>product-reveal-prompts</code> · Gotchas &amp; Invariants
          </p>
          <ul className={styles.excerptList}>
            <li>
              Generate the end frame from the start image, not from scratch. Otherwise the product
              and framing drift and the video morphs.
            </li>
            <li>
              Use <code>burst</code>, not <code>exploded</code>, for drinks and soft goods, or the
              product is torn apart.
            </li>
            <li>The background must be identical across every image, or the website shows seams.</li>
          </ul>
          <Link to="/docs/skills/product-reveal-prompts">Read the full page</Link>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const {skills, categories} = siteConfig.customFields as {skills: Skill[]; categories: Category[]};
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <HomepageHero count={skills.length} />
      <main>
        <CategoryIndex categories={categories} skills={skills} />
        <DeepDiveExcerpt />
      </main>
    </Layout>
  );
}
