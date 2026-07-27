"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PRODUCT_URL } from "../config";

const HANDOFF_MS = 2000;

const INCLUDED = [
  { name: "Lower Third", t: "3.5s", color: "var(--track-text)" },
  { name: "Subscribe Bump", t: "2.0s", color: "var(--track-shape)" },
  { name: "Section Card", t: "2.5s", color: "var(--track-media)" },
  { name: "End Screen", t: "8.0s", color: "var(--track-audio)" },
  { name: "Swipe Transition", t: "0.8s", color: "var(--track-text)" },
  { name: "Intro Logo", t: "4.0s", color: "var(--track-shape)" },
];

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
      window.location.href = PRODUCT_URL;
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
            <a
              href={PRODUCT_URL}
              style={{ color: "var(--lime)", borderBottom: "1px solid var(--lime)" }}
            >
              Open Bumper
            </a>
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
            PROTOTYPE — this is a demo sign-up for a concept product. No account
            is created, no password is asked for, and nothing you type is stored
            or sent anywhere. Continuing opens the Bumper prototype.
          </p>

          <p className="auth-foot">
            Curious first?{" "}
            <a href={PRODUCT_URL} target="_blank" rel="noreferrer">
              Skip and open the prototype
            </a>
          </p>
        </div>
      </div>

      <aside className="auth-aside">
        <div className="aside-caption">
          <span>In your workspace</span>
          <span>6 presets</span>
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
            WebM · VP9 + alpha
            <span className="t" style={{ color: "var(--track-audio)" }}>
              4.2 MB
            </span>
          </li>
          <li>
            ProRes 4444
            <span className="t" style={{ color: "var(--track-audio)" }}>
              84 MB
            </span>
          </li>
          <li>
            MP4 · H.264
            <span className="t">2.8 MB</span>
          </li>
        </ul>
      </aside>
    </main>
  );
}
