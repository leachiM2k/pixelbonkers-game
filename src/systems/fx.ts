import Phaser from 'phaser';
import { PixelSprite } from '../art/pixelToTexture';
import { createPixelText } from '../ui/pixelText';
import { settings } from '../game/settings';

// Export-Vertrag (FX/AUDIO -> COMBAT/META/ORCHESTRATOR):
// - fxSprites(): PixelSprite[] mit Keys fx_star, fx_spark_0, fx_spark_1, fx_flash,
//   fx_explosion_0..3 (Palette-Zeichen aus src/art/palette.ts, '.' = transparent).
// - class FxSystem:
//     hitBurst(x, y, power: 0|1|2)   Treffer-Effekt (Blitz/Partikel/Explosion)
//     comicWord(x, y, word, color?)  Pixel-Comic-Text ~0.7s, max 1 pro 24px-Bereich
//     screenShake(intensityPx)       respektiert settings.screenShake
//     koStars(x, y)                  4 kreisende Sterne ~1s
//     hitstop(ms)                    pausiert NUR Arcade-Physik; Clock/Tweens laufen weiter
//   update(deltaMs) MUSS von BattleScene JEDEM Frame aufgerufen werden
//   (Partikel-Eigenpool, 60 Images, kein Per-Frame-Allozieren).

const STAR: string[] = [
  '..y..',
  '.yyy.',
  'yyyyy',
  '.yYy.',
  '..Y..',
];

export function fxSprites(): PixelSprite[] {
  return [
    { key: 'fx_star', rows: STAR },
    { key: 'fx_spark_0', rows: ['ww', 'w.'] },
    { key: 'fx_spark_1', rows: ['yy', '.y'] },
    { key: 'fx_flash', rows: ['..w..', '.www.', 'wywyw', '.www.', '..w..'] },
    { key: 'fx_explosion_0', rows: ['.....', '..o..', '.oyo.', '..o..', '.....'] },
    { key: 'fx_explosion_1', rows: ['..o..', '.oyo.', 'ooyoo', '.oyo.', '..o..'] },
    { key: 'fx_explosion_2', rows: ['.oyo.', 'oywyo', 'oywyo', 'oywyo', '.oyo.'] },
    { key: 'fx_explosion_3', rows: ['o...o', '.o.o.', '..o..', '.o.o.', 'o...o'] },
  ];
}

const POOL_SIZE = 60;

interface Particle {
  img: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  grav: number;
  spin: number;
}

