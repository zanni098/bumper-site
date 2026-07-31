import {
  EASINGS,
  FPS,
  at,
  font,
  lerp,
  plate,
  roundRect,
  tail,
  tracked,
  withAlpha,
  wrapText,
  type Preset,
} from "./engine";

const E = EASINGS.expoOut;
const B = EASINGS.backOut;
const IO = EASINGS.easeInOut;

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

/* --------------------------------------------------------- 6. Caption Pop */

const captionPop: Preset = {
  id: "caption",
  name: "Caption Pop",
  duration: 3,
  blurb: "Word-by-word captions that sit over footage.",
  fields: [
    {
      key: "line",
      label: "Caption",
      type: "text",
      value: "this is the part everyone rewinds",
      max: 90,
    },
  ],
  layers: [
    { name: "Plate", color: "#FF8A5B", inFrame: 0 },
    { name: "Words", color: "#6FA8FF", inFrame: 4 },
  ],
  draw({ ctx, w, h, frame, totalFrames, props, brand, fonts }) {
    const out = tail(frame, totalFrames, 8);
    const words = (props.line || "").split(/\s+/).filter(Boolean);
    if (!words.length) return;

    ctx.font = font(fonts, 700, 58);
    const space = ctx.measureText(" ").width;
    const maxWidth = w * 0.72;

    // Lay words out into centred lines, keeping each word's own box so we can
    // reveal and highlight them individually.
    const lines: { text: string; width: number }[][] = [[]];
    let lineWidth = 0;
    for (const word of words) {
      const width = ctx.measureText(word).width;
      const next = lineWidth === 0 ? width : lineWidth + space + width;
      if (next > maxWidth && lineWidth > 0) {
        lines.push([]);
        lineWidth = width;
      } else {
        lineWidth = next;
      }
      lines[lines.length - 1].push({ text: word, width });
    }

    const lineHeight = 76;
    const blockH = lines.length * lineHeight;
    const bottom = h - 140;
    const top = bottom - blockH;

    // widest line drives the plate
    const widths = lines.map(
      (l) => l.reduce((sum, x) => sum + x.width, 0) + space * (l.length - 1)
    );
    const widest = Math.max(...widths);

    const plateP = at(frame, 0, 12, E);
    withAlpha(ctx, plateP * out, () => {
      const padX = 44;
      const padY = 26;
      plate(
        ctx,
        w / 2 - widest / 2 - padX,
        top - padY + 8,
        widest + padX * 2,
        blockH + padY * 2 - 12,
        16
      );
    });

    let index = 0;
    lines.forEach((line, li) => {
      let x = w / 2 - widths[li] / 2;
      const y = top + li * lineHeight + 58;
      for (const word of line) {
        const start = 4 + index * 3;
        const p = at(frame, start, 10, E);
        // the most recently revealed word carries the accent, then settles
        const heat = 1 - at(frame, start + 6, 12, IO);
        withAlpha(ctx, p * out, () => {
          ctx.font = font(fonts, 700, 58);
          ctx.fillStyle = heat > 0.5 ? brand.accent : brand.text;
          ctx.fillText(word.text, x, y + (1 - p) * 10);
        });
        x += word.width + space;
        index++;
      }
    });
  },
};

/* ----------------------------------------------------- 7. Callout Pointer */

