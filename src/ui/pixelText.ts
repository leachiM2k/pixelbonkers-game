import Phaser from 'phaser';
import { FONT_GLYPHS } from '../sprites/font';
import { registerPixelSprite } from '../art/pixelToTexture';

const FONT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?:.,-/>() ' + 'ÄÖÜ';

// ------------------------------------------------------------
// Zeichensatz-Asset font_charset.png (206x91, vom User generiert):
// 4 Zeilen (A-M, N-Z, 0-9, Satzzeichen), weisse Glyphen mit dunkler
// Outline auf buntem Sprenkel-Hintergrund. Glyphen-Baender sind
// deterministisch vermessen (Component-Analyse + Vision-Lesung).
// ------------------------------------------------------------
interface GlyphBand {
  ch: string;
  x1: number;
  x2: number;
  ry1: number;
  ry2: number;
}

const CHARSET: GlyphBand[] = [
  // Zeile 1 (y 1..15): A..M - Band 132-134 ist ein Sprenkel-Artefakt und wird uebersprungen
  ...'ABCDEFGHIJKLM'.split('').map((ch, i): GlyphBand => {
    const b: Array<[number, number]> = [[3, 11], [19, 27], [33, 42], [48, 57], [64, 71], [77, 85], [91, 100],
      [106, 115], [122, 126], [142, 150], [157, 165], [173, 181], [188, 199]];
    return { ch, x1: b[i][0], x2: b[i][1], ry1: 1, ry2: 15 };
  }),
  // Zeile 2 (y 24..39): N..Z
  ...'NOPQRSTUVWXYZ'.split('').map((ch, i): GlyphBand => {
    const b: Array<[number, number]> = [[3, 12], [19, 27], [34, 43], [49, 58], [65, 74], [80, 88], [96, 104],
      [111, 120], [128, 136], [144, 155], [162, 172], [179, 188], [195, 203]];
    return { ch, x1: b[i][0], x2: b[i][1], ry1: 24, ry2: 39 };
  }),
  // Zeile 3 (y 49..63): 0..9
  ...'0123456789'.split('').map((ch, i): GlyphBand => {
    const b: Array<[number, number]> = [[3, 11], [21, 26], [36, 44], [53, 61], [71, 79], [88, 97], [105, 114],
      [123, 131], [140, 149], [157, 166]];
    return { ch, x1: b[i][0], x2: b[i][1], ry1: 49, ry2: 63 };
  }),
  // Zeile 4 (y 71..88): ' ? . , : ; - +  (Apostroph nur fuer die !-Synthese)
  { ch: '?', x1: 19, x2: 27, ry1: 71, ry2: 88 },
  { ch: '.', x1: 40, x2: 41, ry1: 71, ry2: 88 },
  { ch: ',', x1: 57, x2: 59, ry1: 71, ry2: 88 },
  { ch: ':', x1: 74, x2: 76, ry1: 71, ry2: 88 },
  { ch: ';', x1: 92, x2: 94, ry1: 71, ry2: 88 },
  { ch: '-', x1: 109, x2: 111, ry1: 71, ry2: 88 },
  { ch: '+', x1: 124, x2: 130, ry1: 71, ry2: 88 },
];

// Glyphen bleiben nativ (~15px hoch); createPixelText rendert sie mit 0.5
// (bilinear/LINEAR statt Nearest-Decimation, damit die 1px-Outlines intakt bleiben)
const FONT_DISPLAY_SCALE = 0.5;
const slicedChars = new Set<string>();

const GLYPH_H = 16; // einheitliche Textur-Hoehe (Fuellung bis 14px + 1px Kontur oben/unten)
const CONTOUR_R = 95, CONTOUR_G = 112, CONTOUR_B = 149; // Konturfarbe wie im 1:1-Referenzsample

/** Charset-Rohdaten einmalig als ImageData holen. */
function getCharsetData(scene: Phaser.Scene): ImageData | null {
  const tex = scene.textures.get('font_charset');
  const src = tex.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const c = document.createElement('canvas');
  c.width = 206; c.height = 91;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(src, 0, 0, 206, 91);
  return ctx.getImageData(0, 0, 206, 91);
}

