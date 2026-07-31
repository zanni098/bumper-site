"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_BRAND,
  EASE_CSS,
  FPS,
  HEIGHT,
  WIDTH,
  framesOf,
  renderFrame,
  timecode,
  type Brand,
  type Fonts,
  type Props,
} from "@/lib/bumper/engine";
import { PRESETS, defaultProps, presetById } from "@/lib/bumper/presets";
import {
  download,
  exportPngSequence,
  exportStill,
  exportWebm,
  slug,
  webmSupported,
} from "@/lib/bumper/export";
import {
  ACCEPTED_MEDIA,
  DEFAULT_MEDIA_SETTINGS,
  backdropFor,
  loadMedia,
  mediaLabel,
  timeForFrame,
  type MediaSettings,
  type MediaSource,
} from "@/lib/bumper/media";

type ExportKind = "png" | "webm" | "still";

interface ExportState {
  kind: ExportKind;
  done: number;
  total: number;
}

const BRAND_KEY = "bumper.brand.v1";

export default function Editor() {
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const preset = useMemo(() => presetById(presetId), [presetId]);
  const totalFrames = framesOf(preset);

  const [allProps, setAllProps] = useState<Record<string, Props>>(() =>
    Object.fromEntries(PRESETS.map((p) => [p.id, defaultProps(p)]))
  );
  const props = allProps[presetId];

  const [brand, setBrand] = useState<Brand>(DEFAULT_BRAND);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [exporting, setExporting] = useState<ExportState | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  /* ------------------------------------------------------------- footage */

  const [media, setMedia] = useState<MediaSource | null>(null);
  const [mediaSettings, setMediaSettings] = useState<MediaSettings>(
    DEFAULT_MEDIA_SETTINGS
  );
  const [showMedia, setShowMedia] = useState(false);
  const [burn, setBurn] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(false);
  /** Bumped when a video decodes a new frame, to force a repaint while paused. */
  const [mediaTick, setMediaTick] = useState(0);

  const mediaRef = useRef<MediaSource | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /**
   * MediaRecorder does not exist during prerender, so probing it while
   * rendering makes the server and client disagree. Resolve it after mount.
   */
  const [canWebm, setCanWebm] = useState(false);
  useEffect(() => setCanWebm(webmSupported()), []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const monoProbeRef = useRef<HTMLSpanElement>(null);
  const scrubRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef({ cancelled: false });
  const [fonts, setFonts] = useState<Fonts>({
    display: "system-ui, sans-serif",
    mono: "monospace",
  });

  /* restore brand */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BRAND_KEY);
      if (raw) setBrand({ ...DEFAULT_BRAND, ...JSON.parse(raw) });
    } catch {
      /* ignore — a corrupt brand kit should never block the editor */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(BRAND_KEY, JSON.stringify(brand));
    } catch {
      /* storage may be unavailable; the editor still works in-memory */
    }
  }, [brand]);

  /* resolve the real font family names so canvas matches the page */
  useEffect(() => {
    let alive = true;
    const resolve = () => {
      if (!alive) return;
      const d = probeRef.current && getComputedStyle(probeRef.current).fontFamily;
      const m =
        monoProbeRef.current && getComputedStyle(monoProbeRef.current).fontFamily;
      if (d && m) setFonts({ display: d, mono: m });
    };
    resolve();
    document.fonts?.ready.then(resolve).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  /* ------------------------------------------------------------- footage */

  const attachMedia = useCallback((next: MediaSource | null) => {
    mediaRef.current?.dispose();
    mediaRef.current = next;
    setMedia(next);
  }, []);

  const acceptFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return;
      setError("");
      setNote("");
      setLoadingMedia(true);
      try {
        const next = await loadMedia(file);
        attachMedia(next);
        setMediaSettings({ ...DEFAULT_MEDIA_SETTINGS });
        setShowMedia(true);
        setBurn(true);
        setNote(`${next.name} loaded · ${mediaLabel(next)} · stays on your device.`);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Could not load that file.");
      } finally {
        setLoadingMedia(false);
      }
    },
    [attachMedia]
  );

  /* release the object URL when the editor goes away */
  useEffect(() => {
    return () => {
      mediaRef.current?.dispose();
      mediaRef.current = null;
    };
  }, []);

  /* a decoded video frame is a reason to repaint, even when paused */
  useEffect(() => {
    if (!media || media.kind !== "video") return;
    const video = media.el as HTMLVideoElement;
    const bump = () => setMediaTick((t) => t + 1);
    video.addEventListener("seeked", bump);
    video.addEventListener("loadeddata", bump);
    return () => {
      video.removeEventListener("seeked", bump);
      video.removeEventListener("loadeddata", bump);
    };
  }, [media]);

  /* keep the video element lined up with the composition frame */
  useEffect(() => {
    if (!media || media.kind !== "video") return;
    const video = media.el as HTMLVideoElement;
    if (!showMedia || exporting) {
      if (!video.paused) video.pause();
      return;
    }
    const expected = timeForFrame(media, mediaSettings, frame, FPS);
    if (playing) {
      if (video.paused) void video.play().catch(() => {});
      // Let it run at its own rate; only correct real drift.
      if (Math.abs(video.currentTime - expected) > 0.35) video.currentTime = expected;
    } else {
      if (!video.paused) video.pause();
      if (Math.abs(video.currentTime - expected) > 0.02) video.currentTime = expected;
    }
  }, [media, showMedia, playing, frame, mediaSettings, exporting]);

  const backdrop = useMemo(
    () => (showMedia && media ? backdropFor(media, mediaSettings) : undefined),
    [showMedia, media, mediaSettings]
  );

  /* draw whenever anything changes */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    renderFrame(
      ctx,
      preset,
      Math.min(frame, totalFrames - 1),
      props,
      brand,
      fonts,
      backdrop
    );
    // mediaTick is a repaint signal, not a value the render reads.
    void mediaTick;
  }, [preset, frame, props, brand, fonts, totalFrames, backdrop, mediaTick]);

  /* playback */
  useEffect(() => {
    if (!playing || exporting) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const step = (now: number) => {
      acc += now - last;
      last = now;
      const frameMs = 1000 / FPS;
      if (acc >= frameMs) {
        const advance = Math.floor(acc / frameMs);
        acc -= advance * frameMs;
        setFrame((f) => (f + advance) % totalFrames);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, totalFrames, exporting]);

  /* reset to frame 0 when switching preset */
  useEffect(() => {
    setFrame(0);
  }, [presetId]);

  const setField = useCallback(
    (key: string, value: string) => {
      setAllProps((prev) => ({
        ...prev,
        [presetId]: { ...prev[presetId], [key]: value },
      }));
    },
    [presetId]
  );

  /* ---------------------------------------------------------- scrubbing */

  const scrubTo = useCallback(
    (clientX: number) => {
      const el = scrubRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      setFrame(Math.round(p * (totalFrames - 1)));
    },
    [totalFrames]
  );

  const onScrubDown = (e: React.PointerEvent) => {
    setPlaying(false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    scrubTo(e.clientX);
  };
  const onScrubMove = (e: React.PointerEvent) => {
    if (e.buttons === 1) scrubTo(e.clientX);
  };

  /* ----------------------------------------------------------- exporting */

  const runExport = useCallback(
    async (kind: ExportKind) => {
      setError("");
      setNote("");
      cancelRef.current = { cancelled: false };
      const base = slug(preset.name);
      const baked = burn && !!media;
      const opts = {
        preset,
        props,
        brand,
        fonts,
        media,
        mediaSettings,
        burn: baked,
        signal: cancelRef.current,
        onProgress: (done: number, total: number) =>
          setExporting({ kind, done, total }),
      };
      const alphaNote = baked ? "footage baked in" : "alpha preserved";

      try {
        setPlaying(false);
        setExporting({ kind, done: 0, total: totalFrames });

        if (kind === "still") {
          const blob = await exportStill(opts, frame);
          download(blob, `${base}_${String(frame).padStart(4, "0")}.png`);
          setNote(`Saved frame ${frame} as PNG · ${alphaNote}.`);
        } else if (kind === "png") {
          const blob = await exportPngSequence(opts);
          download(blob, `${base}-png-sequence.zip`);
          setNote(
            `Rendered ${totalFrames} frames · ${(blob.size / 1e6).toFixed(1)} MB · ${alphaNote}.`
          );
        } else {
          const blob = await exportWebm(opts);
          download(blob, `${base}.webm`);
          setNote(
            `Recorded ${totalFrames} frames · ${(blob.size / 1e6).toFixed(1)} MB WebM.`
          );
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Export failed.";
        if (msg !== "cancelled") setError(msg);
      } finally {
        setExporting(null);
      }
    },
    [preset, props, brand, fonts, totalFrames, frame, media, mediaSettings, burn]
  );

  const pct = exporting ? Math.round((exporting.done / exporting.total) * 100) : 0;

  /* ------------------------------------------------------------- render */

  return (
    <div className="ed">
      {/* hidden probes so the canvas can use the same fonts as the page */}
      <span ref={probeRef} className="probe" style={{ fontFamily: "var(--font-display)" }} />
      <span ref={monoProbeRef} className="probe" style={{ fontFamily: "var(--font-mono)" }} />
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_MEDIA}
        className="probe"
        onChange={(e) => {
          void acceptFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <header className="ed-top">
        <div className="ed-brandline">
          <Link href="/" className="brand-mark" aria-label="Bumper home">
            B
          </Link>
          <span className="ed-muted">Bumper</span>
          <span className="mono ed-dim">/</span>
          <strong>{preset.name}</strong>
          <span className="ed-chip mono">FREE</span>
        </div>
        <div className="ed-topright">
          <span className="mono ed-dim">
            {WIDTH}×{HEIGHT} · {FPS}fps · {totalFrames}f
          </span>
          <button
            className="btn"
            onClick={() => runExport("still")}
            disabled={!!exporting}
          >
            Save frame
          </button>
          <button
            className="btn btn-primary"
            onClick={() => runExport("png")}
            disabled={!!exporting}
          >
            {exporting?.kind === "png" ? `Rendering ${pct}%` : "Render PNG sequence"}
          </button>
        </div>
      </header>

      <div className="ed-body">
        {/* ------------------------------------------------------ presets */}
        <nav className="ed-rail">
          <p className="eyebrow ed-railhead">Presets</p>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              className="ed-preset"
              data-active={p.id === presetId}
              onClick={() => setPresetId(p.id)}
            >
              <span className="ed-preset-name">{p.name}</span>
              <span className="mono ed-preset-dur">{p.duration}s</span>
              <span className="ed-preset-blurb">{p.blurb}</span>
            </button>
          ))}
          <div className="ed-railfoot">
            <p className="mono">
              Rendered with a deterministic HTML/canvas engine. No GPU, no credits.
            </p>
            <Link href="/" className="mono ed-link">
              ← Back to site
            </Link>
          </div>
        </nav>

        {/* ------------------------------------------------------- stage */}
        <main className="ed-stage">
          <div className="ed-stagewrap">
            <div
              className={`ed-canvas ${showMedia ? "is-video" : "is-alpha"}`}
              data-drop={dragging}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                void acceptFile(e.dataTransfer.files?.[0]);
              }}
            >
              <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />

              {showMedia && !media && (
                <button
                  className="ed-dropzone"
                  onClick={() => fileRef.current?.click()}
                  type="button"
                >
                  <strong>Drop a photo or video here</strong>
                  <span className="mono">
                    or click to browse · MP4, WebM, MOV, PNG, JPG
                  </span>
                  <span className="mono ed-dim">
                    Nothing uploads. It is composited in your browser.
                  </span>
                </button>
              )}

              {dragging && <div className="ed-dropveil mono">Release to place your footage</div>}

              <div className="ed-toggle">
                <button
                  data-on={!showMedia}
                  onClick={() => setShowMedia(false)}
                  className="mono"
                >
                  Alpha
                </button>
                <span />
                <button
                  data-on={showMedia}
                  onClick={() => setShowMedia(true)}
                  className="mono"
                >
                  {media ? "Over footage" : "Over video"}
                </button>
              </div>
            </div>

            {/* transport */}
            <div className="ed-transport">
              <button
                className="ed-play"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? "❚❚" : "▶"}
              </button>
              <button className="ed-step" onClick={() => setFrame(0)} aria-label="Go to start">
                ⏮
              </button>
              <span className="mono ed-tc">{timecode(frame)}</span>
              <span className="mono ed-dim">/ {timecode(totalFrames)}</span>
              <span className="ed-spacer" />
              <span className="mono ed-dim">
                frame {frame} of {totalFrames - 1}
              </span>
            </div>

            {/* timeline */}
            <div
              className="ed-timeline"
              ref={scrubRef}
              onPointerDown={onScrubDown}
              onPointerMove={onScrubMove}
              role="slider"
              aria-label="Timeline"
              aria-valuemin={0}
              aria-valuemax={totalFrames - 1}
              aria-valuenow={frame}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") setFrame((f) => Math.min(totalFrames - 1, f + 1));
                if (e.key === "ArrowLeft") setFrame((f) => Math.max(0, f - 1));
              }}
            >
              <div className="ed-ruler">
                {Array.from({ length: Math.floor(preset.duration * 2) + 1 }, (_, i) => (
                  <span key={i} className="mono" style={{ left: `${((i * 0.5) / preset.duration) * 100}%` }}>
                    {(i * 0.5).toFixed(1)}s
                  </span>
                ))}
              </div>
              {preset.layers.map((l) => (
                <div className="ed-track" key={l.name}>
                  <span className="ed-track-name">{l.name}</span>
                  <span className="ed-lane">
                    <span
                      className="ed-clip"
                      style={{
                        left: `${(l.inFrame / totalFrames) * 100}%`,
                        color: l.color,
                        background: `color-mix(in srgb, ${l.color} 20%, transparent)`,
                        borderLeftColor: l.color,
                      }}
                    >
                      {l.name}
                    </span>
                  </span>
                </div>
              ))}
              <div
                className="ed-playhead"
                style={{ left: `calc(112px + (100% - 112px) * ${frame / (totalFrames - 1 || 1)})` }}
              />
            </div>
          </div>
        </main>

        {/* ---------------------------------------------------- inspector */}
        <aside className="ed-panel">
          <section>
            <p className="eyebrow">Content</p>
            {preset.fields.map((f) => (
              <label className="ed-field" key={f.key}>
                <span>{f.label}</span>
                {f.type === "color" ? (
                  <input
                    type="color"
                    value={props[f.key]}
                    onChange={(e) => setField(f.key, e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    value={props[f.key]}
                    maxLength={f.max}
                    onChange={(e) => setField(f.key, e.target.value)}
                  />
                )}
              </label>
            ))}
          </section>

          <section>
            <p className="eyebrow">Your footage</p>
            {!media ? (
              <>
                <button
                  className="btn btn-block"
                  onClick={() => fileRef.current?.click()}
                  disabled={loadingMedia}
                >
                  {loadingMedia ? "Decoding…" : "Add photo or video"}
                  <em className="mono">local</em>
                </button>
                <p className="ed-help">
                  Drop a clip on the canvas to lay this graphic over it. The file
                  never leaves your browser.
                </p>
              </>
            ) : (
              <>
                <div className="ed-media">
                  <span className="ed-media-kind mono">{media.kind}</span>
                  <span className="ed-media-name" title={media.name}>
                    {media.name}
                  </span>
                  <span className="mono ed-dim">{mediaLabel(media)}</span>
                </div>

                <div className="ed-seg">
                  {(["cover", "contain"] as const).map((f) => (
                    <button
                      key={f}
                      className="mono"
                      data-on={mediaSettings.fit === f}
                      onClick={() => setMediaSettings({ ...mediaSettings, fit: f })}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <label className="ed-slider">
                  <span>
                    Dim <code className="mono">{Math.round(mediaSettings.dim * 100)}%</code>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={75}
                    value={Math.round(mediaSettings.dim * 100)}
                    onChange={(e) =>
                      setMediaSettings({
                        ...mediaSettings,
                        dim: Number(e.target.value) / 100,
                      })
                    }
                  />
                </label>

                {media.kind === "video" && media.duration > 0 && (
                  <label className="ed-slider">
                    <span>
                      Start at{" "}
                      <code className="mono">{mediaSettings.start.toFixed(1)}s</code>
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, media.duration - 0.1) * 10}
                      value={mediaSettings.start * 10}
                      onChange={(e) =>
                        setMediaSettings({
                          ...mediaSettings,
                          start: Number(e.target.value) / 10,
                        })
                      }
                    />
                  </label>
                )}

                <div className="ed-mediabtns">
                  <button className="btn" onClick={() => fileRef.current?.click()}>
                    Replace
                  </button>
                  <button
                    className="btn"
                    onClick={() => {
                      attachMedia(null);
                      setShowMedia(false);
                      setNote("");
                    }}
                  >
                    Remove
                  </button>
                </div>
              </>
            )}
          </section>

          <section>
            <p className="eyebrow">Brand kit</p>
            <p className="ed-help">Set once — every preset picks it up.</p>
            {(
              [
                ["accent", "Accent"],
                ["text", "Text"],
                ["muted", "Muted"],
              ] as const
            ).map(([key, label]) => (
              <label className="ed-field ed-color" key={key}>
                <span>{label}</span>
                <span className="ed-colorwrap">
                  <input
                    type="color"
                    value={brand[key]}
                    onChange={(e) => setBrand({ ...brand, [key]: e.target.value })}
                  />
                  <code className="mono">{brand[key].toUpperCase()}</code>
                </span>
              </label>
            ))}
            <button className="btn ed-reset" onClick={() => setBrand(DEFAULT_BRAND)}>
              Reset brand
            </button>
          </section>

          <section>
            <p className="eyebrow">Motion</p>
            <div className="ed-row">
              <span>Easing</span>
              <code className="mono">{EASE_CSS.expoOut}</code>
            </div>
            <div className="ed-row">
              <span>Duration</span>
              <code className="mono">
                {preset.duration}s · {totalFrames}f
              </code>
            </div>
            <div className="ed-row">
              <span>Layers</span>
              <code className="mono">{preset.layers.length}</code>
            </div>
          </section>

          <section>
            <p className="eyebrow">Export</p>

            <label className="ed-check" data-disabled={!media}>
              <input
                type="checkbox"
                checked={burn && !!media}
                disabled={!media}
                onChange={(e) => setBurn(e.target.checked)}
              />
              <span>
                Bake in my footage
                <em>
                  {media
                    ? "Output is a finished clip, not a transparent overlay."
                    : "Add a photo or video first."}
                </em>
              </span>
            </label>

            <button
              className="btn btn-block"
              onClick={() => runExport("png")}
              disabled={!!exporting}
            >
              PNG sequence · ZIP
              <em className="mono">{burn && media ? "baked" : "alpha"}</em>
            </button>
            <button
              className="btn btn-block"
              onClick={() => runExport("webm")}
              disabled={!!exporting || !canWebm}
            >
              WebM video
              <em className="mono">{canWebm ? "vp9" : "n/a"}</em>
            </button>
            <button
              className="btn btn-block"
              onClick={() => runExport("still")}
              disabled={!!exporting}
            >
              This frame · PNG
              <em className="mono">{burn && media ? "baked" : "alpha"}</em>
            </button>

            {exporting && (
              <div className="ed-progress">
                <div className="bar">
                  <i style={{ width: `${pct}%` }} />
                </div>
                <p className="mono">
                  {exporting.done} / {exporting.total} frames · {pct}%
                </p>
                <button
                  className="mono ed-cancel"
                  onClick={() => (cancelRef.current.cancelled = true)}
                >
                  cancel
                </button>
              </div>
            )}
            {note && <p className="ed-note mono">{note}</p>}
            {error && <p className="ed-err mono">{error}</p>}
            <p className="ed-help">
              Everything renders in your browser. Nothing is uploaded, and there is
              no export limit.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
