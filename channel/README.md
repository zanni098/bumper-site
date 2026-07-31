# Faceless channel kit — teardown + production playbook

Derived from the workflow demonstrated in the reference video (a faceless
education/history channel rebuilt with an LLM + Higgsfield MCP), reconciled against
what the Higgsfield `faceless-channel-video` pipeline **actually** does.

---

## 1. What the reference video actually claims vs. what the pipeline does

The video compresses a lot. Here is the honest mapping, because the gap matters when
you budget time and credits.

| Video's claim | Reality in the pipeline |
|---|---|
| "One prompt makes the whole 5-minute video" | One *request* kicks it off, but the run is 9 phases: style key → asset roster → script → 30 clip jobs → 30 voice takes → assemble → captions → upscale → deliver. |
| "10 minutes end to end" | The generation jobs alone are 30 video jobs at ~1–3 min each, batched 4–8 in flight. Realistically 45–90 min wall-clock for 5 minutes of video. |
| "Seedance 2.0, 1080p" | The faceless-channel pipeline **locks** its models: `seedream_v5_pro` (stills/assets), `gemini_omni` (clips, 720p native), `seed_audio` (voice). 1080p comes from a mandatory Topaz upscale at the end, not from the clip model. |
| "Keeps the same characters and style across the whole clip" | True, and this is the real value — but it's mechanical, not magic: one locked 80–100 word style formula pasted byte-identical into every prompt, plus a generated asset roster attached as image references to every single clip. |
| "Claude fact-checks and researches on its own" | The pipeline *requires* it: a factual script with no absolute source URLs is rejected by the validator. |

**The part the video gets right, and it's the important part:** the format is the asset,
not the videos. Evergreen educational storytelling, cinematic visuals, a visual change
every 2 seconds, one narrator. That is legally and creatively fine to reproduce. Copying
their actual scripts or footage is not — that is a reused-content strike.

---

## 2. The format, reverse-engineered

The reference channel's videos (and the two examples shown in the video — Pompeii, Venice)
all run the same skeleton:

1. **Cold open, second person, present tense.** "See that mountain? In a few hours it will
   erase this entire city." No intro, no greeting, no channel branding. ≤8 words in the
   first sentence.
2. **Locate the viewer inside the story.** "You're a baker's apprentice. It's dawn,
   August 24th, 79 AD." The viewer is a character, not an audience.
3. **Concrete detail over adjectives.** Fast-food counters, election ads on walls, fish
   sauce shipped across the empire. Three or four specifics per beat, always countable.
4. **Escalating dread / escalating stakes.** Wells go dry, dogs bark, tremors — each beat
   strictly worse than the last. If two beats can swap order without loss, one is filler.
5. **The counterintuitive turn.** The thing the viewer thought was the story isn't. (Venice:
   the city isn't floating on water, it's standing on an upside-down forest.)
6. **A payoff that reframes the hook**, usually with a number that lands.

**Retention mechanics:** a visual change every 2 seconds, one idea per 10 seconds of
narration, and no shot size repeated back to back.

---

## 3. The pipeline, as actually wired

```
Phase 0  Intake ......... type · motion mode · style preset · duration · aspect · subs · topic · voice
Phase 1  Style key ...... 1× seedream_v5_pro, built ON reference images (never prose alone)
Phase 2  Asset roster ... characters (2:3) · locations (16:9) · props (1:1), all quoting the style formula
Phase 3  Script ......... N blocks of 10s, 27–32 words each, machine-validated before anything renders
Phase 4  Clips .......... N× gemini_omni, 10s each = FIVE hard cuts of ~2s, assets attached as refs
Phase 5  Voice .......... N× seed_audio, ONE locked voice_id, each take 8.6–10.0s of speech
Phase 6+7 Finish ........ one script call: assemble + caption burn (never hand-rolled ffmpeg)
Phase 8  Upscale ........ Topaz to 1080p (mandatory)
Phase 9  Deliver ........ upload → confirm → hosted URL
```

**Duration is fixed at N × 10s.** A 5-minute video is exactly 30 blocks. The video is never
trimmed to fit short audio; short audio gets rewritten instead.

### Non-obvious constraints that will bite you

- **Max 7 image references per clip call.** Plan the asset roster so no block needs more.
- **≤2 consecutive blocks per location.** A 30-block video needs ~8–12 distinct locations
  plus coverage angles, or it reads as a slideshow.