const calloutPointer: Preset = {
  id: "callout",
  name: "Callout Pointer",
  duration: 2.8,
  blurb: "Point at the thing you just mentioned.",
  fields: [
    { key: "label", label: "Label", type: "text", value: "the render queue", max: 30 },
    { key: "sub", label: "Detail", type: "text", value: "105 frames · 4.1s", max: 28 },
  ],
  layers: [
    { name: "Target", color: "#FF8A5B", inFrame: 0 },
    { name: "Leader", color: "#B98CFF", inFrame: 6 },
    { name: "Label", color: "#6FA8FF", inFrame: 18 },
  ],
  draw({ ctx, w, h, frame, totalFrames, props, brand, fonts }) {
    const out = tail(frame, totalFrames, 10);
    const tx = w * 0.38;
    const ty = h * 0.58;
    const elbowX = tx + 190;
    const elbowY = ty - 150;
    const endX = elbowX + 150;

    // target ring — pulses once as it lands
    const ringP = at(frame, 0, 16, B);
    withAlpha(ctx, ringP * out, () => {
      ctx.strokeStyle = brand.accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(tx, ty, 26 * ringP, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = brand.accent;
      ctx.beginPath();
      ctx.arc(tx, ty, 7, 0, Math.PI * 2);
      ctx.fill();
    });
    // expanding halo, fades as it grows
    const halo = at(frame, 4, 26, E);
    withAlpha(ctx, (1 - halo) * 0.7 * out, () => {
      ctx.strokeStyle = brand.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tx, ty, 26 + halo * 54, 0, Math.PI * 2);
      ctx.stroke();
    });

    // leader line draws itself: diagonal first, then the horizontal run
    const legA = at(frame, 6, 12, IO);
    const legB = at(frame, 14, 12, IO);
    withAlpha(ctx, out, () => {
      ctx.strokeStyle = brand.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tx + 18, ty - 14);
      ctx.lineTo(lerp(tx + 18, elbowX, legA), lerp(ty - 14, elbowY, legA));
      ctx.stroke();
      if (legB > 0) {
        ctx.beginPath();
        ctx.moveTo(elbowX, elbowY);
        ctx.lineTo(lerp(elbowX, endX, legB), elbowY);
        ctx.stroke();
      }
    });

    const labelP = at(frame, 18, 18, E);
    withAlpha(ctx, labelP * out, () => {
      const x = endX + 18 - (1 - labelP) * 16;
      ctx.font = font(fonts, 700, 46);
      const lw = ctx.measureText(props.label || "").width;
      ctx.font = font(fonts, 400, 26, true);
      const sw = ctx.measureText(props.sub || "").width;
      const boxW = Math.max(lw, sw) + 56;

      plate(ctx, x, elbowY - 62, boxW, 118, 14);
      ctx.fillStyle = brand.accent;
      ctx.fillRect(x, elbowY - 62, 4, 118);

      ctx.fillStyle = brand.text;
      ctx.font = font(fonts, 700, 46);
      ctx.fillText(props.label || "", x + 28, elbowY - 12);
      ctx.fillStyle = brand.muted;
      ctx.font = font(fonts, 400, 26, true);
      ctx.fillText(props.sub || "", x + 28, elbowY + 30);
    });
  },
};

/* -------------------------------------------------------- 8. Stat Counter */

const statCounter: Preset = {
  id: "stat",
  name: "Stat Counter",
  duration: 3.2,
  blurb: "A number that counts itself up.",
  fields: [
    { key: "value", label: "Value", type: "text", value: "128400", max: 12 },
    { key: "suffix", label: "Suffix", type: "text", value: "", max: 6 },
    { key: "label", label: "Label", type: "text", value: "SUBSCRIBERS", max: 26 },
    { key: "delta", label: "Delta chip", type: "text", value: "+12.4% this month", max: 24 },
  ],
  layers: [
    { name: "Number", color: "#6FA8FF", inFrame: 0 },
    { name: "Label", color: "#6FA8FF", inFrame: 14 },
    { name: "Delta", color: "#FF8A5B", inFrame: 24 },
  ],
  draw({ ctx, w, h, frame, totalFrames, props, brand, fonts }) {
    const out = tail(frame, totalFrames, 12);
    const cx = w / 2;
    const cy = h / 2;

    const target = parseFloat((props.value || "0").replace(/[^0-9.]/g, "")) || 0;
    const countP = at(frame, 0, 46, E);
    const shown = Math.round(target * countP);
    const text = shown.toLocaleString("en-US") + (props.suffix || "");

    const inP = at(frame, 0, 18, E);
    withAlpha(ctx, inP * out, () => {
      ctx.fillStyle = brand.text;
      ctx.font = font(fonts, 700, 168, true);
      ctx.textAlign = "center";
      ctx.fillText(text, cx, cy + 30 + (1 - inP) * 20);
      ctx.textAlign = "left";
    });

    const lP = at(frame, 14, 18, E);
    withAlpha(ctx, lP * out, () => {
      ctx.fillStyle = brand.muted;
      ctx.font = font(fonts, 600, 30);
      tracked(ctx, (props.label || "").toUpperCase(), cx, cy + 96, 10, "center");
    });

    const dP = at(frame, 24, 18, B);
    const delta = props.delta || "";
    if (delta) {
      withAlpha(ctx, dP * out, () => {
        ctx.font = font(fonts, 500, 26, true);
        const tw = ctx.measureText(delta).width;
        const bw = tw + 52;
        const bx = cx - bw / 2;
        const by = cy + 140;
        ctx.fillStyle = brand.accent;
        roundRect(ctx, bx, by, bw, 52, 26);
        ctx.fill();
        ctx.fillStyle = brand.backing;
        ctx.textAlign = "center";
        ctx.fillText(delta, cx, by + 35);
        ctx.textAlign = "left";
      });
    }
  },
};