/** Fuell-Maske eines Bandes: Pixel mit Alpha>=150 und Helligkeit>=180 (Kachel-BG 146-174 faellt raus). */
function bandFillMask(data: ImageData, g: GlyphBand): { mask: Uint8Array; w: number; bandH: number } {
  const { x1, x2, ry1, ry2 } = g;
  const w = x2 - x1 + 1;
  const bandH = ry2 - ry1 + 1;
  const mask = new Uint8Array(w * bandH);
  for (let y = 0; y < bandH; y++) {
    for (let x = 0; x < w; x++) {
      const i = ((ry1 + y) * 206 + (x1 + x)) * 4;
      if (data.data[i + 3] < 150) continue;
      const br = (data.data[i] + data.data[i + 1] + data.data[i + 2]) / 3;
      if (br >= 180) mask[y * w + x] = 1;
    }
  }
  return { mask, w, bandH };
}

/**
 * Maske -> Glyphen-Canvas: native Fuellfarben (Hellblau) + 1px dunklere
 * Kontur (4-Nachbarschaft), kein Anti-Aliasing. Baseline unten.
 */
function composeGlyphCanvas(mask: Uint8Array, mw: number, mh: number, data: ImageData, srcX: number, srcY: number): HTMLCanvasElement | null {
  let yMax = -1;
  for (let y = mh - 1; y >= 0 && yMax < 0; y--) {
    for (let x = 0; x < mw; x++) {
      if (mask[y * mw + x]) { yMax = y; break; }
    }
  }
  if (yMax < 0) return null;
  const maxFill = GLYPH_H - 2;
  const yTop = Math.max(0, yMax - maxFill + 1);
  const canvas = document.createElement('canvas');
  canvas.width = mw + 2; // +1px Kontur links/rechts
  canvas.height = GLYPH_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const out = ctx.createImageData(canvas.width, GLYPH_H);
  const cw = canvas.width;
  const fillAt = (x: number, y: number): boolean => {
    const mx = x - 1, my = y - 1 + yTop;
    if (mx < 0 || my < 0 || mx >= mw || my >= mh) return false;
    return mask[my * mw + mx] === 1;
  };
  for (let y = 0; y < GLYPH_H; y++) {
    for (let x = 0; x < cw; x++) {
      const o = (y * cw + x) * 4;
      if (fillAt(x, y)) {
        const i = ((srcY + yTop + y - 1) * 206 + (srcX + x - 1)) * 4;
        out.data[o] = data.data[i];
        out.data[o + 1] = data.data[i + 1];
        out.data[o + 2] = data.data[i + 2];
        out.data[o + 3] = 255;
      } else if (fillAt(x - 1, y) || fillAt(x + 1, y) || fillAt(x, y - 1) || fillAt(x, y + 1)) {
        out.data[o] = CONTOUR_R;
        out.data[o + 1] = CONTOUR_G;
        out.data[o + 2] = CONTOUR_B;
        out.data[o + 3] = 255;
      }
    }
  }
  ctx.putImageData(out, 0, 0);
  return canvas;
}

/** Glyphe aus dem Charset schneiden: Form via Helligkeitsschwelle, native Farben + Kontur. */
function sliceGlyph(scene: Phaser.Scene, data: ImageData, g: GlyphBand): void {
  const { mask, w, bandH } = bandFillMask(data, g);
  const canvas = composeGlyphCanvas(mask, w, bandH, data, g.x1, g.ry1);
  if (!canvas) return;
  const tex = scene.textures.addCanvas(`font_${g.ch}`, canvas);
  tex?.setFilter(Phaser.Textures.FilterMode.LINEAR);
  slicedChars.add(g.ch);
}

