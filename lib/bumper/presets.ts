import {
  EASINGS,
  at,
  font,
  roundRect,
  tail,
  tracked,
  withAlpha,
  type Preset,
} from "./engine";

const E = EASINGS.expoOut;
const B = EASINGS.backOut;

/* --------------------------------------------------------- 1. Lower Third */

const lowerThird: Preset = {
  id: "lower-third",
  name: "Lower Third",
  duration: 3.5,
  blurb: "Name and role when someone speaks.",
  fields: [
    { key: "name", label: "Name", type: "text", value: "Asad Jehan Zeb", max: 28 },
    { key: "role", label: "Role", type: "text", value: "Director of Photography", max: 40 },
    { key: "mark", label: "Logo letter", type: "text", value: "N", max: 2 },
  ],
  layers: [
    { name: "Accent bar", color: "#FF8A5B", inFrame: 0 },
    { name: "Logo", color: "#B98CFF", inFrame: 3 },
    { name: "Name", color: "#6FA8FF", inFrame: 8 },
    { name: "Role", color: "#6FA8FF", inFrame: 20 },
  ],
  draw({ ctx, h, frame, totalFrames, props, brand, fonts }) {
    const out = tail(frame, totalFrames, 10);
    const x = 150;
    const baseY = h - 190;

    // accent bar — grows from its bottom edge
    const barP = at(frame, 0, 12, E);
    withAlpha(ctx, out, () => {
      ctx.fillStyle = brand.accent;
      const bh = 118 * barP;
      ctx.fillRect(x + 96, baseY + 118 - bh, 8, bh);
    });

    // logo chip
    const chipP = at(frame, 3, 14, E);
    withAlpha(ctx, chipP * out, () => {
      ctx.fillStyle = "#1B1B21";
      roundRect(ctx, x, baseY + 32, 72, 72, 14);
      ctx.fill();
      ctx.fillStyle = brand.accent;
      ctx.font = font(fonts, 700, 38);
      ctx.textAlign = "center";
      ctx.fillText(props.mark || "N", x + 36, baseY + 82);
      ctx.textAlign = "left";
    });

    // name — slide up + fade
    const nameP = at(frame, 8, 18, E);
    withAlpha(ctx, nameP * out, () => {
      ctx.fillStyle = brand.text;
      ctx.font = font(fonts, 700, 76);
      ctx.fillText(props.name || "", x + 136, baseY + 74 + (1 - nameP) * 26);
    });

    // role
    const roleP = at(frame, 20, 18, E);
    withAlpha(ctx, roleP * out, () => {
      ctx.fillStyle = brand.muted;
      ctx.font = font(fonts, 400, 36);
      ctx.fillText(props.role || "", x + 136, baseY + 126 + (1 - roleP) * 20);
    });
  },
};

/* ------------------------------------------------------ 2. Subscribe Bump */

const subscribeBump: Preset = {
  id: "subscribe",
  name: "Subscribe Bump",
  duration: 2,
  blurb: "The nudge, without the shouting.",
  fields: [
    { key: "label", label: "Button text", type: "text", value: "SUBSCRIBE", max: 18 },
    { key: "sub", label: "Caption", type: "text", value: "new videos every thursday", max: 40 },
  ],
  layers: [
    { name: "Button", color: "#FF8A5B", inFrame: 0 },
    { name: "Label", color: "#6FA8FF", inFrame: 6 },
    { name: "Cursor", color: "#B98CFF", inFrame: 14 },
    { name: "Caption", color: "#6FA8FF", inFrame: 26 },
  ],
  draw({ ctx, w, h, frame, totalFrames, props, brand, fonts }) {
    const out = tail(frame, totalFrames, 8);
    const cx = w / 2;
    const cy = h / 2;

    const inP = at(frame, 0, 16, B);
    // click pulse around frame 30
    const click = at(frame, 30, 6, EASINGS.easeInOut);
    const release = at(frame, 36, 8, E);
    const squash = 1 - click * 0.06 + release * 0.06;
    const scale = inP * squash;

    const bw = 460;
    const bh = 132;

    withAlpha(ctx, out, () => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.fillStyle = brand.accent;
      roundRect(ctx, -bw / 2, -bh / 2, bw, bh, 18);
      ctx.fill();

      const labelP = at(frame, 6, 14, E);
      withAlpha(ctx, labelP, () => {
        ctx.fillStyle = brand.backing;
        ctx.font = font(fonts, 700, 44);
        ctx.textAlign = "center";
        tracked(ctx, props.label || "", 0, 16, 4, "center");
        ctx.textAlign = "left";
      });
      ctx.restore();
    });

    // cursor slides in to the button, then clicks
    const curP = at(frame, 14, 18, E);
    withAlpha(ctx, curP * out, () => {
      const px = cx + 120 + (1 - curP) * 190;
      const py = cy + 44 + (1 - curP) * 150;
      ctx.save();
      ctx.translate(px, py);
      ctx.fillStyle = brand.text;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 40);
      ctx.lineTo(11, 30);
      ctx.lineTo(18, 45);
      ctx.lineTo(25, 41);
      ctx.lineTo(18, 27);
      ctx.lineTo(31, 25);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    const capP = at(frame, 26, 16, E);
    withAlpha(ctx, capP * out, () => {
      ctx.fillStyle = brand.muted;
      ctx.font = font(fonts, 400, 28, true);
      ctx.textAlign = "center";
      ctx.fillText(props.sub || "", cx, cy + 130 + (1 - capP) * 14);
      ctx.textAlign = "left";
    });
  },
};

