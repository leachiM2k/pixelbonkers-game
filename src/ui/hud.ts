import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../types';
import { createPixelText } from './pixelText';

// HUD-Vertrag (META -> COMBAT), signaturen GEFROREN:
// new Hud(scene); updateHp(idx, hp); updateTimer(seconds);
// showPickupPrompt(idx, text); hidePickupPrompt(idx);
// showCenterText(text, color?); clearCenterText(); roundResult(winnerIdx)
//
// Optik: Komplett-Panel hud_panel.png (575x105 nativ) als Bild,
// Portraets/Labels/VS/TIME/Rahmen sind gebacken. Dynamisch obendrauf:
// HP-Fuellung (plus dunkle Verlustzone + Abdeckung der rote Spitze),
// Herzen-Zustaende und die Timer-Ziffern (gebackene '60' ausgestanzt).
// Asset-Koordinaten (575er-Raster) * PANEL_SCALE = Spielfeld-Koordinaten.

const COLOR_WHITE = 0xf2f0e5;
const COLOR_GOLD = 0xf8d848;
const COLOR_DARK = 0x1a1c2c;
const HP_GREEN = 0x28d84a;
const HP_YELLOW = 0xffd83a;
const HP_RED = 0xf84838;
const PANEL_DARK = 0x0c1117;
const MAX_HP = 100;
const HUD_DEPTH = 50;
const OVERLAY_DEPTH = 100;

/** hud_panel.png nativ 575x105, Anzeige 384 breit. */
const PANEL_SCALE = GAME_WIDTH / 575;
const S = PANEL_SCALE;

// Asset-Koordinaten (575er-Raster), deterministisch aus dem PNG vermessen:
// - Balken-Innenraum (farbige Zone): P1 x 96..237, P2 x 339..480, y 15..23
// - rote 'Spitzen' des Sample-Zustands ragen bis y 12 hoch (P1 x 207..237, P2 x 339..355)
// - Herzen: P1 x [74..93, 100..120, 126..145], P2 x [484..504, 457..477, 430..451], y 37..54
// - Ziffern-Fenster (ausgestanzt): x 268..314, y 70..93
const BAR_ZONE: Array<{ x1: number; x2: number; pokeX1: number; pokeX2: number }> = [
  { x1: 96, x2: 237, pokeX1: 207, pokeX2: 237 },
  { x1: 339, x2: 480, pokeX1: 339, pokeX2: 355 },
];
const BAR_Y = 15, BAR_H = 9, POKE_Y = 12, POKE_H = 3;
const HEART_BOXES: Array<Array<[number, number]>> = [
  [[74, 93], [100, 120], [126, 145]],
  [[484, 504], [457, 477], [430, 451]],
];
const HEART_Y = 37, HEART_H = 18;
const DIGITS_X = 291, DIGITS_Y = 81.5;

function hpColor(hp: number): number {
  if (hp > 50) return HP_GREEN;
  if (hp >= 25) return HP_YELLOW;
  return HP_RED;
}

class PlayerSlot {
  private hp = MAX_HP;
  private readonly hearts: Phaser.GameObjects.Image[] = [];
  private shakeTween: Phaser.Tweens.Tween | null = null;
  private readonly barX: number;
  private readonly barW: number;

  constructor(
    private scene: Phaser.Scene,
    private left: boolean,
    private fill: Phaser.GameObjects.Rectangle,
    private lost: Phaser.GameObjects.Rectangle,
  ) {
    this.barX = fill.x;
    this.barW = fill.width;
  }

  static build(scene: Phaser.Scene, idx: 0 | 1): PlayerSlot {
    const left = idx === 0;
    const zone = BAR_ZONE[idx];
    const fullW = (zone.x2 - zone.x1 + 1) * S;
    const anchorX = (left ? zone.x1 : zone.x2) * S;

    // Abdeckung der hochragenden roten Spitze (Sample-Zustand des Assets)
    scene.add
      .rectangle(zone.pokeX1 * S, POKE_Y * S,
        (zone.pokeX2 - zone.pokeX1 + 1) * S, POKE_H * S, PANEL_DARK)
      .setOrigin(0, 0)
      .setDepth(HUD_DEPTH);

    const lost = scene.add
      .rectangle(anchorX, BAR_Y * S, 0, BAR_H * S, PANEL_DARK)
      .setOrigin(left ? 0 : 1, 0)
      .setDepth(HUD_DEPTH);
    const fill = scene.add
      .rectangle(anchorX, BAR_Y * S, fullW, BAR_H * S, HP_GREEN)
      .setOrigin(left ? 0 : 1, 0)
      .setDepth(HUD_DEPTH);

    const slot = new PlayerSlot(scene, left, fill, lost);
    for (const [hx1, hx2] of HEART_BOXES[idx]) {
      const heart = scene.add
        .image(hx1 * S, HEART_Y * S, 'hud_heart')
        .setOrigin(0, 0)
        .setDisplaySize((hx2 - hx1 + 1) * S, HEART_H * S)
        .setDepth(HUD_DEPTH);
      slot.hearts.push(heart);
    }
    slot.setHp(MAX_HP, false);
    return slot;
  }

