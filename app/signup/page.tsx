"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PRESETS } from "@/lib/bumper/presets";

const APP_URL = "/app";
const HANDOFF_MS = 1600;

const TRACK_COLORS = [
  "var(--track-text)",
  "var(--track-shape)",
  "var(--track-media)",
  "var(--track-audio)",
];

/** Read straight from the engine, so this list is what actually ships. */
const INCLUDED = PRESETS.map((p, i) => ({
  name: p.name,
  t: `${p.duration.toFixed(1)}s`,
  color: TRACK_COLORS[i % TRACK_COLORS.length],
}));

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [handoff, setHandoff] = useState(false);

  useEffect(() => {
    if (!handoff) return;
    const t = window.setTimeout(() => {
      window.location.href = APP_URL;
    }, HANDOFF_MS);
    return () => window.clearTimeout(t);
  }, [handoff]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setHandoff(true);
  }

  if (handoff) {
    return (
      <main className="handoff">
        <div className="handoff-inner">
          <span className="brand-mark" style={{ margin: "0 auto" }}>
            B
          </span>
          <h2>Setting up your workspace</h2>
          <p>
            Loading your presets and brand kit. This takes about as long as one
            render.
          </p>
          <div className="bar">
            <i />
          </div>
          <p className="mono">
            105 frames · deterministic · no GPU inference
          </p>
          <p className="mono" style={{ marginTop: 18 }}>
            Not redirecting?{" "}
            <Link
              href={APP_URL}
              style={{ color: "var(--lime)", borderBottom: "1px solid var(--lime)" }}
            >
              Open Bumper
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth">
      <div className="auth-main">
        <Link href="/" className="brand">
          <span className="brand-mark">B</span>
          Bumper
        </Link>

        <div className="auth-body">
          <p className="eyebrow">Create your workspace</p>
          <h1>Start making graphics.</h1>
          <p className="lede">
            One field, no card, no trial countdown. Exports are free because
            rendering HTML costs us almost nothing.
          </p>

          <form onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@channel.com"
                value={email}
                aria-invalid={Boolean(error)}
                aria-describedby="email-error"
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
              />
              <span className="err mono" id="email-error" role="alert">
                {error}
              </span>
            </div>

            <button type="submit" className="btn btn-primary btn-lg">
              Create workspace
            </button>
          </form>

          <p className="auth-note">
            NO ACCOUNTS YET — Bumper runs entirely in your browser, so there is
            nothing to sign into. No password is asked for and nothing you type
            is stored or sent anywhere. Continuing opens the editor.
          </p>

          <p className="auth-foot">
            Curious first?{" "}
            <Link href={APP_URL}>Skip and open the editor</Link>
          </p>
        </div>
      </div>

      <aside className="auth-aside">
        <div className="aside-caption">
          <span>In your workspace</span>
          <span>{PRESETS.length} presets</span>
        </div>

        <ul className="aside-list">
          {INCLUDED.map((item) => (
            <li key={item.name}>
              <span className="dot" style={{ background: item.color }} />
              {item.name}
              <span className="t">{item.t}</span>
            </li>
          ))}
        </ul>

        <div className="aside-caption">
          <span>Export formats</span>
          <span>alpha included</span>
        </div>

        <ul className="aside-list">
          <li>
            PNG sequence · ZIP
            <span className="t" style={{ color: "var(--track-audio)" }}>
              alpha
            </span>
          </li>
          <li>
            WebM · VP9
            <span className="t" style={{ color: "var(--track-audio)" }}>
              alpha
            </span>
          </li>
          <li>
            Single frame · PNG
            <span className="t" style={{ color: "var(--track-audio)" }}>
              alpha
            </span>
          </li>
          <li>
            Your own footage, baked in
            <span className="t">local</span>
          </li>
        </ul>
      </aside>
    </main>
  );
}
