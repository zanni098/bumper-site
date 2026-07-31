"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PRESETS } from "@/lib/bumper/presets";
import { CANVAS_URL, PRODUCT_URL, REPO_URL } from "./config";

const TICKS = [
  { t: "00:00", id: "top" },
  { t: "00:06", id: "why" },
  { t: "00:14", id: "presets" },
  { t: "00:22", id: "editor" },
  { t: "00:31", id: "formats" },
  { t: "00:38", id: "start" },
];

/** Fixed left rail: timecodes plus a playhead driven by scroll progress. */
function Rail({ progress }: { progress: number }) {
  return (
    <aside className="rail" aria-hidden="true">
      <div className="rail-mark">BUMPER</div>
      <div className="rail-ticks">
        <div className="playhead" style={{ top: `${progress * 100}%` }} />
        {TICKS.map((tick, i) => (
          <div
            key={tick.id}
            className="rail-tick"
            style={{ top: `${(i / (TICKS.length - 1)) * 100}%` }}
            data-active={progress * 100 >= (i / (TICKS.length - 1)) * 100 - 4}
          >
            {tick.t}
          </div>
        ))}
      </div>
      <div className="rail-mark">30 FPS</div>
    </aside>
  );
}

/** The hero graphic: a real lower third composited on an alpha checkerboard. */
function Stage() {
  const [play, setPlay] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => setPlay(true), 250);
    return () => window.clearTimeout(t);
  }, []);

  const replay = useCallback(() => {
    setPlay(false);
    setNonce((n) => n + 1);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => setPlay(true)));
  }, []);

  return (
    <div className="stage-wrap" data-play={play}>
      <div className="stage" data-play={play} key={nonce}>
        <span className="stage-tag mono">ALPHA</span>
        <div className="lower-third">
          <span className="lt-chip">N</span>
          <span className="lt-bar" />
          <span>
            <span className="lt-name" style={{ display: "block" }}>
              Asad Jehan Zeb
            </span>
            <span className="lt-role" style={{ display: "block" }}>
              Director of Photography
            </span>
          </span>
        </div>
      </div>
      <div className="transport">
        <span>00:00:01:18</span>
        <span className="transport-scrub">
          <span className="transport-fill" key={`f${nonce}`} />
        </span>
        <span>3.5s · 105f</span>
        <button className="replay" onClick={replay} type="button">
          REPLAY
        </button>
      </div>
    </div>
  );
}

/**
 * Six presets get bespoke thumbnails; the rest are listed by name. Both lists
 * are keyed off the real PRESETS array in the engine, so the site can never
 * advertise something the editor does not ship.
 */
const FEATURED_ART: { id: string; art: React.ReactNode }[] = [
  {
    id: "lower-third",
    art: (
      <span className="mini-lt">
        <i />
        <span>
          <span className="l1" />
          <span className="l2" />
        </span>
      </span>
    ),
  },
  { id: "subscribe", art: <span className="mini-sub">SUBSCRIBE</span> },
  {
    id: "section-card",
    art: (
      <span className="mini-card">
        <span className="k">CHAPTER 02</span>
        <span className="t" style={{ display: "block" }}>
          Rebuilding the desk
        </span>
        <span className="r" />
      </span>
    ),
  },
  {
    id: "end-screen",
    art: (
      <span className="mini-end">
        <span className="v" />
        <span className="a" />
        <span className="v" />
      </span>
    ),
  },
  { id: "swipe", art: <span className="mini-swipe" /> },
  { id: "intro-logo", art: <span className="mini-logo">N</span> },
];

const FEATURED = FEATURED_ART.map((f) => ({
  ...f,
  preset: PRESETS.find((p) => p.id === f.id)!,
})).filter((f) => f.preset);

const MORE_PRESETS = PRESETS.filter(
  (p) => !FEATURED_ART.some((f) => f.id === p.id)
);

const CLIPS = [
  { name: "Name", color: "var(--track-text)", left: "6%", right: "0%" },
  { name: "Role", color: "var(--track-text)", left: "16%", right: "0%" },
  { name: "Accent bar", color: "var(--track-shape)", left: "0%", right: "0%" },
  { name: "Logo", color: "var(--track-media)", left: "2%", right: "0%" },
  { name: "Whoosh", color: "var(--track-audio)", left: "0%", right: "83%" },
];

