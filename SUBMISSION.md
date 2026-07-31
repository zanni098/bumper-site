# Bumper — Flowstep Challenge submission

## Links

| What | URL |
|---|---|
| **Flowstep prototype** (clickable, 5 screens) | https://app.flowstep.ai/prototype?activeFileId=22ceed96-9211-4b25-9fb2-81c452733386 |
| **Flowstep canvas** (for the "show your canvas" bonus) | https://app.flowstep.ai/file?activeFileId=22ceed96-9211-4b25-9fb2-81c452733386 |
| **The working product** | https://bumper-site.vercel.app/app |
| Landing page | https://bumper-site.vercel.app |
| Source | https://github.com/zanni098/bumper-site |

---

## Short description (for the submission form)

**Bumper — free motion graphics for YouTube.**

Every video needs the same small animated pieces: a lower third, captions, a
subscribe bump, an end screen. AI video tools charge per second for these,
because they run a diffusion model on a GPU to paint every frame.

Motion graphics were never a generation problem. They're a rendering problem —
and rendering is cheap. Bumper draws every frame deterministically from HTML,
CSS and canvas. Same input, same pixels, every run. There's no GPU bill, so
there's nothing to meter, so it can just be free.

I designed it in Flowstep over MCP, then built the real thing from that design.
It's live: 13 presets, drop your own photo or video underneath any of them, and
export a transparent overlay for your timeline or the finished shot with the
footage baked in. Everything runs in your browser — the footage never uploads.

---

## What's in the prototype

1. **New graphic** — all 13 presets on an alpha checkerboard
2. **Add footage** — drop a photo or video under the graphic
3. **Editor** — footage composited under a caption, real layers on a timeline
4. **Brand kit** — three colours that drive all 13 compositions
5. **Export** — PNG sequence, WebM VP9, single PNG; baked or alpha

---

## Process — the part worth showing

**The generator would not draw an alpha checkerboard.** It kept emitting a
malformed `repeating-conic-gradient` that rendered as four giant quadrants, and
re-broke it on every subsequent edit. So I pulled the JSX back through
`get-screen`, fixed the CSS by hand, and pushed it back with `add-screen`.
Canvas → code → canvas, not one-way generation.

**Flowstep orders the prototype by screen creation order, not canvas position.**
I found this the hard way: repositioning frames fixed the canvas and changed the
prototype not at all. There's no ordering control in the UI. So I rebuilt the
creation order through the API instead.

**Two AI operations failed and I kept the receipts.** `regenerate-design`
ignored my brief and silently re-ran the screen's *old* stored prompt.
`edit-design` fixed what I asked for but broke the screen's toggle styling and
checkerboard around it. Both are documented in the file's chat history. The
code-first path via `add-screen` is what actually shipped every screen — and it
costs zero agent messages.

Total Flowstep spend: 14 of 80 monthly messages.

---

## Verified, not claimed

Checked in headless Chromium against the production build:

- All 13 presets render non-empty with a real alpha channel
- A 105-frame composition keeps **2,048,804 fully transparent pixels** —
  a genuine alpha channel, not a dark background
- The PNG sequence ZIP is a valid archive, read back byte-level:
  `PK\x03\x04` header → `lower-third_0000.png` starting with the PNG magic
  number → `PK\x05\x06` EOCD → 105 entries
- **7.6 MB** as a transparent overlay vs **38.2 MB** with footage baked in —
  the footage is really there
- Production returned pixel counts identical to local, on different hardware.
  That's the determinism claim proving itself.

---

## Social post

> Every YouTube video needs the same few graphics. AI tools charge per second
> for them, because they're running diffusion on a GPU.
>
> Motion graphics were never a generation problem. They're a rendering problem
> — and rendering is free.
>
> So I built Bumper: 13 presets, drop your own footage under any of them, export
> a transparent overlay or the finished shot. Runs entirely in your browser.
>
> Designed in @flowstep_ai over MCP, then built for real. Both links below 👇
>
> #FlowstepChallenge

Attach: the 30-second walkthrough. Tag any other tools you used.

---

## Walkthrough script (~2 min)

| Time | Beat |
|---|---|
| 0:00–0:15 | The problem. "Every video needs a lower third. Why does that cost credits?" |
| 0:15–0:30 | The Flowstep canvas — all 5 screens, the flow left to right |
| 0:30–1:00 | Open the live editor. Pick Caption Pop. **Drag a clip onto the canvas.** It composites instantly |
| 1:00–1:20 | Hit render. Show the ZIP landing on your desktop. Open it — numbered PNGs with real alpha |
| 1:20–1:45 | The MCP round trip in the terminal: `get-screen` → hand-fix → `add-screen`. Say why the prompt-only path failed |
| 1:45–2:00 | "No GPU, nothing to meter, so it's free." End on the live URL |

The strongest single beat is dragging footage in and hitting render — that's the
thesis proving itself on screen instead of being asserted.
