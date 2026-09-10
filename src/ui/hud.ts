import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../types';
import { createPixelText } from './pixelText';

// HUD-Vertrag (META -> COMBAT), signaturen GEFROREN:
// new Hud(scene); updateHp(idx, hp); updateTimer(seconds);
// showPickupPrompt(idx, text); hidePickupPrompt(idx);
// showCenterText(text, color?); clearCenterText(); roundResult(winnerIdx)
//
// Zusammengesetztes HUD (kein Komplett-Bild):
// - Portrait-Platten (hud_player1/2, 59x58 im 2x-Raum) links/rechts
// - Energiebalken VON HAND GEZEICHNET (2x-Raum, x0.5 Anzeige):
//     148x18, 2px schwarzer Rahmen nach innen (-> 74x9 / 1px Anzeige)
//     Fuellung gruen #3be741 (aktueller HP), roter Boden #fa2042 (verloren)
//     weisser Glanz-Strich: 2px unter dem oberen Rand, 3px Seitenabstand,
//     halbtransparent (3D-Glas-Effekt)
// - Herzen hud_heart/hud_heart_empty (27x25 im 2x-Raum)
// - VS-Logo aus dem Original-Sheet (hud_vs), TIME-Box mit gezeichnetem Rahmen

const COLOR_WHITE = 0xf2f0e5;
const COLOR_GOLD = 0xf8d848;
const COLOR_DARK = 0x1a1c2c;
const HP_GREEN = 0x3be741;
const HP_LOST = 0xfa2042;
const HP_FLASH = 0xffffff;
const FRAME_BLACK = 0x000000;
const MAX_HP = 100;
const HUD_DEPTH = 50;
const OVERLAY_DEPTH = 100;

/** Alle Bestandteile (ausser Text) leben im 2x-Referenzraum. */
const S2 = 0.5;

// Balken-Spezifikation (2x-Raum): 148x18, 2px Rahmen nach innen
const BAR_W = 148 * S2;
const BAR_H = 18 * S2;
const BAR_INSET = 2 * S2;
const BAR_INNER_W = BAR_W - 2 * BAR_INSET;
const BAR_INNER_H = BAR_H - 2 * BAR_INSET;
const GLOSS_TOP = 4 * S2;
const GLOSS_H = 2 * S2;
const GLOSS_INSET = 5 * S2;
const GLOSS_ALPHA = 0.4;

const PORTRAIT_X = 3;
const PORTRAIT_Y = 3;
const PORTRAIT_W = 59 * S2;
const PORTRAIT_H = 58 * S2;
const BAR_Y = 13;
const LABEL_Y = 4;
const HEART_Y = 24;
const HEART_W = 27 * S2;
const HEART_H = 25 * S2;
const HEART_STEP = 29 * S2;

class PlayerSlot {
  private hp = MAX_HP;
  private readonly hearts: Phaser.GameObjects.Image[] = [];
  private readonly barParts: Phaser.GameObjects.Rectangle[] = [];
  private shakeTween: Phaser.Tweens.Tween | null = null;
  private readonly fillX: number;
  private readonly fillMaxW: number;

  constructor(
    private scene: Phaser.Scene,
    private left: boolean,
    private fill: Phaser.GameObjects.Rectangle,
    gloss: Phaser.GameObjects.Rectangle,
    fillAnchorX: number,
  ) {
    // Anker der Fuellung: linke Innenkante (P1) bzw. rechte Innenkante (P2)
    this.fillX = fillAnchorX;
    this.fillMaxW = BAR_INNER_W;
    this.barParts = [fill, gloss];
  }

