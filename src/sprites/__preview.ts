import Phaser from 'phaser';
import { createPixelText } from '../ui/pixelText';
import { PixelSprite } from '../art/pixelToTexture';
import { boy1Sprites } from './boy1';
import { boy2Sprites } from './boy2';
import { weaponSprites } from './weapons';
import { hudSprites } from './hud';
import { fxSprites } from '../systems/fx';
import { isPngKey } from './manifest';
import { SHEET_SCALE } from './sheetScale';

const ZOOM = 384 / 1050;

function labelOf(key: string): string {
  return key
    .replace(/^boy[12]_/, '')
    .replace(/^wpn_/, '')
    .replace(/^arena_/, '')
    .replace(/^hud_/, '')
    .replace(/^fx_/, 'FX ')
    .replace(/_/g, ' ')
    .toUpperCase();
}

export class SpritePreviewScene extends Phaser.Scene {
  constructor() {
    super('SpritePreviewScene');
  }

  create(): void {
    const cam = this.cameras.main;
    cam.setBackgroundColor('#12162a');
    cam.setZoom(ZOOM);
    cam.setOrigin(0, 0);

    createPixelText(this, 8, 2, 'SPRITE PREVIEW', { scale: 2 });

    let y = this.section('BOY1', boy1Sprites(), 18, 14, 75, 64, 52, 2);
    y = this.section('BOY2', boy2Sprites(), y, 14, 75, 64, 52, 2);
    y = this.section('WEAPONS', weaponSprites(), y, 8, 120, 42, 32, 2);
    y = this.section('HUD', hudSprites(), y, 7, 150, 46, 34, 2);

    createPixelText(this, 8, y, 'ARENA', { scale: 2 });
    const a1 = y + 14;
    this.arenaRow1(a1 + 54);
    this.arenaRow2(a1 + 54 + 76);
  }

  private section(
    label: string,
    sprites: PixelSprite[],
    y: number,
    cols: number,
    cellW: number,
    rowH: number,
    bottomInRow: number,
    scale: number
  ): number {
    createPixelText(this, 8, y, label, { scale: 2 });
    const y0 = y + 12;
    sprites.forEach((s, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * cellW + cellW / 2;
      const bottom = y0 + row * rowH + bottomInRow;
      if (!this.textures.exists(s.key)) return;
      this.add.image(x, bottom, s.key).setOrigin(0.5, 1).setScale(isPngKey(s.key) ? SHEET_SCALE : scale);
      createPixelText(this, x, bottom + 2, labelOf(s.key), { scale: 1, originX: 0.5 });
    });
    return y0 + Math.ceil(sprites.length / cols) * rowH;
  }

  private place(key: string, x: number, bottom: number, scale: number): void {
    if (!this.textures.exists(key)) return;
    this.add.image(x, bottom, key).setOrigin(0.5, 1).setScale(isPngKey(key) ? SHEET_SCALE : scale);
    createPixelText(this, x, bottom + 2, labelOf(key), { scale: 1, originX: 0.5 });
  }

  private arenaRow1(bottom: number): void {
    this.place('arena_cloud_0', 40, bottom, 1);
    this.place('arena_cloud_1', 105, bottom, 1);
    this.place('arena_cloud_2', 165, bottom, 1);
    this.place('arena_house', 285, bottom, 1);
    this.place('arena_tree', 380, bottom, 1);
    this.place('arena_lamp', 462, bottom, 1);
    this.place('arena_bench', 545, bottom, 1);
    this.place('arena_sky', 760, bottom, 0.25);
  }

  private arenaRow2(bottom: number): void {
    this.place('arena_bush', 40, bottom, 1);
    this.place('arena_trashcan', 80, bottom, 1);
    this.place('arena_flower_0', 120, bottom, 2);
    this.place('arena_flower_1', 145, bottom, 2);
    this.place('arena_bird_0', 180, bottom, 2);
    this.place('arena_bird_1', 205, bottom, 2);
    this.place('arena_leaf', 232, bottom, 2);
    this.place('arena_grass_0', 260, bottom, 2);
    this.place('arena_grass_1', 285, bottom, 2);
    this.place('arena_grass_2', 310, bottom, 2);
    this.place('arena_path', 430, bottom, 1);
    for (let i = 0; i < fxSprites().length; i++) {
      const s = fxSprites()[i];
      this.place(s.key, 640 + i * 40, bottom, 2);
    }
  }
}
