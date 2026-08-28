// Reference implementation of the ScrollVideo engine described in
// SKILL.md and scroll-video-engine.md. Adapt to the target repo's stack —
// this assumes React + GSAP (with ScrollTrigger registered elsewhere) and a
// video already reachable at `src`.
//
// Usage:
//   <ScrollVideo src="/media/hero.mp4" pinTarget={containerRef} />
//
// The component maps the *entire document's* scroll progress to the video's
// currentTime by default; pass a narrower ScrollTrigger config via
// `trigger`/`start`/`end` to scrub only within a section instead.

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const DAMPING_RATE = 10; // higher = snappier, lower = smoother/laggier
const SEEK_THRESHOLD = 0.08; // seconds

export interface ScrollVideoProps {
  src: string;
  trigger?: string | Element | null;
  start?: string;
  end?: string;
  className?: string;
}

export function ScrollVideo({
  src,
  trigger = null,
  start = 'top top',
  end = 'bottom bottom',
  className,
}: ScrollVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [bufferedPct, setBufferedPct] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    let duration = 0;
    let targetTime = 0;
    let playhead = 0;
    let isSeeking = false;
    let pendingSeek: number | null = null;
    let rafId = 0;
    let lastTime = performance.now();

    const onLoadedMetadata = () => {
      duration = video.duration || 0;
      setReady(true);
    };

    const onProgress = () => {
      if (!video.buffered.length || !duration) return;
      const end = video.buffered.end(video.buffered.length - 1);
      setBufferedPct(Math.min(100, Math.round((end / duration) * 100)));
    };

    const onSeeked = () => {
      isSeeking = false;
      if (pendingSeek !== null) {
        const next = targetTime; // always resolve to current target, not stale value
        pendingSeek = null;
        isSeeking = true;
        video.currentTime = next;
      }
    };

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (!reduceMotion) {
        const damping = 1 - Math.exp(-dt * DAMPING_RATE);
        playhead += (targetTime - playhead) * damping;
      } else {
        playhead = targetTime; // no eased lag for reduced-motion users
      }

      if (
        !isSeeking &&
        Math.abs(playhead - video.currentTime) > SEEK_THRESHOLD
      ) {
        isSeeking = true;
        pendingSeek = null;
        video.currentTime = playhead;
      } else if (isSeeking) {
        pendingSeek = playhead;
      }

      rafId = requestAnimationFrame(tick);
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('progress', onProgress);
    video.addEventListener('seeked', onSeeked);
    rafId = requestAnimationFrame(tick);

    const st = ScrollTrigger.create({
      trigger: trigger ?? document.documentElement,
      start,
      end,
      onUpdate: (self) => {
        if (!duration) return;
        targetTime = self.progress * duration;
      },
    });

    return () => {
      cancelAnimationFrame(rafId);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('seeked', onSeeked);
      st.kill();
      // Deliberately not clearing video.src here — doing so in a
      // StrictMode-doubled cleanup causes a dev-only flash/reload. Let the
      // browser reclaim it on real navigation away from this route.
    };
  }, [trigger, start, end]);

  return (
    <div className={className} style={{ position: 'fixed', inset: 0 }}>
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      {!ready && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          Loading… {bufferedPct}%
        </div>
      )}
    </div>
  );
}