  static build(scene: Phaser.Scene, idx: 0 | 1): PlayerSlot {
    const left = idx === 0;
    const barX = left ? PORTRAIT_X + PORTRAIT_W + 4 : GAME_WIDTH - PORTRAIT_X - PORTRAIT_W - 4 - BAR_W;

    scene.add
      .image(PORTRAIT_X + (left ? 0 : GAME_WIDTH - 2 * PORTRAIT_X - PORTRAIT_W), PORTRAIT_Y, `hud_player${idx + 1}`)
      .setOrigin(0, 0)
      .setDisplaySize(PORTRAIT_W, PORTRAIT_H)
      .setDepth(HUD_DEPTH);
    createPixelText(scene, left ? barX : barX + BAR_W, LABEL_Y, `P${idx + 1}`, {
      scale: 1,
      originX: left ? 0 : 1,
      color: COLOR_GOLD,
    }).setDepth(HUD_DEPTH);

    // Schwarzer Rahmen (Basis) + roter Innenboden
    scene.add.rectangle(barX, BAR_Y, BAR_W, BAR_H, FRAME_BLACK).setOrigin(0, 0).setDepth(HUD_DEPTH);
    const lost = scene.add
      .rectangle(barX + BAR_INSET, BAR_Y + BAR_INSET, BAR_INNER_W, BAR_INNER_H, HP_LOST)
      .setOrigin(0, 0)
      .setDepth(HUD_DEPTH);
    // Gruene HP-Fuellung: waechst vom verankerten Rand (P1 links / P2 rechts)
    const fill = scene.add
      .rectangle(barX + BAR_INSET, BAR_Y + BAR_INSET, BAR_INNER_W, BAR_INNER_H, HP_GREEN)
      .setOrigin(0, 0)
      .setDepth(HUD_DEPTH);
    // Weisser Glas-Glanz oben, halbdurchscheinend
    const gloss = scene.add
      .rectangle(barX + GLOSS_INSET, BAR_Y + GLOSS_TOP, BAR_W - 2 * GLOSS_INSET, GLOSS_H, 0xffffff, GLOSS_ALPHA)
      .setOrigin(0, 0)
      .setDepth(HUD_DEPTH);

    const slot = new PlayerSlot(scene, left, fill, gloss, left ? barX + BAR_INSET : barX + BAR_W - BAR_INSET);
    slot.barParts.push(lost);
    for (let i = 0; i < 3; i++) {
      const heartX = left
        ? barX + i * HEART_STEP
        : barX + BAR_W - HEART_W - i * HEART_STEP;
      const heart = scene.add
        .image(heartX, HEART_Y, 'hud_heart')
        .setOrigin(0, 0)
        .setDisplaySize(HEART_W, HEART_H)
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
    const fillW = Math.max(0, (v / MAX_HP) * this.fillMaxW);
    this.fill.width = fillW;
    this.fill.x = this.left ? this.fillX : this.fillX - fillW;
    const count = Math.ceil(v / 34);
    this.hearts.forEach((h, i) => h.setTexture(i < count ? 'hud_heart' : 'hud_heart_empty'));
    if (damaged && flash) {
      this.fill.setFillStyle(HP_FLASH);
      this.scene.time.delayedCall(70, () => this.fill.setFillStyle(HP_GREEN));
      this.shakeTween?.remove();
      this.fill.x = this.left ? this.fillX : this.fillX - fillW;
      this.scene.tweens.add({
        targets: this.barParts,
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
    // VS-Logo aus dem Sheet (66x33 nativ) oben mittig
    scene.add
      .image(GAME_WIDTH / 2, 2, 'hud_vs')
      .setOrigin(0.5, 0)
      .setDisplaySize(44, 22)
      .setDepth(HUD_DEPTH);
    // TIME-Box: gezeichneter schwarzer Rahmen, transparenter Innenraum
    const boxW = 34, boxH = 26, boxX = GAME_WIDTH / 2 - boxW / 2, boxY = 26;
    scene.add
      .rectangle(boxX + boxW / 2, boxY + boxH / 2, boxW, boxH)
      .setStrokeStyle(1, FRAME_BLACK)
      .setFillStyle(FRAME_BLACK, 0)
      .setDepth(HUD_DEPTH);
    createPixelText(scene, GAME_WIDTH / 2, boxY + 2, 'TIME', {
      scale: 1,
      originX: 0.5,
      color: COLOR_WHITE,
    }).setDepth(HUD_DEPTH);
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
    this.timerText = createPixelText(this.scene, GAME_WIDTH / 2, 36, String(s).padStart(2, '0'), {
      scale: 2,
      originX: 0.5,
      color: low ? 0xfa2042 : COLOR_GOLD,
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
    const shadow = createPixelText(this.scene, scale, scale, text, { scale, originX: 0.5, color: COLOR_DARK, forceTint: true });
    const main = createPixelText(this.scene, 0, 0, text, { scale, originX: 0.5, color: col });
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
    const shadow = createPixelText(this.scene, 2, 2, label, { scale: 2, originX: 0.5, color: COLOR_DARK, forceTint: true });
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