/* ---------------------------------------------------- 9. Swipe Transition */

const swipeTransition: Preset = {
  id: "swipe",
  name: "Swipe Transition",
  duration: 0.8,
  blurb: "Cover the cut, then get out of the way.",
  fields: [
    { key: "word", label: "Flash text", type: "text", value: "NEXT", max: 16 },
  ],
  layers: [
    { name: "Accent wipe", color: "#FF8A5B", inFrame: 0 },
    { name: "Panel", color: "#B98CFF", inFrame: 2 },
    { name: "Flash text", color: "#6FA8FF", inFrame: 9 },
  ],
  draw({ ctx, w, h, frame, totalFrames, props, brand, fonts }) {
    // Two panels sweep across on a skew, offset so the accent edge leads in
    // and trails out. Nothing fades — a transition should never be translucent.
    const skew = 120;
    const span = w + skew * 2;

    const panel = (startF: number, exitF: number, fill: string) => {
      const inP = at(frame, startF, 10, IO);
      const outP = at(frame, exitF, 10, IO);
      const left = lerp(-span, 0, inP) + lerp(0, span, outP);
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(left + skew, -2);
      ctx.lineTo(left + span, -2);
      ctx.lineTo(left + span - skew, h + 2);
      ctx.lineTo(left, h + 2);
      ctx.closePath();
      ctx.fill();
    };

    panel(0, 13, brand.accent);
    panel(2, 15, "#141418");

    const wordP = at(frame, 9, 6, E);
    const wordOut = 1 - at(frame, 15, 5, IO);
    withAlpha(ctx, wordP * wordOut, () => {
      ctx.fillStyle = brand.text;
      ctx.font = font(fonts, 700, 96);
      tracked(ctx, (props.word || "").toUpperCase(), w / 2, h / 2 + 34, 18, "center");
    });

    void totalFrames;
  },
};

/* --------------------------------------------------- 10. Notification Toast */

const notificationToast: Preset = {
  id: "toast",
  name: "Notification Toast",
  duration: 3.5,
  blurb: "A member joined, a tip landed, a milestone hit.",
  fields: [
    { key: "title", label: "Title", type: "text", value: "New member", max: 24 },
    { key: "body", label: "Body", type: "text", value: "@rafi.builds joined at tier 2", max: 40 },
    { key: "mark", label: "Avatar letter", type: "text", value: "R", max: 2 },
  ],
  layers: [
    { name: "Card", color: "#FF8A5B", inFrame: 0 },
    { name: "Avatar", color: "#B98CFF", inFrame: 6 },
    { name: "Text", color: "#6FA8FF", inFrame: 10 },
    { name: "Timer", color: "#4ED8A0", inFrame: 16 },
  ],
  draw({ ctx, w, frame, totalFrames, props, brand, fonts }) {
    // Size the card to its contents so a long handle never runs off the edge.
    ctx.font = font(fonts, 700, 40);
    const titleW = ctx.measureText(props.title || "").width;
    ctx.font = font(fonts, 400, 27, true);
    const bodyW = ctx.measureText(props.body || "").width;
    const cardW = Math.min(1180, Math.max(660, 156 + Math.max(titleW, bodyW) + 52));
    const cardH = 168;
    const x = w - cardW - 90;
    const y = 90;

    // slides in from the right edge, then slides back out
    const inP = at(frame, 0, 20, E);
    const outP = at(frame, totalFrames - 16, 14, IO);
    const dx = lerp(cardW + 120, 0, inP) + lerp(0, cardW + 140, outP);

    ctx.save();
    ctx.translate(dx, 0);

    plate(ctx, x, y, cardW, cardH, 20, "#15151AF2");
    ctx.strokeStyle = "#3A3A45";
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, cardW, cardH, 20);
    ctx.stroke();

    const aP = at(frame, 6, 16, B);
    withAlpha(ctx, aP, () => {
      const ax = x + 46 + 44;
      const ay = y + cardH / 2;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.scale(aP, aP);
      ctx.fillStyle = brand.accent;
      ctx.beginPath();
      ctx.arc(0, 0, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = brand.backing;
      ctx.font = font(fonts, 700, 40);
      ctx.textAlign = "center";
      ctx.fillText(props.mark || "R", 0, 14);
      ctx.textAlign = "left";
      ctx.restore();
    });

    const tP = at(frame, 10, 16, E);
    withAlpha(ctx, tP, () => {
      const tx = x + 156;
      ctx.fillStyle = brand.text;
      ctx.font = font(fonts, 700, 40);
      ctx.fillText(props.title || "", tx, y + 74);
      ctx.fillStyle = brand.muted;
      ctx.font = font(fonts, 400, 27, true);
      ctx.fillText(props.body || "", tx, y + 118);
    });

    // dwell timer draining along the bottom edge
    const timer = at(frame, 16, totalFrames - 34, EASINGS.linear);
    ctx.fillStyle = brand.accent;
    const barW = (cardW - 40) * (1 - timer);
    ctx.fillRect(x + 20, y + cardH - 10, barW, 4);

    ctx.restore();
  },
};

