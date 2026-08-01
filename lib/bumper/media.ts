/**
 * The media layer: the user's own photo or footage, sitting under the graphic.
 *
 * Everything here stays local. The file never leaves the browser — it becomes
 * an object URL, gets decoded by the platform, and is composited onto the same
 * canvas the graphic draws to. There is no upload, so there is nothing to bill
 * for and nothing to leak.
 *
 * Determinism still holds for video: exports seek the element to an exact
 * frame time and wait for the decode before drawing, rather than sampling
 * whatever happens to be on screen.
 */

import { HEIGHT, WIDTH, type Backdrop } from "./engine";

export type MediaKind = "image" | "video";
export type MediaFit = "cover" | "contain";

export interface MediaSource {
  kind: MediaKind;
  name: string;
  url: string;
  width: number;
  height: number;
  /** Seconds. Zero for stills. */
  duration: number;
  el: HTMLImageElement | HTMLVideoElement;
  dispose(): void;
}

export interface MediaSettings {
  fit: MediaFit;
  /** Seconds into the clip that frame 0 maps to. */
  start: number;
  /** 0–0.75. A scrim so overlaid type stays readable on busy footage. */
  dim: number;
}

export const DEFAULT_MEDIA_SETTINGS: MediaSettings = {
  fit: "cover",
  start: 0,
  dim: 0,
};

export const ACCEPTED_MEDIA =
  "image/png,image/jpeg,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime,video/ogg";

/** 512 MB — large enough for a real 4K clip, small enough to fail loudly. */
const MAX_BYTES = 512 * 1024 * 1024;

export function isSupportedMedia(file: File): boolean {
  return file.type.startsWith("image/") || file.type.startsWith("video/");
}

/** Decode a user-picked file into something the renderer can draw every frame. */
export function loadMedia(file: File): Promise<MediaSource> {
  if (!isSupportedMedia(file)) {
    return Promise.reject(
      new Error(`${file.name} is not an image or video file.`)
    );
  }
  if (file.size > MAX_BYTES) {
    return Promise.reject(
      new Error(
        `${file.name} is ${(file.size / 1e6).toFixed(0)} MB — the limit is 512 MB.`
      )
    );
  }

  const url = URL.createObjectURL(file);
  const dispose = () => URL.revokeObjectURL(url);

  if (file.type.startsWith("image/")) {
    return new Promise<MediaSource>((resolve, reject) => {
      const img = new Image();
      img.onload = () =>
        resolve({
          kind: "image",
          name: file.name,
          url,
          width: img.naturalWidth,
          height: img.naturalHeight,
          duration: 0,
          el: img,
          dispose,
        });
      img.onerror = () => {
        dispose();
        reject(new Error(`Could not decode ${file.name}.`));
      };
      img.src = url;
    });
  }

  return new Promise<MediaSource>((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";

    const fail = () => {
      dispose();
      // Distinguish "this browser has no decoder for that codec" from "this
      // file is broken". Blaming the file is wrong and unactionable when the
      // file is a perfectly good H.264 MP4 and the build simply lacks the
      // proprietary codec — which is true of Chromium-without-codecs and of
      // some Linux Firefox builds.
      // A bare `video/mp4` probe answers "maybe" even in builds with no H.264,
      // so ask about the actual codec string instead.
      const looksMp4 = /mp4|quicktime/i.test(file.type);
      const noH264 = video.canPlayType('video/mp4; codecs="avc1.42E01E"') === "";
      reject(
        new Error(
          looksMp4 && noH264
            ? `This browser has no H.264 decoder, so it cannot open ${file.name}. Chrome and Edge can; some Chromium and Linux builds cannot. A WebM (VP8/VP9) file works everywhere.`
            : `Could not decode ${file.name}. The file may be damaged or use a codec this browser does not support.`
        )
      );
    };

    video.onloadeddata = () => {
      if (!video.videoWidth) return fail();
      resolve({
        kind: "video",
        name: file.name,
        url,
        width: video.videoWidth,
        height: video.videoHeight,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
        el: video,
        dispose,
      });
    };
    video.onerror = fail;
    video.src = url;
  });
}

/* ------------------------------------------------------------- geometry */

/** Where the media lands on a 1920×1080 frame under the chosen fit. */
export function fitRect(
  media: Pick<MediaSource, "width" | "height">,
  fit: MediaFit,
  w = WIDTH,
  h = HEIGHT
) {
  const sourceRatio = media.width / media.height;
  const frameRatio = w / h;
  const wider = sourceRatio > frameRatio;
  const useWidth = fit === "cover" ? !wider : wider;

  const dw = useWidth ? w : h * sourceRatio;
  const dh = useWidth ? w / sourceRatio : h;
  return { x: (w - dw) / 2, y: (h - dh) / 2, w: dw, h: dh };
}

/**
 * Build the painter that goes under the graphic. Reads the element as it
 * stands, so callers are responsible for seeking video to the right time
 * first — see `seekTo`.
 */
export function backdropFor(
  media: MediaSource,
  settings: MediaSettings
): Backdrop {
  return (ctx) => {
    const r = fitRect(media, settings.fit);
    try {
      ctx.drawImage(media.el as CanvasImageSource, r.x, r.y, r.w, r.h);
    } catch {
      // A video can transiently have no decoded frame; skipping one paint is
      // better than tearing down the whole render.
      return;
    }
    if (settings.dim > 0) {
      ctx.fillStyle = `rgba(11, 11, 13, ${Math.min(0.75, settings.dim)})`;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
  };
}

/* -------------------------------------------------------------- seeking */

/** The clip time a given composition frame maps to, wrapping if the clip is short. */
export function timeForFrame(
  media: MediaSource,
  settings: MediaSettings,
  frame: number,
  fps: number
): number {
  if (media.kind !== "video" || media.duration <= 0) return 0;
  const raw = settings.start + frame / fps;
  // Loop rather than freeze — a 3s clip under an 8s end screen should keep moving.
  const t = raw % media.duration;
  // Nudge off the exact end, which some decoders refuse to seek to.
  return Math.min(Math.max(0, t), Math.max(0, media.duration - 0.01));
}

/** Seek a video element and resolve once a frame for that time is decoded. */
export function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  if (Math.abs(video.currentTime - time) < 1e-3 && video.readyState >= 2) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener("seeked", finish);
      clearTimeout(timer);
      resolve();
    };
    // Never hang an export on a decoder that swallows the event.
    const timer = setTimeout(finish, 1500);
    video.addEventListener("seeked", finish);
    try {
      video.currentTime = time;
    } catch {
      finish();
    }
  });
}

export function isVideo(media: MediaSource | null): media is MediaSource {
  return !!media && media.kind === "video";
}

export function mediaLabel(media: MediaSource): string {
  const dims = `${media.width}×${media.height}`;
  return media.kind === "video"
    ? `${dims} · ${media.duration.toFixed(1)}s`
    : dims;
}
