import { PNG } from 'pngjs';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AIR_POSES } from './poses.js';
import { getCharacter } from './characters.js';

const CHAR_NAME = process.argv[2] ?? 'teen';
const CHARACTER = getCharacter(CHAR_NAME);
const PREFIX = CHARACTER.prefix;
const STAND_PX = CHARACTER.config.standPx ?? 92;

const SPRITE_DIR = join(process.cwd(), '..', 'public', 'assets', 'sprites');
const RENDER_DIR = join(process.cwd(), 'output');
const OUT_DIR = join(RENDER_DIR, '16bit');

const CANVAS_W = 100;
const CANVAS_H = 98;
const FEET_ROW = 96;
const ANCHOR_COL = 50;

const WR = 0.3, WG = 0.59, WB = 0.11;

function dist2(a, b) {
  const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
  return WR * dr * dr + WG * dg * dg + WB * db * db;
}

function extractPalette() {
  const freq = new Map();
  const SKIP = /^(spd1|spd2|tnk1|tnk2|jmp1|jmp2)_/;
  for (const f of readdirSync(SPRITE_DIR)) {
    if (!f.endsWith('.png') || SKIP.test(f)) continue;
    const png = PNG.sync.read(readFileSync(join(SPRITE_DIR, f)));
    for (let i = 0; i < png.width * png.height; i++) {
      const a = png.data[i * 4 + 3];
      if (a < 128) continue;
      const r = png.data[i * 4], g = png.data[i * 4 + 1], b = png.data[i * 4 + 2];
      const key = (r << 16) | (g << 8) | b;
      freq.set(key, (freq.get(key) ?? 0) + 1);
    }
  }
  const colors = [...freq.entries()]
    .map(([k, n]) => [(k >> 16) & 255, (k >> 8) & 255, k & 255, n])
    .sort((a, b) => b[3] - a[3]);
  const palette = [];
  const MERGE = 22 * 22;
  for (const c of colors) {
    if (palette.length >= 128) break;
    if (palette.every((p) => dist2(p, c) > MERGE)) palette.push([c[0], c[1], c[2]]);
  }
  const darkest = palette.reduce((m, c) => (luma(c) < luma(m) ? c : m), palette[0]);
  return { palette, outline: darkest };
}

function luma(c) {
  return WR * c[0] + WG * c[1] + WB * c[2];
}

