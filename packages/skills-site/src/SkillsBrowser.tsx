import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {ComponentType, CSSProperties, ReactNode} from 'react';
import type {Catalog, SkillEntry} from './types';
import styles from './SkillsBrowser.module.css';

// Muted hues so generated art sits inside a warm-paper theme instead of fighting it.
const HUES = [18, 32, 95, 150, 190, 215, 265, 330];
const hue = (s: string) => HUES[[...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % HUES.length];
const humanize = (name: string) => {
  const t = name.replace(/[-_]+/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** Generated stand-in for a thumbnail: category-tinted "slide" with the skill title. */
function Art({skill, large}: {skill: SkillEntry; large?: boolean}): ReactNode {
  return (
    <span className={`${styles.art} ${large ? styles.artLarge : ''}`} style={{'--h': hue(skill.category)} as CSSProperties} aria-hidden="true">
      <span className={styles.artKicker}>{skill.categoryTitle}</span>
      <span className={styles.artTitle}>{humanize(skill.name)}</span>
      <span className={styles.artName}>{skill.name}</span>
    </span>
  );
}

export type {Catalog} from './types';

/**
 * Deliberately imports nothing from Docusaurus: with pnpm, a second copy of
 * @docusaurus/core in this package breaks theme context. The host page passes in
 * what needs the site's own runtime (catalog, base-URL-resolved hrefs, Link).
 */
export type SkillsBrowserProps = {
  catalog: Catalog;
  zipHref: string;
  docsHref: string;
  Link: ComponentType<{to: string; className?: string; children?: ReactNode}>;
};

export default function SkillsBrowser({catalog, zipHref, docsHref, Link}: SkillsBrowserProps): ReactNode {
  const {skills, categories} = catalog;
  const install = (name: string) => catalog.installTemplate.replace('{name}', name);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [openName, setOpenName] = useState('');
  const [copied, setCopied] = useState('');
  const [canScroll, setCanScroll] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  // Restore shareable state from the URL (client only).
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setQuery(p.get('q') ?? '');
    const c = p.get('category') ?? '';
    setCategory(categories.some((x) => x.slug === c) ? c : '');
    const s = p.get('skill') ?? '';
    setOpenName(skills.some((x) => x.name === s) ? s : '');
  }, [categories, skills]);
  useEffect(() => {
    const p = new URLSearchParams();
    if (query) p.set('q', query);
    if (category) p.set('category', category);
    if (openName) p.set('skill', openName);
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [query, category, openName]);

  // "/" jumps to the search field, like the docs search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || (e.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Show the rail's "more" arrow only while there is something to scroll to.
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const update = () => setCanScroll(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    update();
    el.addEventListener('scroll', update, {passive: true});
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [categories]);

  const open = openName ? skills.find((s) => s.name === openName) : undefined;
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    document.documentElement.style.overflow = open ? 'hidden' : '';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [open]);
  const close = useCallback(() => {
    setOpenName('');
    opener.current?.focus();
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return skills.filter(
      (s) => (!category || s.category === category) && (!q || `${s.name} ${s.summary} ${s.categoryTitle}`.toLowerCase().includes(q)),
    );
  }, [skills, query, category]);

  const copy = async (name: string) => {
    try {
      await navigator.clipboard.writeText(install(name));
      setCopied(name);
      window.setTimeout(() => setCopied((c) => (c === name ? '' : c)), 1800);
    } catch {
      setCopied('');
    }
  };

  return (
    <main className={`container ${styles.page}`}>
      <h1 className={styles.title}>Skills</h1>
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
        <kbd className={styles.hint} aria-hidden="true">/</kbd>
      </label>

      <div className={styles.railWrap}>
        <div ref={railRef} role="group" aria-label="Filter by category" className={styles.rail}>
          <button type="button" aria-pressed={category === ''} onClick={() => setCategory('')}>
            All <span>{skills.length}</span>
          </button>
          {categories.map((c) => (
            <button key={c.slug} type="button" aria-pressed={category === c.slug} onClick={() => setCategory(category === c.slug ? '' : c.slug)}>
              {c.title} <span>{c.count}</span>
            </button>
          ))}
        </div>
        {canScroll && (
          <button type="button" className={styles.railMore} aria-label="Show more categories" onClick={() => railRef.current?.scrollBy({left: 320, behavior: 'smooth'})}>
            ›
          </button>
        )}
      </div>

      <p className={styles.status} role="status">
        {results.length === skills.length ? `Showing all ${skills.length} skills` : `${results.length} of ${skills.length} skills`}
        {copied ? ` · Copied install command for ${copied}` : ''}
      </p>

      {results.length === 0 ? (
        <div className={styles.empty}>
          <p>No skill matches your search.</p>
          <button type="button" className="button button--secondary" onClick={() => { setQuery(''); setCategory(''); searchRef.current?.focus(); }}>
            Clear search and filters
          </button>
        </div>
      ) : (
        <ul className={styles.grid}>
          {results.map((s) => (
            <li key={s.name}>
              <button
                type="button"
                className={styles.card}
                onClick={(e) => { opener.current = e.currentTarget; setOpenName(s.name); }}>
                <Art skill={s} />
                <span className={styles.cardName}>{s.name}</span>
                <span className={styles.cardSummary}>{s.summary}</span>
                <span className={styles.tag}>{s.categoryTitle}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="skill-dialog-title"
        onClose={() => setOpenName('')}
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
        {open && (
          <div className={styles.dialogBody}>
            <button type="button" className={styles.x} aria-label="Close" onClick={close}>×</button>
            <div className={styles.dialogHead}>
              <div>
                <span className={styles.tag}>{open.categoryTitle}</span>
                <h2 id="skill-dialog-title" className={styles.dialogTitle}>{humanize(open.name)}</h2>
                <button type="button" className={styles.nameChip} onClick={() => copy(open.name)} aria-label={`Copy skill name ${open.name}`}>
                  name: {open.name} <span aria-hidden="true">{copied === open.name ? '✓' : '⧉'}</span>
                </button>
                <blockquote className={styles.quote}>{open.abstract.split(/(?<=\.)\s/)[0]}</blockquote>
              </div>
              <Art skill={open} large />
            </div>
            {(() => {
              // The quote above is the first sentence; show only what follows it.
              const rest = open.abstract.slice((open.abstract.split(/(?<=\.)\s/)[0] ?? '').length).trim();
              return rest && <p className={styles.abstract}>{rest}</p>;
            })()}
            <h3 className={styles.h3}>Install</h3>
            <pre className={styles.code}><code>{install(open.name)}</code></pre>
            <h3 className={styles.h3}>Files ({open.files.length})</h3>
            <ul className={styles.files}>
              {open.files.map((f) => {
                const i = f.lastIndexOf('/') + 1;
                return (
                  <li key={f}>
                    <span>{f.slice(0, i)}</span>{f.slice(i)}
                  </li>
                );
              })}
            </ul>
            <div className={styles.actions}>
              <Link className="button button--secondary" to={`${docsHref}${open.name}`}>Read docs</Link>
              <a className="button button--secondary" href={`${zipHref}${open.name}.zip`} download>Download .zip</a>
              <button type="button" className="button button--primary" onClick={() => copy(open.name)}>
                {copied === open.name ? 'Copied' : 'Copy install'}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </main>
  );
}
