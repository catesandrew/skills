/**
 * Reference implementation of the Bayer-dithered particle-field engine
 * documented in dither-engine.md. Adapt into the target app's component
 * structure — do not copy-paste verbatim. Framework-agnostic: wrap this in
 * a React <canvas> component, a plain script, or whatever the target app
 * uses for canvas rendering.
 */

export interface DitherParams {
  /** cell size in output pixels. 6-14. Bigger = coarser, more graphic. */
  pixelSize: number;
  /** fraction of each cell left as gap. 0.3-0.5 */
  spacing: number;
  /** dot radius as a fraction of the remaining cell. 0.7-0.9 */
  dotScale: number;
  /** tone steps. 2 = hard 1-bit, 6 = smooth gradation. */
  levels: number;
  /** 20-35 */
  contrast: number;
  /** -10..+5 */
  brightness: number;
  /** true if source subject is dark-on-light (invert so dots land on subject) */
  invert: boolean;
  /** clamp any normalized luma below this to zero. ~0.02, 0 to disable. */
  floor: number;
  /** "sampled" | "duotone" | "blended" */
  colorMode: "sampled" | "duotone" | "blended";
  /** used by colorMode "duotone" and "blended" */
  inkColor: [number, number, number];
  /** 0.1-0.3 forces toward inkColor, 0.6-1.0 keeps source palette. Used by "blended". */
  colorMix: number;
  /** cell shape */
  shape: "circle" | "square";
}

/** Build an 8x8 Bayer matrix by recursing a 4x4 into each quadrant, normalized to 0..1 */
export function buildBayer8x8(): Float32Array {
  const bayer2 = [
    [0, 2],
    [3, 1],
  ];
  const expand = (m: number[][]): number[][] => {
    const n = m.length;
    const out: number[][] = Array.from({ length: n * 2 }, () => new Array(n * 2).fill(0));
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const v = m[y][x] * 4;
        out[y][x] = v;
        out[y][x + n] = v + 2;
        out[y + n][x] = v + 3;
        out[y + n][x + n] = v + 1;
      }
    }
    return out;
  };
  const bayer4 = expand(bayer2);
  const bayer8 = expand(bayer4);
  const flat = new Float32Array(64);
  const max = 63;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      flat[y * 8 + x] = bayer8[y][x] / max;
    }
  }
  return flat;
}

const BAYER_8X8 = buildBayer8x8();

/** Pinned once per sequence from the first frame's histogram — never recompute per frame. */
export interface LevelRange {
  lo: number; // 2nd percentile luma, 0..1
  hi: number; // 98th percentile luma, 0..1
}

export function computeLevelRange(imageData: ImageData): LevelRange {
  const { data } = imageData;
  const hist = new Uint32Array(256);
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    hist[Math.round(luma)]++;
    count++;
  }
  const loTarget = count * 0.02;
  const hiTarget = count * 0.98;
  let running = 0;
  let lo = 0;
  let hi = 255;
  for (let v = 0; v < 256; v++) {
    running += hist[v];
    if (running >= loTarget) {
      lo = v;
      break;
    }
  }
  running = 0;
  for (let v = 255; v >= 0; v--) {
    running += hist[v];
    if (running >= count - hiTarget) {
      hi = v;
      break;
    }
  }
  return { lo: lo / 255, hi: Math.max(hi / 255, lo / 255 + 0.01) };
}

/**
 * Render one frame from a source (already drawn into a downscaled offscreen
 * buffer at cellsX x cellsY resolution) onto the visible canvas at
 * params.pixelSize per cell.
 *
 * bufferCtx must already contain the current frame drawn at (cellsX, cellsY)
 * resolution — do the expensive downscale draw once per frame, outside this
 * function, then pass the resulting ImageData in.
 */