/* --------------------------------------------------------- 3. Section Card */

const sectionCard: Preset = {
  id: "section-card",
  name: "Section Card",
  duration: 2.5,
  blurb: "A clean break between chapters.",
  fields: [
    { key: "kicker", label: "Kicker", type: "text", value: "CHAPTER 02", max: 24 },
    { key: "title", label: "Title", type: "text", value: "Rebuilding the desk", max: 34 },
  ],
  layers: [
    { name: "Kicker", color: "#6FA8FF", inFrame: 0 },
    { name: "Title", color: "#6FA8FF", inFrame: 8 },
    { name: "Rule", color: "#FF8A5B", inFrame: 18 },
  ],
  draw({ ctx, w, h, frame, totalFrames, props, brand, fonts }) {
    const out = tail(frame, totalFrames, 10);
    const cx = w / 2;
    const cy = h / 2;

    const kP = at(frame, 0, 16, E);
    withAlpha(ctx, kP * out, () => {
      ctx.fillStyle = brand.accent;
      ctx.font = font(fonts, 600, 26, true);
      tracked(ctx, (props.kicker || "").toUpperCase(), cx, cy - 62 - (1 - kP) * 10, 8, "center");
    });

    const tP = at(frame, 8, 20, E);
    withAlpha(ctx, tP * out, () => {
      ctx.fillStyle = brand.text;
      ctx.font = font(fonts, 700, 92);
      ctx.textAlign = "center";
      ctx.fillText(props.title || "", cx, cy + 30 + (1 - tP) * 22);
      ctx.textAlign = "left";
    });

    const rP = at(frame, 18, 20, E);
    withAlpha(ctx, out, () => {
      ctx.fillStyle = "#3A3A45";
      const rw = 220 * rP;
      ctx.fillRect(cx - rw / 2, cy + 78, rw, 2);
    });
  },
};

/* ----------------------------------------------------------- 4. End Screen */