/** What the editor actually writes today. Sizes are from a 105-frame render. */
const FORMATS = [
  {
    chip: "PNG",
    name: "PNG sequence · ZIP",
    note: "Numbered stills, true alpha, imports into any NLE.",
    size: "7.0 MB",
    alpha: true,
  },
  {
    chip: "WEBM",
    name: "WebM · VP9",
    note: "One file, straight onto your timeline.",
    size: "1.4 MB",
    alpha: true,
  },
  {
    chip: "PNG",
    name: "Single frame · PNG",
    note: "One still for a thumbnail or a mock-up.",
    size: "84 KB",
    alpha: true,
  },
  {
    chip: "BAKED",
    name: "Your footage, baked in",
    note: "Drop a clip in and export the finished shot instead of an overlay.",
    size: "varies",
    alpha: false,
  },
];

export default function Home() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.setAttribute("data-shown", "true");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px" }
    );
    els.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i % 4, 3) * 60}ms`;
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <>
      <Rail progress={progress} />

      <div className="page">
        <header className="topbar">
          <Link href="/" className="brand">
            <span className="brand-mark">B</span>
            Bumper
          </Link>
          <div className="topbar-right">
            <a href="#why" className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
              WHY IT&rsquo;S FREE
            </a>
            <a href="#formats" className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
              FORMATS
            </a>
            <Link href="/signup" className="btn btn-primary">
              Start free
            </Link>
          </div>
        </header>

        {/* ------------------------------------------------------------ hero */}
        <section className="hero shell" id="top">
          <div className="hero-grid">
            <div>
              <p className="eyebrow">Motion graphics · rendered, not generated</p>
              <h1>
                Your video needs a lower third.
                <br />
                <span className="quiet">Not a subscription.</span>
              </h1>
              <p className="lede">
                Describe the graphic you need. Get three takes, tune one on a real
                timeline, and export a real video file — WebM with a real alpha
                channel, straight onto your edit.
              </p>
              <div className="hero-cta">
                <Link href="/signup" className="btn btn-primary btn-lg">
                  Start free — no card
                </Link>
                <a href="#why" className="btn btn-lg">
                  Why it costs nothing
                </a>
              </div>
              <div className="hero-meta mono">
                <span>
                  <b>105</b> frames
                </span>
                <span>
                  <b>11s</b> render
                </span>
                <span>
                  <b>$0.00</b> GPU cost
                </span>
                <span>
                  <b>∞</b> exports
                </span>
              </div>
            </div>
            <Stage />
          </div>
        </section>

        {/* -------------------------------------------------------- argument */}
        <section className="section shell" id="why">
          <div className="section-head">
            <h2 className="reveal">
              Motion graphics were never a generation problem.
            </h2>
            <p className="sub reveal">
              They&rsquo;re a rendering problem — and rendering is cheap. That one
              difference is the entire reason Bumper doesn&rsquo;t need a credit
              meter.
            </p>
          </div>

          <div className="argument">
            <div className="panel is-them reveal">
              <div className="panel-label">AI video tools</div>
              <ul className="claims">
                <li>
                  <span className="k">METHOD</span>
                  <span>A diffusion model paints every frame on a GPU.</span>
                </li>
                <li>
                  <span className="k">COST</span>
                  <span>GPU seconds are expensive, so you&rsquo;re metered per second.</span>
                </li>
                <li>
                  <span className="k">OUTPUT</span>
                  <span>Non-deterministic. The same prompt gives you a different clip.</span>
                </li>
                <li>
                  <span className="k">EDITING</span>
                  <span>Wrong word in the title? Re-generate and pay again.</span>
                </li>
              </ul>
            </div>

            <div className="panel is-us reveal">
              <div className="panel-label">Bumper</div>
              <ul className="claims">
                <li>
                  <span className="k">METHOD</span>
                  <span>HyperFrames renders HTML and CSS, frame by frame.</span>
                </li>
                <li>
                  <span className="k">COST</span>
                  <span>No GPU inference. There is nothing to meter.</span>
                </li>
                <li>
                  <span className="k">OUTPUT</span>
                  <span>Deterministic. Same input, same 105 frames, every time.</span>
                </li>
                <li>
                  <span className="k">EDITING</span>
                  <span>It&rsquo;s a text layer. Retype it and re-render for free.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="stat-row reveal">
            <div className="stat">
              <div className="v">4.1s</div>
              <div className="k">to render 3 takes</div>
            </div>
            <div className="stat hot">
              <div className="v">$0.00</div>
              <div className="k">GPU cost</div>
            </div>
            <div className="stat">
              <div className="v">∞</div>
              <div className="k">exports per month</div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- presets */}
        <section className="section shell" id="presets">
          <div className="section-head">
            <h2 className="reveal">Every piece a video actually needs.</h2>
            <p className="sub reveal">
              {PRESETS.length} presets, each a composition with real layers, real
              timing and real easing — not a template you fill in. Drop in your
              own footage and every one of them lays over it.
            </p>
          </div>

          <div className="presets">
            {FEATURED.map(({ id, art, preset }) => (
              <article className="preset reveal" key={id}>
                <div className="preset-thumb">{art}</div>
                <div className="preset-foot">
                  <span>{preset.name}</span>
                  <span className="d">{preset.duration.toFixed(1)}s</span>
                </div>
              </article>
            ))}
          </div>

          <ul className="preset-more reveal">
            {MORE_PRESETS.map((p) => (
              <li key={p.id}>
                <strong>{p.name}</strong>
                <span>{p.blurb}</span>
                <span className="d">{p.duration.toFixed(1)}s</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------------------------------------------------- editor */}
        <section className="section shell" id="editor">
          <div className="editor-grid">
            <div className="reveal">
              <div className="tl">
                <div className="tl-head">
                  <span>LOWER THIRD — BOXED</span>
                  <span>1920×1080 · 30fps · 105f</span>
                </div>
                <div className="tl-body">
                  <div className="tl-playhead" />
                  {CLIPS.map((c) => (
                    <div className="tl-row" key={c.name}>
                      <span className="tl-name">{c.name}</span>
                      <span className="tl-lane">
                        <span
                          className="tl-clip"
                          style={{
                            left: c.left,
                            right: c.right,
                            color: c.color,
                            background: `color-mix(in srgb, ${c.color} 20%, transparent)`,
                          }}
                        >
                          {c.name}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <p className="eyebrow reveal">The editor</p>
              <h2 className="reveal" style={{ marginTop: 12 }}>
                Then you actually control it.
              </h2>
              <ul className="feature-list">
                <li className="reveal">
                  <span className="n">01</span>
                  <div>
                    <h3>A real timeline</h3>
                    <p>
                      Five layers, per-clip in and out frames, and a playhead that
                      lands on the frame you mean.
                    </p>
                  </div>
                </li>
                <li className="reveal">
                  <span className="n">02</span>
                  <div>
                    <h3>Easing you can see</h3>
                    <p>
                      Pick a curve, watch the graph. Everything defaults to
                      cubic-bezier(0.16, 1, 0.3, 1) because it looks right.
                    </p>
                  </div>
                </li>
                <li className="reveal">
                  <span className="n">03</span>
                  <div>
                    <h3>One brand kit</h3>
                    <p>
                      Set your colours, type and logo once. Change a swatch and
                      every composition re-renders with it.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- formats */}
        <section className="section shell" id="formats">
          <div className="section-head">
            <h2 className="reveal">Real files. Real alpha.</h2>
            <p className="sub reveal">
              Not a screen recording, not a GIF. The transparent background
              survives the export, so it drops onto your timeline in Premiere,
              Resolve, Final Cut or CapCut.
            </p>
          </div>

          <div className="fmt reveal">
            <div className="fmt-row head">
              <span>Codec</span>
              <span>Format</span>
              <span style={{ textAlign: "right" }}>Size</span>
              <span style={{ textAlign: "right" }}>Alpha</span>
            </div>
            {FORMATS.map((f) => (
              <div className="fmt-row" key={f.chip}>
                <span className="fmt-chip">{f.chip}</span>
                <span className="fmt-name">
                  {f.name}
                  <span>{f.note}</span>
                </span>
                <span className="fmt-size">{f.size}</span>
                <span className={`fmt-alpha ${f.alpha ? "yes" : "no"}`}>
                  {f.alpha ? "with alpha" : "no alpha"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------- cta */}
        <section className="section shell" id="start">
          <div className="cta reveal">
            <p className="eyebrow">00:38 — the end screen</p>
            <h2>Make the thing your video is missing.</h2>
            <p>
              Free while it&rsquo;s in prototype, and free after — there is no GPU
              bill to pass on to you.
            </p>
            <div className="hero-cta">
              <Link href="/app" className="btn btn-primary btn-lg">
                Open the editor
              </Link>
              <a
                href={PRODUCT_URL}
                target="_blank"
                rel="noreferrer"
                className="btn btn-lg"
              >
                See the Flowstep file
              </a>
            </div>
          </div>

          <footer className="footer">
            <span>BUMPER · RENDERED WITH HYPERFRAMES · NO GPU INFERENCE</span>
            <nav>
              <Link href="/app">EDITOR</Link>
              <a href={PRODUCT_URL} target="_blank" rel="noreferrer">
                FLOWSTEP PROTOTYPE
              </a>
              <a href={CANVAS_URL} target="_blank" rel="noreferrer">
                FLOWSTEP CANVAS
              </a>
              <a href={REPO_URL} target="_blank" rel="noreferrer">
                GITHUB
              </a>
            </nav>
          </footer>
        </section>
      </div>
    </>
  );
}
