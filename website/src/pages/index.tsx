import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import styles from './index.module.css';

function HomepageHero() {
  return (
    <header className={styles.hero}>
      <div className="container">
        <Heading as="h1" className={styles.heroTitle}>
          52 cross-agent skills, one marketplace
        </Heading>
        <p className={styles.heroSubtitle}>
          Skills for Claude Code, Codex, and other AI coding agents,
          following the Agent Skills format. Stack-agnostic by design — the
          public, generic sibling of{' '}
          <Link to="https://github.com/catesandrew/next-starters">next-starters</Link>
          's own skills, which stay tightly coupled to its Next.js starter
          templates.
        </p>
        <CodeBlock language="text">
          {'/plugin marketplace add catesandrew/skills\n/plugin install cw@skills'}
        </CodeBlock>
        <div className={styles.heroCtas}>
          <Link className="button button--primary button--lg" to="/docs/getting-started">
            Get Started →
          </Link>
          <Link className="button button--secondary button--lg" to="/docs/skills-catalog">
            Browse Skills →
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <HomepageHero />
    </Layout>
  );
}