export function renderDitherFrame(
  ctx: CanvasRenderingContext2D,
  buffer: ImageData,
  cellsX: number,
  cellsY: number,
  levels: LevelRange,
  params: DitherParams,
  // sampling displacement for pointer interaction: returns offset in cell units
  sampleOffset?: (cx: number, cy: number) => { dx: number; dy: number }
) {
  const cellPx = params.pixelSize;
  const cellPxSpaced = cellPx * (1 - params.spacing);
  const maxRadius = (cellPxSpaced / 2) * params.dotScale;

  const buckets = new Map<string, Array<{ x: number; y: number; r: number }>>();

  for (let cy = 0; cy < cellsY; cy++) {
    for (let cx = 0; cx < cellsX; cx++) {
      let sx = cx;
      let sy = cy;
      if (sampleOffset) {
        const off = sampleOffset(cx, cy);
        sx = Math.round(cx + off.dx);
        sy = Math.round(cy + off.dy);
      }
      if (sx < 0 || sy < 0 || sx >= cellsX || sy >= cellsY) continue;

      const idx = (sy * cellsX + sx) * 4;
      const r = buffer.data[idx];
      const g = buffer.data[idx + 1];
      const b = buffer.data[idx + 2];

      let luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

      // pinned auto-levels
      luma = (luma - levels.lo) / (levels.hi - levels.lo);
      luma = Math.min(1, Math.max(0, luma));

      // brightness/contrast
      luma = (luma - 0.5) * (1 + params.contrast / 100) + 0.5 + params.brightness / 100;
      luma = Math.min(1, Math.max(0, luma));

      if (params.invert) luma = 1 - luma;

      if (luma < params.floor) luma = 0;

      // 8x8 Bayer ordered dither into N levels
      const bx = cx % 8;
      const by = cy % 8;
      const threshold = BAYER_8X8[by * 8 + bx];
      const step = 1 / params.levels;
      let level = Math.floor(luma / step + (threshold - 0.5) * step);
      level = Math.min(params.levels - 1, Math.max(0, level));
      const tone = level / (params.levels - 1 || 1);

      if (tone <= 0) continue;

      const radius = maxRadius * tone;
      let color: [number, number, number];
      switch (params.colorMode) {
        case "duotone":
          color = params.inkColor;
          break;
        case "blended":
          color = [
            r * (1 - params.colorMix) + params.inkColor[0] * params.colorMix,
            g * (1 - params.colorMix) + params.inkColor[1] * params.colorMix,
            b * (1 - params.colorMix) + params.inkColor[2] * params.colorMix,
          ];
          break;
        default:
          color = [r, g, b];
      }
      // quantize color into buckets so fillStyle is set a handful of times, not per-dot
      const key = `${Math.round(color[0] / 8)},${Math.round(color[1] / 8)},${Math.round(color[2] / 8)}`;
      const bucket = buckets.get(key) ?? [];
      bucket.push({ x: cx * cellPx + cellPx / 2, y: cy * cellPx + cellPx / 2, r: radius });
      buckets.set(key, bucket);
    }
  }

  for (const [key, dots] of buckets) {
    const [rq, gq, bq] = key.split(",").map((v) => Number(v) * 8);
    ctx.fillStyle = `rgb(${rq}, ${gq}, ${bq})`;
    ctx.beginPath();
    for (const dot of dots) {
      if (params.shape === "square") {
        ctx.rect(dot.x - dot.r, dot.y - dot.r, dot.r * 2, dot.r * 2);
      } else {
        ctx.moveTo(dot.x + dot.r, dot.y);
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  }
}

/**
 * Crossfade-the-wrap looping: blend opening frames back in over the final
 * `tailFrames` of the sequence. Call to get an alpha [0,1] for compositing
 * frame `frameIndex + tailOffset` (the "next" loop's opening frame) over
 * the current frame during the tail.
 */
export function crossfadeWrapAlpha(frameIndex: number, totalFrames: number, tailFrames: number): number {
  const tail = Math.min(tailFrames, Math.max(0, totalFrames - 1));
  if (tail === 0) return 0;
  const distanceFromEnd = totalFrames - 1 - frameIndex;
  if (distanceFromEnd >= tail) return 0;
  return 1 - distanceFromEnd / tail;
}

/**
 * Pointer interaction: displacement in cell units for a given cell, given
 * pointer position (in cell units) and a mode. Use a wide radius (~60% of
 * canvas) and soft falloff so it reads as a field effect.
 */
export function pointerDisplacement(
  cx: number,
  cy: number,
  pointerX: number,
  pointerY: number,
  radiusCells: number,
  mode: "directional" | "rotational" | "scatter",
  strength = 1
): { dx: number; dy: number } {
  const ddx = cx - pointerX;
  const ddy = cy - pointerY;
  const dist = Math.sqrt(ddx * ddx + ddy * ddy);
  if (dist > radiusCells) return { dx: 0, dy: 0 };
  const falloff = 1 - dist / radiusCells; // linear; ease this for softer edge
  const eased = falloff * falloff;

  switch (mode) {
    case "rotational": {
      const angle = Math.atan2(ddy, ddx) + eased * strength * 0.6;
      const r = dist;
      return { dx: (Math.cos(angle) * r - ddx) * -1, dy: (Math.sin(angle) * r - ddy) * -1 };
    }
    case "scatter": {
      // deterministic pseudo-random offset per cell, scaled by falloff
      const n = Math.sin(cx * 12.9898 + cy * 78.233) * 43758.5453;
      const jitter = n - Math.floor(n);
      const angle = jitter * Math.PI * 2;
      return {
        dx: Math.cos(angle) * eased * strength,
        dy: Math.sin(angle) * eased * strength,
      };
    }
    case "directional":
    default: {
      const dir = ddx >= 0 ? 1 : -1;
      return { dx: dir * eased * strength, dy: -eased * strength * 0.3 };
    }
  }
}