- **The clip model under-delivers cuts.** Ask for 5, frequently get 3–4. Cut counts are
  probed with `ffprobe` scene detection and under-delivering blocks get one regeneration
  with the cuts spelled out shot by shot.
- **NSFW rejection is a ~50% false positive.** It's a retry ladder, not a real block.
- **One voice, locked to an ID, read from a file before every call.** Resolving a voice by
  *name* mid-run is the single most common cause of "the timbre changes every block".
- **Characters never talk on screen.** No lip-sync; the narrator is external.

---

## 4. Real credit cost (preflighted on this account, not estimated)

| Item | Credits |
|---|---|
| 1 clip block (`gemini_omni`, 10s, 720p) | **30** |
| 1 image (`seedream_v5_pro`) — style key or asset | 3 |
| 1 voice take (`seed_audio`) | 0.2 |
| Caption transcription | 0.05 / voiced block |

**Cost per finished video** (style key + roster + blocks + takes, before retries):

| Length | Blocks | Approx. credits |
|---|---|---|
| 1 min | 6 | ~205 |
| 2 min | 12 | ~400 |
| **5 min** | **30** | **~940** |

Retries are not free — budget ~10–15% on top. At the $39/mo tier (1,000 credits) that is
roughly **one 5-minute video per month**; at $99/mo (3,000 credits), three.

This is the number the reference video never mentions, and it's the one that decides
whether the "content machine" is actually viable for you.

---

## 5. Topic shortlist for video #1

Education/history, evergreen, high retention, and — importantly — **not** one of the
reference channel's existing videos.

1. **The warship that sank because nobody dared tell the king** — Vasa, 1628. Sailed
   1,300 m on its maiden voyage. The stability test failed *before* launch and the result
   was never reported. *(Recommended — full script drafted in `vasa/`.)*
2. **The map of the world is wrong on purpose** — the Mercator projection, why Greenland
   looks like Africa, and what that did to five centuries of politics.
3. **The library of Alexandria did not burn down in one night** — it was defunded,
   slowly, over 300 years. The most boring apocalypse in history.
4. **The year without a summer** — 1816: a volcano in Indonesia caused snow in June in New
   England, famine in Europe, and, indirectly, *Frankenstein*.
5. **The city that moved itself** — Kiruna, Sweden: an entire town being relocated
   kilometre by kilometre because the mine beneath it is eating the ground.

---

## 6. Status of this kit

- ✅ Format teardown, pipeline map, real costs — done.
- ✅ Video #1 script (Vasa): arc, through-line, all 30 narration lines, 150 shots,
  research sources — `vasa/script.md`, `vasa/script_manifest.json`.
- ✅ **SCRIPT LOCK passed.** Run through the pipeline's own hard gate in the Higgsfield
  sandbox:
  ```
  python3 $HF_WORKFLOWS/faceless-channel-video/scripts/validate_motion_script.py \
    --script script_manifest.json --duration-seconds 300
  → {"valid": true, "expected_block_count": 30, "block_count": 30,
     "errors": [], "invalid_blocks": []}
  ```
  No clips or voice may be generated from a script that has not passed this.
- ✅ YouTube package: 3 titles, description with chapters, tags, 3 thumbnail concepts —
  `vasa/youtube-package.md`.
- ⛔ Generation (Phases 1–9) — **blocked on account access.** The connected Higgsfield
  workspace is on the free plan with 10 credits, and `use_unlim: true` was rejected by
  the backend ("Unlimited generations aren't available on this account"). Nothing was
  charged. Reconnect the Higgsfield connector under the account that holds the
  unlimited allowance; the run then goes straight from Phase 1 to delivery.

### Gate log

| Gate | Status |
|---|---|
| GATE 0 — intake | Partial: type/mode/style/duration/aspect/subs/topic set as defaults below; style gallery + voice picker still to open |
| GATE 1 — style key | Not started (needs generation) |
| GATE 2 — asset roster | Not started (needs generation) |
| **GATE 3 — script** | **PASSED** (`valid: true`) |
| GATE 4–9 | Not started |

Working intake defaults, to confirm or override at the start of the run:
`history · animated · Editorial Motion Graphics · 5 min (30 blocks) · 16:9 · subtitles on ·
voice Arthur (History) 30fc8796-ceb6-4a66-b3a7-4a145ef7f346`