export class FxSystem {
  private scene: Phaser.Scene;
  private pool: Particle[] = [];
  private words = new Map<string, Phaser.GameObjects.Container>();
  private hitstopPending = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    for (let i = 0; i < POOL_SIZE; i++) {
      const img = scene.add.image(-100, -100, 'fx_spark_0');
      img.setActive(false).setVisible(false).setDepth(800);
      this.pool.push({ img, vx: 0, vy: 0, life: 0, maxLife: 1, grav: 0, spin: 0 });
    }
  }

  update(delta: number): void {
    const dt = Math.min(delta, 50) / 1000;
    for (const p of this.pool) {
      if (p.life <= 0) continue;
      p.vy += p.grav * dt;
      p.img.x += p.vx * dt;
      p.img.y += p.vy * dt;
      p.img.angle += p.spin * dt;
      p.life -= dt;
      const fade = Math.max(0, Math.min(1, p.life / (p.maxLife * 0.4)));
      p.img.setAlpha(fade);
      if (p.life <= 0) p.img.setActive(false).setVisible(false);
    }
  }

  hitBurst(x: number, y: number, power: 0 | 1 | 2): void {
    const ri = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    if (power === 0) {
      this.flash(x, y);
      const n = ri(5, 10);
      for (let i = 0; i < n; i++) {
        const ang = rnd(0, Math.PI * 2);
        const sp = rnd(50, 130);
        this.spawn(Math.random() < 0.5 ? 'fx_spark_0' : 'fx_spark_1', x, y,
          Math.cos(ang) * sp, Math.sin(ang) * sp - 30, rnd(0.25, 0.5), 550, rnd(-360, 360), 1);
      }
    } else if (power === 1) {
      this.explosion(x, y);
      const n = ri(10, 20);
      for (let i = 0; i < n; i++) {
        const ang = rnd(0, Math.PI * 2);
        const sp = rnd(70, 190);
        const key = ['fx_spark_0', 'fx_spark_1', 'fx_star'][ri(0, 2)];
        this.spawn(key, x, y, Math.cos(ang) * sp, Math.sin(ang) * sp - 40,
          rnd(0.3, 0.6), 600, rnd(-540, 540), 1);
      }
    } else {
      this.flash(x, y);
      this.explosion(x, y);
      const n = ri(20, 30);
      for (let i = 0; i < n; i++) {
        const ang = rnd(0, Math.PI * 2);
        const sp = rnd(80, 240);
        const star = Math.random() < 0.35;
        const key = star ? 'fx_star' : Math.random() < 0.5 ? 'fx_spark_0' : 'fx_spark_1';
        this.spawn(key, x, y, Math.cos(ang) * sp, Math.sin(ang) * sp - (star ? 90 : 50),
          rnd(0.4, 0.9), star ? 250 : 650, rnd(-540, 540), star ? rnd(1, 1.5) : 1);
      }
    }
  }

  comicWord(x: number, y: number, word: string, color?: number): void {
    const bucket = `${Math.floor(x / 24)},${Math.floor(y / 24)}`;
    const old = this.words.get(bucket);
    if (old) old.destroy();
    const container = createPixelText(this.scene, x, y, word, {
      scale: 2,
      originX: 0.5,
      color: color ?? 0xffffff,
    });
    container.setDepth(999);
    container.setScale(2.5);
    this.words.set(bucket, container);
    this.scene.tweens.add({
      targets: container,
      scale: 2,
      duration: 80,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(500, () => {
          this.scene.tweens.add({
            targets: container,
            alpha: 0,
            y: y - 6,
            duration: 150,
            onComplete: () => {
              if (this.words.get(bucket) === container) this.words.delete(bucket);
              container.destroy();
            },
          });
        });
      },
    });
  }

  screenShake(intensity: number): void {
    if (!settings.screenShake) return;
    this.scene.cameras.main.shake(
      Math.min(80 + intensity * 15, 400),
      Math.min(intensity / 1000, 0.015),
    );
  }

  koStars(x: number, y: number): void {
    const stars: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < 4; i++) {
      stars.push(this.scene.add.image(x, y, 'fx_star').setDepth(998));
    }
    const state = { a: 0 };
    this.scene.tweens.add({
      targets: state,
      a: Math.PI * 4,
      duration: 1000,
      ease: 'Linear',
      onUpdate: () => {
        for (let i = 0; i < 4; i++) {
          const ang = state.a + (i * Math.PI) / 2;
          stars[i].x = x + Math.cos(ang) * 10;
          stars[i].y = y - (state.a / (Math.PI * 4)) * 8 + Math.sin(ang) * 4;
        }
      },
      onComplete: () => stars.forEach((s) => s.destroy()),
    });
    this.scene.tweens.add({ targets: stars, alpha: 0, delay: 700, duration: 280 });
  }

  hitstop(ms: number): void {
    const world = this.scene.physics?.world;
    if (!world) return;
    this.hitstopPending++;
    world.isPaused = true;
    this.scene.time.delayedCall(ms, () => {
      this.hitstopPending--;
      if (this.hitstopPending <= 0) {
        this.hitstopPending = 0;
        world.isPaused = false;
      }
    });
  }

  private spawn(key: string, x: number, y: number, vx: number, vy: number,
    life: number, grav: number, spin: number, scale: number): void {
    const p = this.pool.find((q) => q.life <= 0);
    if (!p) return;
    p.img.setTexture(key);
    p.img.setPosition(x, y);
    p.img.setAlpha(1);
    p.img.setAngle(Math.random() * 360);
    p.img.setScale(scale);
    p.img.setActive(true).setVisible(true);
    p.vx = vx;
    p.vy = vy;
    p.life = life;
    p.maxLife = life;
    p.grav = grav;
    p.spin = spin;
  }

  private flash(x: number, y: number): void {
    if (!this.scene.textures.exists('fx_flash')) return;
    const img = this.scene.add.image(x, y, 'fx_flash').setDepth(900);
    this.scene.tweens.add({
      targets: img,
      alpha: 0,
      scale: 1.6,
      duration: 100,
      onComplete: () => img.destroy(),
    });
  }

  private explosion(x: number, y: number): void {
    if (!this.scene.textures.exists('fx_explosion_0')) return;
    const img = this.scene.add.image(x, y, 'fx_explosion_0').setDepth(899);
    let frame = 0;
    this.scene.time.addEvent({
      delay: 55,
      repeat: 3,
      callback: () => {
        frame++;
        if (frame <= 3 && this.scene.textures.exists(`fx_explosion_${frame}`)) {
          img.setTexture(`fx_explosion_${frame}`);
        }
        if (frame === 3) {
          this.scene.tweens.add({
            targets: img,
            alpha: 0,
            duration: 60,
            onComplete: () => img.destroy(),
          });
        }
      },
    });
  }
}
