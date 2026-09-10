import Phaser from 'phaser';
import { PixelSprite } from '../art/pixelToTexture';
import { boy1Sprites } from './boy1';
import { boy2Sprites } from './boy2';
import { weaponSprites } from './weapons';
import { arenaSprites } from './arena';
import { hudSprites } from './hud';
import { fxSprites } from '../systems/fx';

/** Alle Pixel-Sprites des Spiels, vom BootScene registriert. */
export function allSprites(): PixelSprite[] {
  return [
    ...boy1Sprites(),
    ...boy2Sprites(),
    ...weaponSprites(),
    ...arenaSprites(),
    ...hudSprites(),
    ...fxSprites(),
  ];
}

interface AnimDef {
  base: string;
  frames: number;
  frameRate: number;
  loop: boolean;
}

const ANIM_DEFS: AnimDef[] = [
  { base: 'idle', frames: 2, frameRate: 3, loop: true },
  { base: 'walk', frames: 4, frameRate: 8, loop: true },
  { base: 'run', frames: 4, frameRate: 12, loop: true },
  { base: 'attack', frames: 4, frameRate: 12, loop: false },
  { base: 'throw', frames: 3, frameRate: 12, loop: false },
  { base: 'hit', frames: 2, frameRate: 8, loop: false },
  { base: 'ko', frames: 3, frameRate: 6, loop: false },
  { base: 'victory', frames: 2, frameRate: 4, loop: true },
];

/** Registriert alle Phaser-Anims (boy1_idle, boy2_walk, ...). Fail-safe: fehlende Texturen werden übersprungen. */
export function buildAnimations(scene: Phaser.Scene): void {
  for (const prefix of ['boy1', 'boy2'] as const) {
    for (const def of ANIM_DEFS) {
      const animKey = `${prefix}_${def.base}`;
      if (scene.anims.exists(animKey)) continue;
      const frameKeys: string[] = [];
      for (let i = 0; i < def.frames; i++) {
        const texKey = `${prefix}_${def.base}_${i}`;
        if (scene.textures.exists(texKey)) frameKeys.push(texKey);
      }
      if (frameKeys.length === 0) continue;
      scene.anims.create({
        key: animKey,
        frames: frameKeys.map((k) => ({ key: k })),
        frameRate: def.frameRate,
        repeat: def.loop ? -1 : 0,
      });
    }
  }
}