function nearest(palette, rgb) {
  let best = palette[0], bd = Infinity;
  for (const c of palette) {
    const d = dist2(c, rgb);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

function loadRGBA(file) {
  const png = PNG.sync.read(readFileSync(file));
  return { data: png.data, w: png.width, h: png.height };
}

function sampleArea(img, u0, v0, u1, v1) {
  let r = 0, g = 0, b = 0, cov = 0;
  const x0 = Math.floor(u0), x1 = Math.ceil(u1);
  const y0 = Math.floor(v0), y1 = Math.ceil(v1);
  for (let y = y0; y < y1; y++) {
    const cy = Math.max(0, Math.min(v1, y + 1) - Math.max(v0, y));
    if (cy <= 0) continue;
    for (let x = x0; x < x1; x++) {
      const cx = Math.max(0, Math.min(u1, x + 1) - Math.max(u0, x));
      if (cx <= 0) continue;
      if (x < 0 || y < 0 || x >= img.w || y >= img.h) continue;
      const i = (y * img.w + x) * 4;
      const a = img.data[i + 3] / 255;
      const w = cx * cy;
      cov += a * w;
      r += img.data[i] * a * w;
      g += img.data[i + 1] * a * w;
      b += img.data[i + 2] * a * w;
    }
  }
  if (cov <= 0) return null;
  return [r / cov, g / cov, b / cov, cov];
}

function convertPose(name, img, meta, pal, ppmSprite) {
  const { vs, cx, cy, az } = meta;
  const ppm512 = 512 / vs;
  const s = ppmSprite / ppm512;
  const groundRow = (512 * (cy + vs / 2)) / vs;
  let x0Col = az ? 256 : (512 * (vs / 2 - cx)) / vs;

  const isAir = AIR_POSES.has(name);
  if (!az) {
    const colMin = ANCHOR_COL + meta.minX * ppmSprite;
    const colMax = ANCHOR_COL + meta.maxX * ppmSprite;
    if (colMin < 1 || colMax > CANVAS_W - 2) {
      x0Col += (((colMin + colMax) / 2) - (CANVAS_W - 1) / 2) / s;
    }
  }
  const feetRow = FEET_ROW + (isAir ? meta.minY * ppmSprite : 0);

  const px = new Uint8Array(CANVAS_W * CANVAS_H * 4);
  const opaque = new Uint8Array(CANVAS_W * CANVAS_H);
  const f = 1 / s / 2;

  for (let row = 0; row < CANVAS_H; row++) {
    const v = groundRow - (feetRow - row + 0.25) / s;
    for (let col = 0; col < CANVAS_W; col++) {
      const u = x0Col + (col - ANCHOR_COL) / s;
      const c = sampleArea(img, u - f, v - f, u + f, v + f);
      if (!c || c[3] < 0.5) continue;
      const q = nearest(pal.palette, [c[0], c[1], c[2]]);
      const i = (row * CANVAS_W + col) * 4;
      px[i] = q[0]; px[i + 1] = q[1]; px[i + 2] = q[2]; px[i + 3] = 255;
      opaque[row * CANVAS_W + col] = 1;
    }
  }

  const oc = pal.outline;
  for (let row = 0; row < CANVAS_H; row++) {
    for (let col = 0; col < CANVAS_W; col++) {
      const i = row * CANVAS_W + col;
      if (!opaque[i]) continue;
      const edge = (col === 0 || !opaque[i - 1]) || (col === CANVAS_W - 1 || !opaque[i + 1]) ||
        (row === 0 || !opaque[i - CANVAS_W]) || (row === CANVAS_H - 1 || !opaque[i + CANVAS_W]);
      if (edge) {
        const j = i * 4;
        px[j] = oc[0]; px[j + 1] = oc[1]; px[j + 2] = oc[2];
      }
    }
  }

  // Regionskonturen: helle Seite jeder Farbgrenze abdunkeln (Comic-Linie zwischen allen Flaechen)
  const CONTOUR_T = 1800;
  const marked = new Uint8Array(CANVAS_W * CANVAS_H);
  for (let row = 0; row < CANVAS_H; row++) {
    for (let col = 0; col < CANVAS_W; col++) {
      const i = row * CANVAS_W + col;
      if (!opaque[i]) continue;
      const j = i * 4;
      const self = [px[j], px[j + 1], px[j + 2]];
      for (const n of [i - 1, i + 1, i - CANVAS_W, i + CANVAS_W]) {
        if (n < 0 || n >= CANVAS_W * CANVAS_H || !opaque[n] || marked[n]) continue;
        const k = n * 4;
        if (dist2(self, [px[k], px[k + 1], px[k + 2]]) > CONTOUR_T
          && luma([px[k], px[k + 1], px[k + 2]]) < luma(self)) {
          marked[i] = 1;
          break;
        }
      }
    }
  }
  for (let i = 0; i < marked.length; i++) {
    if (!marked[i]) continue;
    const j = i * 4;
    px[j] = oc[0]; px[j + 1] = oc[1]; px[j + 2] = oc[2];
  }

  const png = new PNG({ width: CANVAS_W, height: CANVAS_H });
  png.data.set(px);
  return PNG.sync.write(png);
}

function buildSheet(frames, order) {
  const cols = 7, cell = 112;
  const rows = Math.ceil(order.length / cols);
  const png = new PNG({ width: cols * cell, height: rows * cell });
  png.data.fill(35);
  for (let i = 0; i < order.length; i++) {
    const f = PNG.sync.read(frames[order[i]]);
    const ox = (i % cols) * cell + 6;
    const oy = Math.floor(i / cols) * cell + 7;
    for (let y = 0; y < f.height; y++) {
      for (let x = 0; x < f.width; x++) {
        const si = (y * f.width + x) * 4;
        if (f.data[si + 3] < 128) continue;
        const di = ((oy + y) * png.width + ox + x) * 4;
        png.data[di] = f.data[si];
        png.data[di + 1] = f.data[si + 1];
        png.data[di + 2] = f.data[si + 2];
        png.data[di + 3] = 255;
      }
    }
  }
  return PNG.sync.write(png);
}

const meta = JSON.parse(readFileSync(join(RENDER_DIR, `${PREFIX}_meta.json`), 'utf8'));
const pal = extractPalette();
console.log(`Palette: ${pal.palette.length} Farben, Outline ${pal.outline.map((v) => v.toString(16).padStart(2, '0')).join('')}`);
const ppmSprite = STAND_PX / meta.standingHeightM;
console.log(`Stehhöhe ${meta.standingHeightM.toFixed(3)}m -> ${ppmSprite.toFixed(2)} px/m`);

mkdirSync(OUT_DIR, { recursive: true });
const order = Object.keys(meta.poses);
const frames = {};
for (const name of order) {
  const img = loadRGBA(join(RENDER_DIR, `${PREFIX}_${name}.png`));
  const buf = convertPose(name, img, meta.poses[name], pal, ppmSprite);
  writeFileSync(join(OUT_DIR, `${PREFIX}_${name}.png`), buf);
  frames[name] = buf;
  console.log(`${PREFIX}_${name}.png`);
}
writeFileSync(join(OUT_DIR, `${PREFIX}16_sheet.png`), buildSheet(frames, order));
console.log(`${PREFIX}16_sheet.png`);
