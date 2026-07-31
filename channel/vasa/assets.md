# Phase 2 — asset roster prompts (Stickman Cartoon)

Locked style formula, pasted **byte-identical** into every prompt below. This is the
entire consistency mechanism — do not paraphrase it, ever.

```
{STYLE} = flat 2D webcomic cartoon, extremely minimal — uniform thin even-weight
black outlines, egg-shaped heads with tiny dot eyes and a single line mouth, plain
noodle limbs, solid flat color fills with NO shading, NO gradients, NO texture,
deadpan minimalist design, plain flat solid-color backgrounds.
```

- **Model:** `seedream_v4_5` (Seedream 5 Pro is not covered by this account's unlimited).
- **Every call attaches the style key** (`d55810bd-…`) as `image_references`.
- **{MOTION}** for later block prompts (flat 2D family): `simple limited animation on twos`.
- **Style card donor:** `724b97ee-ff4c-4cd1-b9ad-05a674d68615` (Stickman Cartoon).

## Characters — aspect 2:3

Template: *"Full-body character centered on a plain flat solid-color background, in THIS
EXACT style: {STYLE}. Character: {desc}. No text, no watermark."*

| id | Description |
|---|---|
| `jakobsson` | A thin stick figure in a flat brown apron, egg-shaped head, tiny dot eyes, single flat line mouth, holding a small rolled paper. Anxious posture, shoulders slightly raised. |
| `fleming` | A stick figure in a flat dark navy coat with a small flat white collar band, egg-shaped head, tiny dot eyes, straight line mouth, arms at sides. Stiff upright posture. |
| `gunner` | A short stick figure in a flat off-white shirt and flat red cap, egg-shaped head, tiny dot eyes, small line mouth. Neutral standing pose. |
| `king` | A tall stick figure in a flat gold-yellow cloak with a simple flat crown of three points, egg-shaped head, tiny dot eyes, flat line mouth. Arms folded. |

## Locations — aspect 16:9

Template: *"{interior/exterior} … in THIS EXACT style: {STYLE}. {furnishings + ONE named
anchor object with a position}. Empty room — no people, no characters, no figures. Wide
establishing. No text, no watermark."*

| id | Description (anchor object in **bold**) |
|---|---|
| `shipyard` | Exterior slipway. **A large flat brown ship hull in a timber cradle, centre frame**, plain scaffolding poles either side, flat blue sky band above, flat grey ground. |
| `warroom` | Interior tent. **A flat rectangular map table centre frame**, three candle shapes on it, plain flat cream tent walls, one banner shape at left. |
| `timberyard` | Exterior yard. **A stack of flat brown logs at right frame**, a simple sawpit rectangle at left, flat pale ground, plain flat sky. |
| `carvingshop` | Interior workshop. **A long flat workbench across the frame**, small carved shapes on it, tool silhouettes hanging on the back wall, flat tan walls. |
| `gundeck` | Interior lower deck. **A row of flat black cannon shapes receding to the right**, square gun ports along the left wall, flat brown floor and low flat ceiling beams. |
| `ballasthold` | Interior hold, dark. **A heap of flat grey oval stones centre frame**, curved flat hull ribs either side, one small lantern shape at upper left. |
| `upperdeck` | Exterior weather deck. **A flat wooden capstan drum centre frame**, plain rails along both sides, mast base at rear, flat blue sky band. |
| `quay` | Exterior stone quay. **A flat stone bollard at lower left**, the ship's hull side filling the right of frame, flat grey paving, flat blue water strip. |
| `openwater` | Exterior open sea. **A flat grey-blue water plane filling the lower two thirds**, a low flat green cliff band at left, plain flat pale sky above. |
| `wreck` | Underwater, dark. **A flat dark ship hull lying on its side across the frame**, flat teal-black water field, a few pale bubble circles, flat silt floor. |
| `salvagebarge` | Exterior harbour. **Two flat rectangular pontoon shapes either side of frame**, taut flat cable lines between them, flat grey water, flat pale sky. |
| `museumhall` | Interior dim hall. **A tall flat ship hull silhouette centre frame lit from below**, flat walkway rails at two heights, flat dark blue walls. |

## Props — aspect 1:1

Template: *"A single isolated prop centered on a plain flat solid-color background, in THIS
EXACT style: {STYLE}. Object: {desc}. No hands, no scene, no other objects. No watermark."*

| id | Description |
|---|---|
| `lionlid` | **THE THROUGH-LINE.** A square wooden hatch lid with a simple flat gold lion's face on it — round face, two dot eyes, a flat mane ring, a small line mouth. Flat gold fill, thin black outline. |
| `cannon` | A simple flat black cannon barrel on a small two-wheeled carriage, side view. |
| `ballaststone` | A single rough flat grey oval stone. |
| `ledger` | An open flat cream book with plain ruled lines and no readable writing. |

**18 assets total** (4 characters + 12 locations + 4 props) + 1 style key.

## Ordering rule for block calls

References go **location → characters → props**, max 7 per call. Every block includes
`lionlid` (the through-line). No block in this script exceeds 6 refs.

## Deviation notice

The pipeline locks `gemini_omni` for clips, which this account cannot run
(`403 free_trial_model_requires_plan`; no unlimited coverage at 10s or 8s). The
substitute path is:

1. Compose each shot as a **still** with `seedream_v4_5`, referencing the asset roster —
   consistency is carried here, where references still work.
2. Animate the still with `kling3_0` at 720p/5s via `start_image` — Kling adds motion only.
3. Join clip pairs into 10s blocks, then run the standard assembler with the 30 voice takes.

This is a documented deviation, not the locked pipeline. It costs the native 10s
multi-reference blocks and doubles the job count.
