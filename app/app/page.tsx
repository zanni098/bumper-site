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
  const [alphaView, setAlphaView] = useState(true);
  const [exporting, setExporting] = useState<ExportState | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

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

  /* draw whenever anything changes */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    renderFrame(ctx, preset, Math.min(frame, totalFrames - 1), props, brand, fonts);
  }, [preset, frame, props, brand, fonts, totalFrames]);

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
      const opts = {
        preset,
        props,
        brand,
        fonts,
        signal: cancelRef.current,
        onProgress: (done: number, total: number) =>
          setExporting({ kind, done, total }),
      };

      try {
        setPlaying(false);
        setExporting({ kind, done: 0, total: totalFrames });

        if (kind === "still") {
          const blob = await exportStill(opts, frame);
          download(blob, `${base}_${String(frame).padStart(4, "0")}.png`);
          setNote(`Saved frame ${frame} as PNG with alpha.`);
        } else if (kind === "png") {
          const blob = await exportPngSequence(opts);
          download(blob, `${base}-png-sequence.zip`);
          setNote(
            `Rendered ${totalFrames} frames · ${(blob.size / 1e6).toFixed(1)} MB · alpha preserved.`
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
    [preset, props, brand, fonts, totalFrames, frame]
  );

  const pct = exporting ? Math.round((exporting.done / exporting.total) * 100) : 0;

  /* ------------------------------------------------------------- render */

  return (
    <div className="ed">
      {/* hidden probes so the canvas can use the same fonts as the page */}
      <span ref={probeRef} className="probe" style={{ fontFamily: "var(--font-display)" }} />
      <span ref={monoProbeRef} className="probe" style={{ fontFamily: "var(--font-mono)" }} />

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
            <div className={`ed-canvas ${alphaView ? "is-alpha" : "is-video"}`}>
              <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />
              <div className="ed-toggle">
                <button
                  data-on={alphaView}
                  onClick={() => setAlphaView(true)}
                  className="mono"
                >
                  Alpha
                </button>
                <span />
                <button
                  data-on={!alphaView}
                  onClick={() => setAlphaView(false)}
                  className="mono"
                >
                  Over video
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
            <button
              className="btn btn-block"
              onClick={() => runExport("png")}
              disabled={!!exporting}
            >
              PNG sequence · ZIP
              <em className="mono">alpha</em>
            </button>
            <button
              className="btn btn-block"
              onClick={() => runExport("webm")}
              disabled={!!exporting || !webmSupported()}
            >
              WebM video
              <em className="mono">{webmSupported() ? "vp9" : "n/a"}</em>
            </button>
            <button
              className="btn btn-block"
              onClick={() => runExport("still")}
              disabled={!!exporting}
            >
              This frame · PNG
              <em className="mono">alpha</em>
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
