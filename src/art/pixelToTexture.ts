import Phaser from 'phaser';
import { palColor } from './palette';

/**
 * Pixel-to-Texture Pipeline.
 * Sprites werden als String-Matrizen definiert (Zeile = Pixelzeile,
 * Zeichen = Palette-Farbe, '.' = transparent) und zur Boot-Zeit
 * EINMALIG in echte Canvas-Texturen gebacken. Nach dem Booten
 * rendert Phaser normale GPU-Sprites => volle Performance.
 */
export interface PixelSprite {
  key: string;
  rows: string[];
  /** Optionale Versatz-Korrektur des Ankers (in Pixeln der Sprite-Größe) */
  origin?: { x: number; y: number };
}

/**
 * Registriert ein Pixel-Sprite als Textur im TextureManager.
 * Wirft einen Konsolen-Fehler (aber KEINEN Crash), wenn ein Key doppelt belegt wird.
 */
export function registerPixelSprite(scene: Phaser.Scene, sprite: PixelSprite): void {
  const texKey = sprite.key;
  if (scene.textures.exists(texKey)) {
    console.warn(`[pixelToTexture] Textur-Key bereits belegt: ${texKey} (uebersprungen)`);
    return;
  }
  const height = sprite.rows.length;
  const width = Math.max(...sprite.rows.map((r) => r.length));
  if (width === 0 || height === 0) {
    console.error(`[pixelToTexture] Leeres Sprite: ${texKey}`);
    return;
  }
  const canvas = scene.textures.createCanvas(texKey, width, height);
  if (!canvas) {
    console.error(`[pixelToTexture] Konnte Canvas nicht erstellen: ${texKey}`);
    return;
  }
  const ctx = canvas.getContext();
  ctx.clearRect(0, 0, width, height);
  for (let y = 0; y < height; y++) {
    const row = sprite.rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      ctx.fillStyle = palColor(ch);
      ctx.fillRect(x, y, 1, 1);
    }
  }
  canvas.refresh();
}

/** Registriert eine Liste von Pixel-Sprites. */
export function registerPixelSprites(scene: Phaser.Scene, sprites: PixelSprite[]): void {
  for (const s of sprites) registerPixelSprite(scene, s);
}

/**
 * Erzeugt zu einem Sprite-Key die zugehörige Origin-Konstante,
 * damit Entities an den Füßen verankert werden können (origin x je nach Facing, y = 1).
 */
export const FOOT_ORIGIN_Y = 1;