const endScreen: Preset = {
  id: "end-screen",
  name: "End Screen",
  duration: 8,
  blurb: "Two slots, an avatar, and a thank you.",
  fields: [
    { key: "title", label: "Title", type: "text", value: "Thanks for watching", max: 30 },
    { key: "handle", label: "Handle", type: "text", value: "@northbound", max: 22 },
    { key: "mark", label: "Avatar letter", type: "text", value: "N", max: 2 },
  ],
  layers: [
    { name: "Title", color: "#6FA8FF", inFrame: 0 },
    { name: "Slot A", color: "#B98CFF", inFrame: 10 },
    { name: "Slot B", color: "#B98CFF", inFrame: 16 },
    { name: "Avatar", color: "#FF8A5B", inFrame: 24 },
  ],
  draw({ ctx, w, h, frame, totalFrames, props, brand, fonts }) {
    const out = tail(frame, totalFrames, 12);
    const cx = w / 2;

    const tP = at(frame, 0, 18, E);
    withAlpha(ctx, tP * out, () => {
      ctx.fillStyle = brand.text;
      ctx.font = font(fonts, 700, 78);
      ctx.textAlign = "center";
      ctx.fillText(props.title || "", cx, 250 + (1 - tP) * 24);
      ctx.textAlign = "left";
    });

    const slot = (i: number, startF: number) => {
      const p = at(frame, startF, 20, E);
      withAlpha(ctx, p * out, () => {
        const sw = 620;
        const sh = 349;
        const gap = 60;
        const x = cx - sw - gap / 2 + i * (sw + gap);
        const y = 360 + (1 - p) * 30;
        ctx.fillStyle = "#1B1B21";
        roundRect(ctx, x, y, sw, sh, 12);
        ctx.fill();
        ctx.strokeStyle = "#3A3A45";
        ctx.lineWidth = 2;
        roundRect(ctx, x, y, sw, sh, 12);
        ctx.stroke();
        // play glyph
        ctx.fillStyle = "#3A3A45";
        ctx.beginPath();
        ctx.moveTo(x + sw / 2 - 22, y + sh / 2 - 28);
        ctx.lineTo(x + sw / 2 + 30, y + sh / 2);
        ctx.lineTo(x + sw / 2 - 22, y + sh / 2 + 28);
        ctx.closePath();
        ctx.fill();
      });
    };
    slot(0, 10);
    slot(1, 16);

    const aP = at(frame, 24, 18, B);
    withAlpha(ctx, aP * out, () => {
      const ay = 830;
      ctx.save();
      ctx.translate(cx, ay);
      ctx.scale(aP, aP);
      ctx.fillStyle = brand.accent;
      ctx.beginPath();
      ctx.arc(0, 0, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = brand.backing;
      ctx.font = font(fonts, 700, 42);
      ctx.textAlign = "center";
      ctx.fillText(props.mark || "N", 0, 15);
      ctx.textAlign = "left";
      ctx.restore();

      ctx.fillStyle = brand.muted;
      ctx.font = font(fonts, 400, 30, true);
      ctx.textAlign = "center";
      ctx.fillText(props.handle || "", cx, ay + 106);
      ctx.textAlign = "left";
    });
  },
};

/* ------------------------------------------------------------ 5. Intro Logo */

const introLogo: Preset = {
  id: "intro-logo",
  name: "Intro Logo",
  duration: 4,
  blurb: "The three seconds before the video starts.",
  fields: [
    { key: "mark", label: "Logo letter", type: "text", value: "N", max: 2 },
    { key: "word", label: "Wordmark", type: "text", value: "NORTHBOUND", max: 22 },
  ],
  layers: [
    { name: "Mark", color: "#FF8A5B", inFrame: 0 },
    { name: "Wordmark", color: "#6FA8FF", inFrame: 14 },
    { name: "Rule", color: "#B98CFF", inFrame: 26 },
  ],
  draw({ ctx, w, h, frame, totalFrames, props, brand, fonts }) {
    const out = tail(frame, totalFrames, 14);
    const cx = w / 2;
    const cy = h / 2 - 30;

    const mP = at(frame, 0, 20, B);
    withAlpha(ctx, mP * out, () => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(mP, mP);
      ctx.fillStyle = brand.accent;
      roundRect(ctx, -80, -80, 160, 160, 32);
      ctx.fill();
      ctx.fillStyle = brand.backing;
      ctx.font = font(fonts, 700, 92);
      ctx.textAlign = "center";
      ctx.fillText(props.mark || "N", 0, 33);
      ctx.textAlign = "left";
      ctx.restore();
    });

    const wP = at(frame, 14, 22, E);
    withAlpha(ctx, wP * out, () => {
      ctx.fillStyle = brand.text;
      ctx.font = font(fonts, 600, 40);
      tracked(
        ctx,
        (props.word || "").toUpperCase(),
        cx,
        cy + 156 + (1 - wP) * 14,
        14,
        "center"
      );
    });

    const rP = at(frame, 26, 20, E);
    withAlpha(ctx, out, () => {
      ctx.fillStyle = brand.accent;
      const rw = 120 * rP;
      ctx.fillRect(cx - rw / 2, cy + 196, rw, 3);
    });
  },
};

export const PRESETS: Preset[] = [
  lowerThird,
  subscribeBump,
  sectionCard,
  endScreen,
  introLogo,
];

export function presetById(id: string): Preset {
  return PRESETS.find((p) => p.id === id) ?? PRESETS[0];
}

export function defaultProps(preset: Preset) {
  return Object.fromEntries(preset.fields.map((f) => [f.key, f.value]));
}
