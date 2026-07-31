/**
 * Bumper render engine.
 *
 * The product's whole argument is that motion graphics are a rendering problem,
 * not a generation problem. So this is a real deterministic renderer: every
 * frame is a pure function of (frame index, props, brand). Same input, same
 * pixels, every time. No GPU inference, nothing to meter.
 */

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export interface Brand {
  accent: string;
  text: string;
  muted: string;
  backing: string;
}

export const DEFAULT_BRAND: Brand = {
  accent: "#D6FF4B",
  text: "#F4F4F2",
  muted: "#9A9AA5",
  backing: "#0B0B0D",
};

export interface Fonts {
  display: string;
  mono: string;
}

export type FieldType = "text" | "color";

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  value: string;
  /** Soft cap used by the UI, not enforced by the renderer. */
  max?: number;
}

export interface LayerSpec {
  name: string;
  /** Track colour used by the timeline, matching the design system. */
  color: string;
  /** First frame on which the layer is visible. */
  inFrame: number;
}

export type Props = Record<string, string>;

export interface FrameCtx {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  frame: number;
  totalFrames: number;
  props: Props;
  brand: Brand;
  fonts: Fonts;
}

export interface Preset {
  id: string;
  name: string;
  /** Duration in seconds. */
  duration: number;
  blurb: string;
  fields: Field[];
  layers: LayerSpec[];
  draw: (c: FrameCtx) => void;
}

/* ----------------------------------------------------------------- easing */

export type EaseName = "expoOut" | "easeInOut" | "backOut" | "linear";

export const EASINGS: Record<EaseName, (t: number) => number> = {
  expoOut: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  backOut: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  linear: (t) => t,
};

export const EASE_LABEL: Record<EaseName, string> = {
  expoOut: "Expo out",
  easeInOut: "Ease in out",
  backOut: "Back out",
  linear: "Linear",
};

export const EASE_CSS: Record<EaseName, string> = {
  expoOut: "cubic-bezier(0.16, 1, 0.3, 1)",
  easeInOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  backOut: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  linear: "linear",
};

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Progress of a sub-animation starting at `startFrame` and lasting
 * `durationFrames`, eased. Returns 0 before it starts, 1 after it ends.
 */
export function at(
  frame: number,
  startFrame: number,
  durationFrames: number,
  ease: (t: number) => number
): number {
  if (durationFrames <= 0) return frame >= startFrame ? 1 : 0;
  return ease(clamp01((frame - startFrame) / durationFrames));
}

/** Fade out over the final `n` frames of the composition. */
export function tail(frame: number, total: number, n = 8): number {
  const start = total - n;
  if (frame < start) return 1;
  return clamp01(1 - (frame - start) / n);
}

/* ---------------------------------------------------------------- drawing */

export function font(fonts: Fonts, weight: number, size: number, mono = false) {
  return `${weight} ${size}px ${mono ? fonts.mono : fonts.display}`;
}

export function withAlpha(
  ctx: CanvasRenderingContext2D,
  alpha: number,
  fn: () => void
) {
  if (alpha <= 0.001) return;
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = prev * clamp01(alpha);
  fn();
  ctx.globalAlpha = prev;
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Draw text with letter-spacing, since canvas has no native tracking. */
export function tracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: "left" | "center" = "left"
) {
  const chars = [...text];
  const total =
    chars.reduce((sum, ch) => sum + ctx.measureText(ch).width, 0) +
    spacing * Math.max(0, chars.length - 1);
  let cx = align === "center" ? x - total / 2 : x;
  for (const ch of chars) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
  return total;
}

/**
 * Break `text` into lines that each fit within `maxWidth` at the font currently
 * set on the context. Words longer than the line are left intact rather than
 * hyphenated — a broken word reads worse than a slightly wide line.
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines: string[] = [];
  let line = words[0];
  for (let i = 1; i < words.length; i++) {
    const candidate = `${line} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
    } else {
      lines.push(line);
      line = words[i];
    }
  }
  lines.push(line);
  return lines;
}

/**
 * A backing plate behind text. Over footage, type needs something solid to sit
 * on — the design system bans drop shadows, so legibility comes from a plate
 * rather than a blur.
 */
export function plate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill = "#0B0B0DE6"
) {
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
}

/** Linear interpolation, used constantly by the presets. */
export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function framesOf(preset: Preset) {
  return Math.round(preset.duration * FPS);
}

export function timecode(frame: number) {
  const f = Math.max(0, Math.round(frame));
  const totalSeconds = Math.floor(f / FPS);
  const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  const ff = String(f % FPS).padStart(2, "0");
  return `${hh}:${mm}:${ss}:${ff}`;
}

/**
 * Paints whatever sits under the graphic — the user's photo or video frame.
 * Called after the canvas is cleared and before the preset draws, so the
 * graphic always composites on top. Omit it and the frame stays transparent.
 */
export type Backdrop = (ctx: CanvasRenderingContext2D) => void;

/** Render one frame. Clears to full transparency first — this is what keeps alpha. */
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  preset: Preset,
  frame: number,
  props: Props,
  brand: Brand,
  fonts: Fonts,
  backdrop?: Backdrop
) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  if (backdrop) {
    ctx.save();
    backdrop(ctx);
    ctx.restore();
  }
  ctx.save();
  ctx.textBaseline = "alphabetic";
  preset.draw({
    ctx,
    w: WIDTH,
    h: HEIGHT,
    frame,
    totalFrames: framesOf(preset),
    props,
    brand,
    fonts,
  });
  ctx.restore();
}
