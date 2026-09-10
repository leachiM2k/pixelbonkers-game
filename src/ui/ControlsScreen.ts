import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../types';
import { createPixelText } from './pixelText';
import { KEYMAP } from '../systems/input';

// ControlsScreen-Vertrag (META -> MainMenuScene):
// new ControlsScreen(); create(scene) oeffnet das Overlay; destroy() schliesst es.
// Schliessen mit ESC oder ENTER. isOpen-Flag fuer Guards im Aufrufer.

const COLOR_WHITE = 0xf2f0e5;
const COLOR_GOLD = 0xf8d848;
const COLOR_DARK = 0x1a1c2c;
const OVERLAY_DEPTH = 300;

export class ControlsScreen {
  isOpen = false;

  private scene: Phaser.Scene | null = null;
  private container: Phaser.GameObjects.Container | null = null;
  private handlers: Array<{ event: string; fn: () => void }> = [];

  create(scene: Phaser.Scene): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.scene = scene;

    const km1 = KEYMAP[0];
    const km2 = KEYMAP[1];
    const rows: Array<[string, string, string]> = [
      ['MOVE', km1.up + km1.left + km1.down + km1.right, km2.up + km2.left + km2.down + km2.right],
      ['KICK', km1.melee, km2.melee],
      ['WEAPON', km1.weapon, km2.weapon],
      ['SPECIAL', km1.special, km2.special],
      ['PAUSE', 'ESC', 'ESC'],
      ['CONFIRM', 'ENTER', 'ENTER'],
      ['DEBUG', 'F10', 'F10'],
    ];

    const c = scene.add.container(0, 0);
    c.setDepth(OVERLAY_DEPTH);
    const bg = scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      COLOR_DARK,
      0.88,
    );
    c.add(bg);

    c.add(
      createPixelText(scene, GAME_WIDTH / 2, 14, 'CONTROLS', {
        scale: 2,
        originX: 0.5,
        color: COLOR_GOLD,
      }),
    );

    const p1X = 100;
    const p2X = 284;
    c.add(createPixelText(scene, p1X, 42, 'P1', { scale: 1, originX: 0.5, color: COLOR_GOLD }));
    c.add(createPixelText(scene, p2X, 42, 'P2', { scale: 1, originX: 0.5, color: COLOR_GOLD }));

    rows.forEach(([label, k1, k2], i) => {
      const y = 56 + i * 12;
      c.add(createPixelText(scene, GAME_WIDTH / 2, y, label, { scale: 1, originX: 0.5, color: COLOR_WHITE }));
      c.add(createPixelText(scene, p1X, y, k1, { scale: 1, originX: 0.5, color: COLOR_GOLD }));
      c.add(createPixelText(scene, p2X, y, k2, { scale: 1, originX: 0.5, color: COLOR_GOLD }));
    });

    const back = createPixelText(scene, GAME_WIDTH / 2, GAME_HEIGHT - 16, 'ESC: BACK', {
      scale: 1,
      originX: 0.5,
      color: COLOR_GOLD,
    });
    c.add(back);
    scene.tweens.add({ targets: back, alpha: 0, duration: 350, yoyo: true, repeat: -1 });

    this.container = c;

    const kb = scene.input.keyboard;
    if (kb) {
      const register = (event: string, fn: () => void): void => {
        kb.on(event, fn);
        this.handlers.push({ event, fn });
      };
      register('keydown-ESC', () => this.destroy());
      register('keydown-ENTER', () => this.destroy());
    }
  }

  destroy(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    const kb = this.scene?.input.keyboard;
    for (const h of this.handlers) kb?.off(h.event, h.fn);
    this.handlers = [];
    this.container?.destroy();
    this.container = null;
    this.scene = null;
  }
}