/** '!' fehlt im Satz -> Synthese: Balken (3x11) + Punkt (2x2), mit Kontur wie die anderen. */
function synthesizeBang(scene: Phaser.Scene): void {
  const mw = 3, mh = GLYPH_H - 2;
  const mask = new Uint8Array(mw * mh);
  for (let y = 0; y < 11; y++) for (let x = 0; x < 3; x++) mask[y * mw + x] = 1;
  mask[13 * mw] = 1; mask[13 * mw + 1] = 1; // Punkt unten (1px Luecke bei y=12)
  const canvas = document.createElement('canvas');
  canvas.width = mw + 2;
  canvas.height = GLYPH_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const fill = 'rgb(214,226,237)'; // Hellblau wie die Strich-Fuellung
  const contour = `rgb(${CONTOUR_R},${CONTOUR_G},${CONTOUR_B})`;
  ctx.fillStyle = contour;
  ctx.fillRect(1, 0, mw + 2 - 2 + 2 - 2, GLYPH_H); // Kontur-Block
  ctx.clearRect(0, 0, canvas.width, GLYPH_H);
  // Kontur als Ring um die Maske zeichnen
  const draw = (x: number, y: number) => ctx.fillRect(x + 1, y + 1, 1, 1);
  for (let y = -1; y <= mh; y++) for (let x = -1; x <= mw; x++) {
    const inMask = x >= 0 && y >= 0 && x < mw && y < mh && mask[y * mw + x] === 1;
    const neighbor = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx >= 0 && ny >= 0 && nx < mw && ny < mh && mask[ny * mw + nx] === 1;
    });
    if (inMask) { ctx.fillStyle = fill; draw(x, y); }
    else if (neighbor) { ctx.fillStyle = contour; draw(x, y); }
  }
  const tex = scene.textures.addCanvas('font_!', canvas);
  tex?.setFilter(Phaser.Textures.FilterMode.LINEAR);
  slicedChars.add('!');
}

/**
 * Pixel-Font: schneidet 'font_<CHAR>'-Texturen aus font_charset.png
 * (fallback: 5x7 Matrix-Glyphen aus FONT_GLYPHS, z.B. fuer ( ) / > AeOeUe).
 * Leerzeichen bekommt eine 1px transparente Textur.
 */
export function registerFontTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('font_charset')) {
    const data = getCharsetData(scene);
    if (data) {
      for (const g of CHARSET) sliceGlyph(scene, data, g);
      synthesizeBang(scene);
    }
  }
  for (const ch of FONT_CHARS) {
    const key = `font_${ch}`;
    if (slicedChars.has(ch) || scene.textures.exists(key)) continue;
    const glyph = FONT_GLYPHS[ch];
    if (glyph) {
      registerPixelSprite(scene, { key, rows: glyph });
    } else if (ch === ' ') {
      registerPixelSprite(scene, { key: 'font_SPACE', rows: ['.', '.', '.', '.', '.', '.', '.'] });
    } else {
      registerPixelSprite(scene, { key, rows: FONT_GLYPHS['?'] });
    }
  }
}

export interface PixelTextOptions {
  scale?: number;
  /** Farb-Tint als Hexzahl, z.B. 0xf8d848 */
  color?: number;
  /** 0 = links, 0.5 = zentriert, 1 = rechts */
  originX?: number;
  letterSpacing?: number;
  /** Tint auch auf Charset-Glyphen anwenden (z.B. fuer Schattenkopien). */
  forceTint?: boolean;
}

/**
 * Pixel-Text als Container von Buchstaben-Grafiken (proportionale Breiten).
 */
export function createPixelText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  opts: PixelTextOptions = {}
): Phaser.GameObjects.Container {
  const scale = opts.scale ?? 1;
  const color = opts.color ?? 0xffffff;
  const originX = opts.originX ?? 0;
  const spacing = (opts.letterSpacing ?? 1) * scale;

  const container = scene.add.container(x, y);
  const chars = text.toUpperCase().split('');
  const glyphW = (ch: string): number => {
    const key = `font_${ch}`;
    if (!scene.textures.exists(key)) return 5;
    return scene.textures.get(key).getSourceImage().width * (slicedChars.has(ch) ? FONT_DISPLAY_SCALE : 1);
  };
  const SPACE_W = 4;
  const widths = chars.map((ch) => (ch === ' ' ? SPACE_W : glyphW(ch)));
  const totalW = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);

  let cursor = 0;
  if (originX === 0.5) cursor = -totalW / 2;
  else if (originX === 1) cursor = -totalW;

  chars.forEach((ch, i) => {
    if (ch !== ' ') {
      const key = `font_${ch}`;
      if (scene.textures.exists(key)) {
        const img = scene.add.image(cursor, 0, key);
        img.setOrigin(0, 0);
        img.setScale(scale * (slicedChars.has(ch) ? FONT_DISPLAY_SCALE : 1));
        if (!slicedChars.has(ch) || opts.forceTint) img.setTint(color);
        container.add(img);
      } else {
        console.warn(`[pixelText] fehlende Glyphen-Textur: ${key}`);
      }
    }
    cursor += widths[i] + spacing;
  });
  return container;
}
