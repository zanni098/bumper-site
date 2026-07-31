# Bumper — marketing site

Landing page and sign-up flow for **Bumper**, a free motion-graphics tool for
YouTubers. Built for the Contra [#FlowstepChallenge](https://contra.com/community/topic/flowstepchallenge/guidelines).

**Product prototype:** [Bumper in Flowstep](https://app.flowstep.ai/prototype?activeFileId=22ceed96-9211-4b25-9fb2-81c452733386)
**Design canvas:** [Flowstep file](https://app.flowstep.ai/file?activeFileId=22ceed96-9211-4b25-9fb2-81c452733386)

---

## The idea

Every YouTube video needs the same small animated pieces — a lower third when
someone speaks, a section card between chapters, a subscribe bump, an end
screen. Today you either pay a monthly motion-graphics subscription, wrestle
with After Effects, or generate something with an AI video tool that charges
credits per second.

Bumper's argument is that **motion graphics were never a generation problem —
they're a rendering problem.** AI video tools meter you by the second because
they're running a diffusion model on a GPU. Bumper's graphics are HyperFrames
compositions: plain HTML and CSS rendered deterministically, frame by frame. No
GPU inference means there is nothing to meter, so exports can be free.

## Routes

| Route     | What it is                                                   |
| --------- | ------------------------------------------------------------ |
| `/`       | Landing page — the argument, presets, editor, export formats |
| `/signup` | Sign-up, which hands off into the editor                     |
| `/app`    | **The actual product** — working editor and exporter         |

### The editor is real

`/app` is not a mockup. It is a working motion-graphics tool:

- **Five presets** — Lower Third, Subscribe Bump, Section Card, End Screen,
  Intro Logo — each a real composition with layered, staggered animation.
- **A deterministic canvas renderer.** Every frame is a pure function of
  `(frameIndex, props, brand)`. Same input, same pixels, every run.
- **Live editing** of text content and brand colours, with the brand kit
  persisted to `localStorage` and shared across every preset.
- **Scrubbable timeline** with per-layer clips and a playhead.
- **Real exports**, produced in the browser:
  - **PNG sequence (ZIP)** — true alpha, one PNG per frame. The ZIP is written
    by hand using the STORE method with pinned timestamps, so byte-identical
    input produces a byte-identical archive.
  - **WebM** via `MediaRecorder`, frame-stepped rather than wall-clock timed.
  - **Single frame PNG** with alpha.

There is no backend, no upload, and no export limit — which is the whole point.
Rendering HTML and canvas costs nothing per frame, so there is nothing to meter.

### About the sign-up

It is a **front door, not real auth**. It asks for an email only — no password
is ever requested — validates the format client-side, and opens the editor.
Nothing is stored, transmitted, or sent to any backend, and the page says so in
plain language. There is no database and no API route.

## Design

The site deliberately shares its tokens with the product UI so the two read as
one thing: `#0B0B0D` base, `#131317` panels, hairline `#2A2A32` borders, and a
strictly rationed `#D6FF4B` lime that only ever appears on the primary action,
the playhead, active states and the render-complete state.

The structural idea is that **the page is a timeline**. A fixed left rail
carries timecodes with a lime playhead that tracks scroll progress, sections
read as clips, and every number on the page is set in JetBrains Mono — the same
typographic rule the product uses.

- **Display:** Bricolage Grotesque
- **Body:** Archivo
- **Mono:** JetBrains Mono

Motion respects `prefers-reduced-motion`. The hero lower-third animates on the
product's own easing curve, `cubic-bezier(0.16, 1, 0.3, 1)`.

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- Plain CSS — no UI framework, no utility classes
- `next/font` for self-hosted fonts, so no external font requests

## Local development

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

```bash
npm run build
```

## Deployment

Deployed on Vercel from this repository. Pushes to `main` deploy automatically.