/* --------------------------------------------------------- 11. Corner Bug */

const cornerBug: Preset = {
  id: "corner-bug",
  name: "Corner Bug",
  duration: 5,
  blurb: "The watermark that sits in the corner all video.",
  fields: [
    { key: "mark", label: "Logo letter", type: "text", value: "N", max: 2 },
    { key: "handle", label: "Handle", type: "text", value: "@northbound", max: 22 },
  ],
  layers: [
    { name: "Chip", color: "#FF8A5B", inFrame: 0 },
    { name: "Handle", color: "#6FA8FF", inFrame: 8 },
  ],
  draw({ ctx, w, h, frame, totalFrames, props, brand, fonts }) {
    // Long dwell, quiet in and out — a bug is furniture, not an event.
    const inP = at(frame, 0, 20, E);
    const out = tail(frame, totalFrames, 20);
    const alpha = inP * out * 0.92;

    const handle = props.handle || "";
    ctx.font = font(fonts, 500, 26, true);
    const hw = handle ? ctx.measureText(handle).width : 0;

    const chip = 68;
    const padX = 20;
    const gap = handle ? 16 : 0;
    const boxW = padX * 2 + chip + gap + hw;
    const boxH = 108;
    const x = w - boxW - 72;
    const y = h - boxH - 72;

    withAlpha(ctx, alpha, () => {
      plate(ctx, x, y, boxW, boxH, 16, "#0B0B0DCC");

      ctx.fillStyle = brand.accent;
      roundRect(ctx, x + padX, y + (boxH - chip) / 2, chip, chip, 14);
      ctx.fill();
      ctx.fillStyle = brand.backing;
      ctx.font = font(fonts, 700, 36);
      ctx.textAlign = "center";
      ctx.fillText(props.mark || "N", x + padX + chip / 2, y + boxH / 2 + 13);
      ctx.textAlign = "left";

      const hP = at(frame, 8, 18, E);
      withAlpha(ctx, hP, () => {
        ctx.fillStyle = brand.text;
        ctx.font = font(fonts, 500, 26, true);
        ctx.fillText(handle, x + padX + chip + gap, y + boxH / 2 + 10);
      });
    });
  },
};

/* ---------------------------------------------------------- 12. Countdown */

const countdown: Preset = {
  id: "countdown",
  name: "Countdown",
  duration: 5,
  blurb: "Starting soon, with a ring that actually ticks.",
  fields: [
    { key: "label", label: "Label", type: "text", value: "STREAM STARTS IN", max: 26 },
    { key: "foot", label: "Footer", type: "text", value: "northbound · live build session", max: 40 },
  ],
  layers: [
    { name: "Ring", color: "#FF8A5B", inFrame: 0 },
    { name: "Digit", color: "#6FA8FF", inFrame: 0 },
    { name: "Label", color: "#6FA8FF", inFrame: 6 },
    { name: "Footer", color: "#B98CFF", inFrame: 14 },
  ],
  draw({ ctx, w, h, frame, totalFrames, props, brand, fonts }) {
    const cx = w / 2;
    const cy = h / 2 - 10;
    const seconds = totalFrames / FPS;
    const elapsed = frame / FPS;
    const remaining = Math.max(0, seconds - elapsed);
    const digit = Math.max(1, Math.ceil(remaining));
    // progress within the current second, for the ring sweep
    const withinSecond = 1 - (remaining - Math.floor(remaining));

    const inP = at(frame, 0, 16, E);
    const out = tail(frame, totalFrames, 8);
    const r = 190;

    withAlpha(ctx, inP * out, () => {
      ctx.strokeStyle = "#2A2A33";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = brand.accent;
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(
        cx,
        cy,
        r,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * Math.min(1, withinSecond)
      );
      ctx.stroke();
      ctx.lineCap = "butt";

      // the digit pops on each tick
      const tick = (remaining - Math.floor(remaining)) > 0.85 ? 1 : 0;
      const scale = 1 + tick * 0.05;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.fillStyle = brand.text;
      ctx.font = font(fonts, 700, 200, true);
      ctx.textAlign = "center";
      ctx.fillText(String(digit), 0, 70);
      ctx.textAlign = "left";
      ctx.restore();
    });

    const lP = at(frame, 6, 18, E);
    withAlpha(ctx, lP * out, () => {
      ctx.fillStyle = brand.accent;
      ctx.font = font(fonts, 600, 28);
      tracked(ctx, (props.label || "").toUpperCase(), cx, cy - r - 60, 10, "center");
    });

    const fP = at(frame, 14, 18, E);
    withAlpha(ctx, fP * out, () => {
      ctx.fillStyle = brand.muted;
      ctx.font = font(fonts, 400, 28, true);
      ctx.textAlign = "center";
      ctx.fillText(props.foot || "", cx, cy + r + 92);
      ctx.textAlign = "left";
    });
  },
};

