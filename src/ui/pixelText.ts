import Phaser from 'phaser';
import { FONT_GLYPHS } from '../sprites/font';
import { registerPixelSprite } from '../art/pixelToTexture';

const FONT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?:.,-/>() ' + 'ÄÖÜ';

/**
 * 5x7 Pixel-Font: registriert 'font_<CHAR>' Texturen.
 * Leerzeichen bekommt eine 1px transparente Textur.
 */
export function registerFontTextures(scene: Phaser.Scene): void {
  for (const ch of FONT_CHARS) {
    const upper = ch.toUpperCase();
    const glyph = FONT_GLYPHS[upper];
    if (glyph) {
      registerPixelSprite(scene, { key: `font_${upper}`, rows: glyph });
    } else if (upper === ' ') {
      registerPixelSprite(scene, { key: 'font_SPACE', rows: ['.', '.', '.', '.', '.', '.', '.'] });
    } else {
      // Fallback: unbekannte Zeichen als '?' rendern statt zu crashen
      registerPixelSprite(scene, { key: `font_${upper}`, rows: FONT_GLYPHS['?'] });
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
 * Pixel-Text als Container von Buchstaben-Grafiken.
 * Skaliert ganzzahlig (pixel-perfect), Niemand macht subpixel.
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
  const glyphW = 5 * scale;
  const totalW = chars.length * glyphW + (chars.length - 1) * spacing;

  let cursor = 0;
  if (originX === 0.5) cursor = -totalW / 2;
  else if (originX === 1) cursor = -totalW;

  for (const ch of chars) {
    if (ch === ' ') {
      cursor += glyphW + spacing;
      continue;
    }
    const key = `font_${ch.toUpperCase()}`;
    if (!scene.textures.exists(key)) {
      console.warn(`[pixelText] fehlende Glyphen-Textur: ${key}`);
      cursor += glyphW + spacing;
      continue;
    }
    const img = scene.add.image(cursor, 0, key);
    img.setOrigin(0, 0);
    img.setScale(scale);
    img.setTint(color);
    container.add(img);
    cursor += glyphW + spacing;
  }
  return container;
}
