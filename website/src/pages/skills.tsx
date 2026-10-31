import {useEffect, useMemo, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type {Category, Skill} from '../../skills-data';

import styles from './skills.module.css';

const installCommand = (name: string) => `skills add -g catesandrew/skills --skill skills/${name}`;

export default function Skills(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const {skills, categories} = siteConfig.customFields as {skills: Skill[]; categories: Category[]};
  const titleBySlug = useMemo(() => new Map(categories.map((c) => [c.slug, c.title])), [categories]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of skills) m.set(s.category, (m.get(s.category) ?? 0) + 1);
    return m;
  }, [skills]);
  const shownCategories = categories.filter((c) => (counts.get(c.slug) ?? 0) > 0);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [copied, setCopied] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Restore shareable state from the URL (client only).
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setQuery(p.get('q') ?? '');
    const c = p.get('category') ?? '';
    setCategory(counts.has(c) ? c : '');
  }, [counts]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (query) p.set('q', query);
    if (category) p.set('category', category);
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [query, category]);

  // "/" jumps to the search field, like the docs search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key !== '/' || el.closest('input, textarea, select, [contenteditable]')) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return skills.filter(
      (s) =>
        (!category || s.category === category) &&
        (!q || `${s.name} ${s.summary} ${titleBySlug.get(s.category) ?? ''}`.toLowerCase().includes(q)),
    );
  }, [skills, query, category, titleBySlug]);

  const copy = async (name: string) => {
    try {
      await navigator.clipboard.writeText(installCommand(name));
      setCopied(name);
      window.setTimeout(() => setCopied((c) => (c === name ? '' : c)), 1800);
    } catch {
      setCopied('');
    }
  };

  const clear = () => {
    setQuery('');
    setCategory('');
    searchRef.current?.focus();
  };

  return (
    <Layout title="Find a skill" description={`Search and filter all ${skills.length} skills.`}>
      <main className={`container ${styles.page}`}>
        <Heading as="h1" className={styles.title}>
          Find a skill
        </Heading>
        <div className={styles.controls}>
          <label className={styles.search}>
            <span className={styles.searchLabel}>Search {skills.length} skills</span>
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try “scroll”, “resume”, “playwright”"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className={styles.hint} aria-hidden="true">
              /
            </kbd>
          </label>
          <div role="group" aria-label="Filter by category" className={styles.chips}>
            <button type="button" aria-pressed={category === ''} onClick={() => setCategory('')}>
              All <span>{skills.length}</span>
            </button>
            {shownCategories.map((c) => (
              <button
                key={c.slug}
                type="button"
                aria-pressed={category === c.slug}
                onClick={() => setCategory(category === c.slug ? '' : c.slug)}>
                {c.title} <span>{counts.get(c.slug)}</span>
              </button>
            ))}
          </div>
        </div>

        <p className={styles.status} role="status">
          {results.length === skills.length
            ? `Showing all ${skills.length} skills`
            : `${results.length} of ${skills.length} skills`}
          {copied ? ` · Copied install command for ${copied}` : ''}
        </p>

        {results.length === 0 ? (
          <div className={styles.empty}>
            <p>No skill matches your search.</p>
            <button type="button" className="button button--secondary" onClick={clear}>
              Clear search and filters
            </button>
          </div>
        ) : (
          <ul className={styles.list}>
            {results.map((s) => (
              <li key={s.name} className={styles.row}>
                <div className={styles.name}>
                  <Link to={`/docs/skills/${s.name}`}>{s.name}</Link>
                  <span className={styles.category}>{titleBySlug.get(s.category)}</span>
                </div>
                <p className={styles.summary}>{s.summary}</p>
                <button
                  type="button"
                  className={styles.copy}
                  onClick={() => copy(s.name)}
                  aria-label={`Copy install command for ${s.name}`}>
                  {copied === s.name ? 'Copied' : 'Copy install'}
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className={styles.footnote}>
          Prefer one long page? See the <Link to="/docs/skills-catalog">full catalog</Link>.
        </p>
      </main>
    </Layout>
  );
}
