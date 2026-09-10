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
const GLYPH_H = 15; // einheitliche Textur-Hoehe (Baseline unten)

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
const APOSTROPHE: GlyphBand = { ch: "'", x1: 5, x2: 7, ry1: 71, ry2: 88 };

// Glyphen bleiben nativ (~15px hoch); createPixelText rendert sie mit 0.5
// (bilinear/LINEAR statt Nearest-Decimation, damit die 1px-Outlines intakt bleiben)
const FONT_DISPLAY_SCALE = 0.5;
const slicedChars = new Set<string>();

/**
 * Zeichensatz bereinigen: Die Glyphen sind weisse Striche auf opakem
 * farbigem Hintergrund; Buchstaben-Innenflaechen sind ebenfalls farbig
 * gefuellt. Strategie:
 * 1. Flutfuellung vom Rand durch farbige/transparente Pixel -> Hintergrund.
 * 2. Nicht erreichte farbige Pixel = eingeschlossene Innenflaechen -> WEISS fuellen.
 * 3. Isolierte Grau-Sprenkel ausserhalb von Glyphen droppen.
 */
function buildCleanCanvas(scene: Phaser.Scene): HTMLCanvasElement | null {
  const tex = scene.textures.get('font_charset');
  const src = tex.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const w = 206, h = 91;
  const read = document.createElement('canvas');
  read.width = w; read.height = h;
  const rctx = read.getContext('2d', { willReadFrequently: true });
  if (!rctx) return null;
  rctx.drawImage(src, 0, 0, w, h);
  const data = rctx.getImageData(0, 0, w, h);
  const p = data.data;
  const idx = (x: number, y: number) => (y * w + x) * 4;
  const isWhite = (x: number, y: number): boolean => {
    const i = idx(x, y);
    if (p[i + 3] < 24) return false;
    const r = p[i], g = p[i + 1], b = p[i + 2];
    return r > 190 && g > 190 && b > 185;
  };
  const isBg = (x: number, y: number): boolean => {
    // farbige oder transparente Pixel zaehlen als Hintergrund-Weg
    const i = idx(x, y);
    if (p[i + 3] < 24) return true;
    return !isWhite(x, y);
  };
  // 1. Flutfuellung vom Rand: alles erreichbare Nicht-Weiss = Hintergrund
  const visited = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const k = y * w + x;
    if (visited[k] || !isBg(x, y)) return;
    visited[k] = 1;
    stack.push(k);
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const k = stack.pop()!;
    const x = k % w, y = Math.floor(k / w);
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  // 2. Nicht erreichte Nicht-Weiss-Pixel = Innenflaechen -> weiss fuellen,
  //    erreichbarer Hintergrund -> transparent
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = idx(x, y);
      if (p[i + 3] < 24) continue;
      if (isWhite(x, y)) continue;
      const k = y * w + x;
      if (visited[k]) {
        p[i + 3] = 0; // Hintergrund weg
      } else {
        p[i] = 255; p[i + 1] = 255; p[i + 2] = 255; // Interior -> solid weiss
      }
    }
  }
  rctx.putImageData(data, 0, 0);
  return read;
}

/** Eine Glyphe aus dem bereinigten Blatt schneiden: Baseline unten, GLYPH_H hoch, halbiert. */
function sliceGlyph(scene: Phaser.Scene, clean: HTMLCanvasElement, g: GlyphBand): void {
  const { ch, x1, x2, ry1, ry2 } = g;
  const w = x2 - x1 + 1;
  const ctx0 = clean.getContext('2d');
  if (!ctx0) return;
  const data = ctx0.getImageData(x1, ry1, w, ry2 - ry1 + 1);
  let yMax = -1; // lokale Zeilen-Koordinate innerhalb des Bandes
  for (let y = ry2 - ry1; y >= 0 && yMax < 0; y--) {
    for (let x = 0; x < w; x++) {
      if (data.data[(y * w + x) * 4 + 3] >= 24) { yMax = y; break; }
    }
  }
  if (yMax < 0) return;
  const yTop = Math.max(0, yMax - GLYPH_H + 1); // lokal
  const gh = yMax - yTop + 1;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = GLYPH_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(clean, x1, ry1 + yTop, w, gh, 0, GLYPH_H - gh, w, gh);
  const tex = scene.textures.addCanvas(`font_${ch}`, canvas);
  tex?.setFilter(Phaser.Textures.FilterMode.LINEAR);
  slicedChars.add(ch);
}

/** '!' fehlt im Zeichensatz -> Synthese im gleichen Stil: Apostroph-Balken + Punkt. */
function synthesizeBang(scene: Phaser.Scene, clean: HTMLCanvasElement): void {
  const canvas = document.createElement('canvas');
  canvas.width = 3;
  canvas.height = GLYPH_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(clean, APOSTROPHE.x1, 71, 3, 8, 0, 0, 3, 11); // Apostroph-Tinte auf 11px gestreckt
  ctx.drawImage(clean, 40, 82, 2, 2, 0.5, 13, 2, 2);            // Punkt unten, 1px Luecke
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
    const clean = buildCleanCanvas(scene);
    if (clean) {
      for (const g of CHARSET) sliceGlyph(scene, clean, g);
      synthesizeBang(scene, clean);
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
        img.setTint(color);
        container.add(img);
      } else {
        console.warn(`[pixelText] fehlende Glyphen-Textur: ${key}`);
      }
    }
    cursor += widths[i] + spacing;
  });
  return container;
}
