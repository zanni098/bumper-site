/**
 * Export pipeline.
 *
 * Two real outputs, both produced entirely in the browser:
 *
 *  - PNG sequence in a ZIP. Rendered frame by frame off a fixed frame index,
 *    so the bytes are identical on every run. True alpha, imports into any NLE.
 *  - WebM via MediaRecorder, for dropping straight onto a timeline.
 *
 * The ZIP is written by hand with the STORE method (no compression). PNG data
 * is already deflated, so compressing again buys nothing and would cost us
 * determinism. Timestamps are pinned so identical input yields identical bytes.
 */

import { FPS, HEIGHT, WIDTH, renderFrame, type Backdrop, type Brand, type Fonts, type Preset, type Props } from "./engine";
import { framesOf } from "./engine";
import {
  backdropFor,
  seekTo,
  timeForFrame,
  type MediaSettings,
  type MediaSource,
} from "./media";

/* -------------------------------------------------------------- crc32 */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/* ---------------------------------------------------------------- zip */

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/** Pinned DOS timestamp (1980-01-01 00:00) so archives are reproducible. */
const DOS_TIME = 0;
const DOS_DATE = 33;

export function makeZip(entries: ZipEntry[]): Blob {
  const enc = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = enc.encode(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true); // store
    lv.setUint16(10, DOS_TIME, true);
    lv.setUint16(12, DOS_DATE, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    locals.push(local, entry.data);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, DOS_TIME, true);
    cv.setUint16(14, DOS_DATE, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centrals.push(central);

    offset += local.length + size;
  }

  const centralSize = centrals.reduce((n, c) => n + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const parts = [...locals, ...centrals, end];
  const total = parts.reduce((n, p) => n + p.length, 0);
  const buffer = new ArrayBuffer(total);
  const out = new Uint8Array(buffer);
  let cursor = 0;
  for (const part of parts) {
    out.set(part, cursor);
    cursor += part.length;
  }

  return new Blob([buffer], { type: "application/zip" });
}

/* ------------------------------------------------------------ helpers */

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function slug(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "bumper"
  );
}

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), type)
  );
}

export interface ExportOpts {
  preset: Preset;
  props: Props;
  brand: Brand;
  fonts: Fonts;
  /** The user's footage. Only composited when `burn` is on. */
  media?: MediaSource | null;
  mediaSettings?: MediaSettings;
  /**
   * Bake the media into the output. Off means a transparent overlay to drop
   * onto a timeline; on means a finished clip you can post as-is.
   */
  burn?: boolean;
  onProgress?: (done: number, total: number) => void;
  signal?: { cancelled: boolean };
}

/**
 * Resolves the backdrop for one frame, seeking video to the exact clip time
 * first so the output is timed by frame index rather than by playback.
 */
async function backdropAt(opts: ExportOpts, frame: number): Promise<Backdrop | undefined> {
  const { media, mediaSettings, burn } = opts;
  if (!burn || !media || !mediaSettings) return undefined;
  if (media.kind === "video") {
    const video = media.el as HTMLVideoElement;
    await seekTo(video, timeForFrame(media, mediaSettings, frame, FPS));
  }
  return backdropFor(media, mediaSettings);
}

/* ------------------------------------------------------- png sequence */

export async function exportPngSequence(opts: ExportOpts): Promise<Blob> {
  const { preset, props, brand, fonts, onProgress, signal } = opts;
  const total = framesOf(preset);

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Canvas 2D unavailable in this browser.");

  const entries: ZipEntry[] = [];
  const base = slug(preset.name);

  for (let f = 0; f < total; f++) {
    if (signal?.cancelled) throw new Error("cancelled");
    renderFrame(ctx, preset, f, props, brand, fonts, await backdropAt(opts, f));
    const blob = await toBlob(canvas, "image/png");
    const buf = new Uint8Array(await blob.arrayBuffer());
    entries.push({ name: `${base}_${String(f).padStart(4, "0")}.png`, data: buf });
    onProgress?.(f + 1, total);
    // Yield so the UI can paint the progress bar.
    if (f % 4 === 0) await new Promise((r) => setTimeout(r, 0));
  }

  return makeZip(entries);
}

/* --------------------------------------------------------------- webm */

export function webmSupported(): boolean {
  return (
    typeof MediaRecorder !== "undefined" &&
    (MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ||
      MediaRecorder.isTypeSupported("video/webm;codecs=vp8") ||
      MediaRecorder.isTypeSupported("video/webm"))
  );
}

function pickWebmType(): string {
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return "video/webm";
}

/**
 * Records the composition by stepping the canvas one frame at a time and
 * asking the stream track for a frame each step, so the output is timed by
 * frame index rather than by wall clock.
 */
export async function exportWebm(opts: ExportOpts): Promise<Blob> {
  const { preset, props, brand, fonts, onProgress, signal } = opts;
  if (!webmSupported()) throw new Error("This browser cannot record WebM.");

  const total = framesOf(preset);
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Canvas 2D unavailable in this browser.");

  const stream = canvas.captureStream(0);
  const track = stream.getVideoTracks()[0] as MediaStreamTrack & {
    requestFrame?: () => void;
  };
  const recorder = new MediaRecorder(stream, {
    mimeType: pickWebmType(),
    videoBitsPerSecond: 12_000_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
  });

  /**
   * MediaRecorder timestamps frames by wall clock, so burnt-in video is played
   * rather than seeked — a per-frame seek would stretch the clip's duration.
   * The PNG sequence keeps the deterministic seek path for anyone who needs
   * frame-exact output.
   */
  const live = Boolean(opts.burn && opts.media?.kind === "video");
  const video = live ? (opts.media!.el as HTMLVideoElement) : null;
  const liveBackdrop =
    opts.burn && opts.media && opts.mediaSettings
      ? backdropFor(opts.media, opts.mediaSettings)
      : undefined;

  if (video && opts.mediaSettings) {
    await seekTo(video, opts.mediaSettings.start);
    try {
      await video.play();
    } catch {
      /* autoplay refusal falls back to the frame that is already decoded */
    }
  }

  recorder.start();

  const frameMs = 1000 / FPS;
  try {
    for (let f = 0; f < total; f++) {
      if (signal?.cancelled) {
        recorder.stop();
        throw new Error("cancelled");
      }
      const backdrop = live ? liveBackdrop : await backdropAt(opts, f);
      renderFrame(ctx, preset, f, props, brand, fonts, backdrop);
      track.requestFrame?.();
      onProgress?.(f + 1, total);
      await new Promise((r) => setTimeout(r, frameMs));
    }
  } finally {
    video?.pause();
  }

  await new Promise((r) => setTimeout(r, 120));
  recorder.stop();
  stream.getTracks().forEach((t) => t.stop());
  return done;
}

/* --------------------------------------------------------- still frame */

export async function exportStill(
  opts: Omit<ExportOpts, "onProgress" | "signal">,
  frame: number
): Promise<Blob> {
  const { preset, props, brand, fonts } = opts;
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Canvas 2D unavailable in this browser.");
  renderFrame(ctx, preset, frame, props, brand, fonts, await backdropAt(opts, frame));
  return toBlob(canvas, "image/png");
}