/* --------------------------------------------------------- 13. Quote Card */

const quoteCard: Preset = {
  id: "quote",
  name: "Quote Card",
  duration: 5,
  blurb: "Pull the line worth clipping.",
  fields: [
    {
      key: "quote",
      label: "Quote",
      type: "text",
      value: "You do not need a GPU to draw a rectangle.",
      max: 140,
    },
    { key: "who", label: "Attribution", type: "text", value: "Asad Jehan Zeb", max: 28 },
    { key: "role", label: "Role", type: "text", value: "building Bumper", max: 30 },
  ],
  layers: [
    { name: "Quote mark", color: "#FF8A5B", inFrame: 0 },
    { name: "Quote", color: "#6FA8FF", inFrame: 6 },
    { name: "Attribution", color: "#B98CFF", inFrame: 26 },
  ],
  draw({ ctx, w, h, frame, totalFrames, props, brand, fonts }) {
    const out = tail(frame, totalFrames, 14);
    const left = 220;
    const maxWidth = w - left * 2;

    ctx.font = font(fonts, 700, 76);
    const lines = wrapText(ctx, props.quote || "", maxWidth);
    const lineHeight = 98;
    const startY = h / 2 - ((lines.length - 1) * lineHeight) / 2 + 10;

    // The mark hangs off the first line rather than floating at a fixed height,
    // so it stays attached however many lines the quote wraps to.
    const mP = at(frame, 0, 16, E);
    withAlpha(ctx, mP * out, () => {
      ctx.fillStyle = brand.accent;
      ctx.font = font(fonts, 700, 170);
      ctx.fillText("“", left - 14, startY - 58);
    });

    // lines reveal in sequence, each rising into place
    lines.forEach((line, i) => {
      const p = at(frame, 6 + i * 5, 22, E);
      withAlpha(ctx, p * out, () => {
        ctx.fillStyle = brand.text;
        ctx.font = font(fonts, 700, 76);
        ctx.fillText(line, left, startY + i * lineHeight + (1 - p) * 18);
      });
    });

    const aP = at(frame, 26, 20, E);
    const footY = startY + lines.length * lineHeight + 46;
    withAlpha(ctx, out, () => {
      ctx.fillStyle = brand.accent;
      ctx.fillRect(left, footY - 30, 56 * aP, 3);
    });
    withAlpha(ctx, aP * out, () => {
      ctx.fillStyle = brand.text;
      ctx.font = font(fonts, 600, 34);
      const nameW = ctx.measureText(props.who || "").width;
      ctx.fillText(props.who || "", left, footY + 32);
      ctx.fillStyle = brand.muted;
      ctx.font = font(fonts, 400, 28, true);
      ctx.fillText(props.role || "", left + nameW + 24, footY + 32);
    });
  },
};

export const PRESETS: Preset[] = [
  lowerThird,
  captionPop,
  subscribeBump,
  calloutPointer,
  cornerBug,
  sectionCard,
  statCounter,
  quoteCard,
  notificationToast,
  swipeTransition,
  countdown,
  endScreen,
  introLogo,
];

export function presetById(id: string): Preset {
  return PRESETS.find((p) => p.id === id) ?? PRESETS[0];
}

export function defaultProps(preset: Preset) {
  return Object.fromEntries(preset.fields.map((f) => [f.key, f.value]));
}
