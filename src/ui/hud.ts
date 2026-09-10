import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../types';
import { createPixelText } from './pixelText';

// HUD-Vertrag (META -> COMBAT), Signaturen GEFROREN:
// new Hud(scene); updateHp(idx, hp); updateTimer(seconds);
// showPickupPrompt(idx, text); hidePickupPrompt(idx);
// showCenterText(text, color?); clearCenterText(); roundResult(winnerIdx)

const COLOR_WHITE = 0xf2f0e5;
const COLOR_GOLD = 0xf8d848;
const COLOR_DARK = 0x1a1c2c;
const HP_GREEN = 0x28d84a;
const HP_YELLOW = 0xffd83a;
const HP_RED = 0xf84838;
const MAX_HP = 100;
const BAR_FILL_W = 58;
const HUD_DEPTH = 50;
const OVERLAY_DEPTH = 100;

function hpColor(hp: number): number {
  if (hp > 50) return HP_GREEN;
  if (hp >= 25) return HP_YELLOW;
  return HP_RED;
}

class PlayerSlot {
  private hp = MAX_HP;
  private readonly hearts: Phaser.GameObjects.Image[] = [];
  private shakeTween: Phaser.Tweens.Tween | null = null;
  private readonly baseFrameX: number;
  private readonly baseFillX: number;

  constructor(
    private scene: Phaser.Scene,
    private frame: Phaser.GameObjects.Image,
    private fill: Phaser.GameObjects.Image,
  ) {
    this.baseFrameX = frame.x;
    this.baseFillX = fill.x;
  }

  static build(scene: Phaser.Scene, idx: 0 | 1): PlayerSlot {
    const left = idx === 0;
    const originX = left ? 0 : 1;
    const px = left ? 4 : GAME_WIDTH - 20;
    const tx = left ? 24 : GAME_WIDTH - 24;
    const barX = left ? 24 : GAME_WIDTH - 88;
    const heartX = left ? 24 : GAME_WIDTH - 31;

    const portrait = scene.add.image(px, 2, `hud_portrait_${idx + 1}`).setOrigin(0, 0);
    portrait.setDepth(HUD_DEPTH);
    createPixelText(scene, tx, 3, `P${idx + 1}`, { scale: 1, originX, color: COLOR_GOLD }).setDepth(HUD_DEPTH);
    createPixelText(scene, tx, 11, `PLAYER ${idx + 1}`, { scale: 1, originX, color: COLOR_WHITE }).setDepth(HUD_DEPTH);

    const frame = scene.add.image(barX, 20, 'hud_bar_frame').setOrigin(0, 0);
    frame.setDepth(HUD_DEPTH);
    const fill = scene
      .add.image(left ? barX + 3 : barX + 61, 22, 'hud_bar_fill')
      .setOrigin(left ? 0 : 1, 0);
    fill.setDepth(HUD_DEPTH);

    const slot = new PlayerSlot(scene, frame, fill);
    for (let i = 0; i < 3; i++) {
      const heart = scene
        .add.image(heartX + i * 9 * (left ? 1 : -1), 30, 'hud_heart')
        .setOrigin(0, 0);
      heart.setDepth(HUD_DEPTH);
      slot.hearts.push(heart);
    }
    slot.setHp(MAX_HP, false);
    return slot;
  }

  setHp(hp: number, flash = true): void {
    const v = Phaser.Math.Clamp(hp, 0, MAX_HP);
    const damaged = v < this.hp;
    this.hp = v;
    this.fill.setDisplaySize(Math.round((v / MAX_HP) * BAR_FILL_W), 4);
    this.fill.setTint(hpColor(v));
    const count = Math.ceil(v / 34);
    this.hearts.forEach((h, i) => h.setTexture(i < count ? 'hud_heart' : 'hud_heart_empty'));
    if (damaged && flash) {
      this.fill.setTintFill(0xffffff);
      this.scene.time.delayedCall(70, () => this.fill.setTint(hpColor(this.hp)));
      this.shakeTween?.remove();
      this.frame.x = this.baseFrameX;
      this.fill.x = this.baseFillX;
      this.scene.tweens.add({
        targets: [this.frame, this.fill],
        x: '+=2',
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
    this.slots = [PlayerSlot.build(scene, 0), PlayerSlot.build(scene, 1)];

    const vs = scene.add.image(GAME_WIDTH / 2 - 12, 3, 'hud_vs').setOrigin(0, 0);
    vs.setDepth(HUD_DEPTH);
    createPixelText(scene, GAME_WIDTH / 2, 18, 'TIME', { scale: 1, originX: 0.5, color: COLOR_WHITE }).setDepth(HUD_DEPTH);
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
    this.timerText = createPixelText(this.scene, GAME_WIDTH / 2, 27, String(s).padStart(2, '0'), {
      scale: 2,
      originX: 0.5,
      color: low ? HP_RED : COLOR_GOLD,
    });
    this.timerText.setDepth(HUD_DEPTH);
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
