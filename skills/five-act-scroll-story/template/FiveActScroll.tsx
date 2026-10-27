'use client';
// Five-act scroll story. Needs components/ScrollVideo.tsx (from
// scroll-video-site/references/scroll-video-engine.tsx) and story.json.
// Section is 100vh per act; clip-path clips the engine's fixed video to this
// section so it does not show below the story.
import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollVideo } from './ScrollVideo';
import story from '../story.json';
import { actAt } from './act-at'; // copy template/act-at.js alongside

gsap.registerPlugin(ScrollTrigger);

const acts = story.acts;

const seconds = acts.map((a) => a.seconds);

export function FiveActScroll() {
  // State, not a ref: the engine needs a re-render once the element exists.
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [act, setAct] = useState(0);
  const [still, setStill] = useState<boolean | null>(null);

  useEffect(() => {
    // Touch devices and reduced-motion users get stacked posters, not a scrubbed video.
    setStill(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        window.matchMedia('(pointer: coarse)').matches,
    );
  }, []);

  useEffect(() => {
    if (still !== false || !el) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => setAct(actAt(self.progress, seconds)),
    });
    return () => st.kill();
  }, [still, el]);

  if (still === null) return <section style={{ height: '100vh' }} />;

  if (still) {
    return (
      <section>
        {acts.map((a) => (
          <div
            key={a.title}
            style={{
              minHeight: '100vh',
              display: 'grid',
              alignItems: 'end',
              padding: '2rem',
              background: `center / cover url(${a.poster})`,
            }}
          >
            <p style={{ maxWidth: '28ch', fontSize: '1.5rem' }}>{a.caption}</p>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section
      ref={setEl}
      style={{ height: `${acts.length * 100}vh`, position: 'relative', clipPath: 'inset(0)' }}
    >
      <ScrollVideo src={story.video} trigger={el} />
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'grid',
          alignItems: 'end',
          padding: '2rem',
          pointerEvents: 'none',
        }}
      >
        <p key={act} aria-live="polite" style={{ maxWidth: '28ch', fontSize: '1.5rem' }}>
          {acts[act].caption}
        </p>
      </div>
    </section>
  );
}