  setHp(hp: number, flash = true): void {
    const v = Phaser.Math.Clamp(hp, 0, MAX_HP);
    const damaged = v < this.hp;
    this.hp = v;
    const fillW = Math.max(0, Math.round((v / MAX_HP) * this.barW));
    this.fill.width = fillW;
    this.lost.width = Math.max(0, this.barW - fillW);
    this.fill.setFillStyle(hpColor(v));
    const count = Math.ceil(v / 34);
    this.hearts.forEach((h, i) => h.setTexture(i < count ? 'hud_heart' : 'hud_heart_empty'));
    if (damaged && flash) {
      this.fill.setFillStyle(0xffffff);
      this.scene.time.delayedCall(70, () => this.fill.setFillStyle(hpColor(this.hp)));
      this.shakeTween?.remove();
      this.fill.x = this.barX;
      this.scene.tweens.add({
        targets: [this.fill, this.lost],
        x: `+=${this.left ? 2 : -2}`,
        duration: 40,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.InOut',
        onComplete: () => {
          this.shakeTween = null;
        },
      });
    }
  }
}

export class Hud {
  private readonly slots: PlayerSlot[] = [];
  private timerText: Phaser.GameObjects.Container | null = null;
  private timerTween: Phaser.Tweens.Tween | null = null;
  private lastSeconds = -1;
  private readonly prompts: (Phaser.GameObjects.Container | null)[] = [null, null];
  private readonly promptTweens: (Phaser.Tweens.Tween | null)[] = [null, null];
  private centerContainer: Phaser.GameObjects.Container | null = null;
  private centerTweens: Phaser.Tweens.Tween[] = [];
  private resultContainer: Phaser.GameObjects.Container | null = null;
  private resultTween: Phaser.Tweens.Tween | null = null;

  constructor(private scene: Phaser.Scene) {
    scene.add.image(0, 0, 'hud_panel').setOrigin(0, 0).setDisplaySize(GAME_WIDTH, 105 * S).setDepth(HUD_DEPTH);
    this.slots = [PlayerSlot.build(scene, 0), PlayerSlot.build(scene, 1)];
    this.updateTimer(60);
  }

  updateHp(idx: 0 | 1, hp: number): void {
    this.slots[idx]?.setHp(hp);
  }

  updateTimer(seconds: number): void {
    const s = Phaser.Math.Clamp(Math.floor(seconds), 0, 99);
    if (s === this.lastSeconds) return;
    this.lastSeconds = s;
    this.timerTween?.remove();
    this.timerTween = null;
    this.timerText?.destroy();
    this.timerText = null;
    const low = s <= 10;
    this.timerText = createPixelText(this.scene, DIGITS_X * S, DIGITS_Y * S, String(s).padStart(2, '0'), {
      scale: 2,
      originX: 0.5,
      color: low ? HP_RED : COLOR_GOLD,
    });
    this.timerText.setDepth(HUD_DEPTH + 1);
    if (low) {
      this.timerTween = this.scene.tweens.add({
        targets: this.timerText,
        alpha: 0,
        duration: 250,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  showPickupPrompt(idx: 0 | 1, text: string): void {
    this.hidePickupPrompt(idx);
    const left = idx === 0;
    const prompt = createPixelText(
      this.scene,
      left ? 8 : GAME_WIDTH - 8,
      GAME_HEIGHT - 12,
      text,
      { scale: 1, originX: left ? 0 : 1, color: COLOR_GOLD },
    );
    prompt.setDepth(HUD_DEPTH);
    this.prompts[idx] = prompt;
    this.promptTweens[idx] = this.scene.tweens.add({
      targets: prompt,
      alpha: 0,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });
  }

  hidePickupPrompt(idx: 0 | 1): void {
    this.promptTweens[idx]?.remove();
    this.promptTweens[idx] = null;
    this.prompts[idx]?.destroy();
    this.prompts[idx] = null;
  }

  showCenterText(text: string, color?: number): void {
    this.clearCenterText();
    if (!text) return;
    const scale = text.length <= 6 ? 4 : 3;
    const col = color ?? COLOR_GOLD;
    const cy = GAME_HEIGHT / 2 - (7 * scale) / 2;
    const shadow = createPixelText(this.scene, scale, scale, text, { scale, color: COLOR_DARK });
    const main = createPixelText(this.scene, 0, 0, text, { scale, color: col });
    const c = this.scene.add.container(GAME_WIDTH / 2, cy - 8);
    c.add([shadow, main]);
    c.setDepth(OVERLAY_DEPTH);
    this.centerContainer = c;
    this.centerTweens.push(
      this.scene.tweens.add({ targets: c, alpha: 1, duration: 100 }),
      this.scene.tweens.add({ targets: c, y: cy, duration: 160, ease: 'Back.Out' }),
    );
  }

  clearCenterText(): void {
    this.centerTweens.forEach((t) => t.remove());
    this.centerTweens = [];
    this.centerContainer?.destroy();
    this.centerContainer = null;
  }

  roundResult(winnerIdx: 0 | 1 | -1): void {
    this.clearCenterText();
    this.resultTween?.remove();
    this.resultTween = null;
    this.resultContainer?.destroy();
    this.resultContainer = null;
    const label = winnerIdx === -1 ? 'DRAW!' : `PLAYER ${winnerIdx + 1} WINS!`;
    const shadow = createPixelText(this.scene, 2, 2, label, { scale: 2, originX: 0.5, color: COLOR_DARK });
    const win = createPixelText(this.scene, 0, 0, label, { scale: 2, originX: 0.5, color: COLOR_GOLD });
    const rematch = createPixelText(this.scene, 0, 18, 'PRESS ENTER FOR REMATCH', {
      scale: 1,
      originX: 0.5,
      color: COLOR_WHITE,
    });
    const c = this.scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 46);
    c.add([shadow, win, rematch]);
    c.setDepth(OVERLAY_DEPTH);
    this.resultContainer = c;
    this.resultTween = this.scene.tweens.add({
      targets: rematch,
      alpha: 0,
      duration: 350,
      yoyo: true,
      repeat: -1,
    });
  }
}
