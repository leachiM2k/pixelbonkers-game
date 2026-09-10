import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../types';
import { createPixelText } from './pixelText';
import { AudioSystem } from '../systems/audio';

// PauseMenu-Vertrag (META -> COMBAT), Signaturen GEFROREN:
// new PauseMenu(scene, {resume, restart, mainMenu}); open(); close(); isOpen
// ESC = resume, W/S/UP/DOWN + ENTER Navigation. BattleScene friert selbst ein.

export interface PauseCallbacks {
  resume: () => void;
  restart: () => void;
  mainMenu: () => void;
}

const COLOR_WHITE = 0xf2f0e5;
const COLOR_GOLD = 0xf8d848;
const COLOR_DARK = 0x1a1c2c;
const MENU_DEPTH = 200;

export class PauseMenu {
  isOpen = false;

  private scene: Phaser.Scene;
  private callbacks: PauseCallbacks;
  private container: Phaser.GameObjects.Container;
  private cursor: Phaser.GameObjects.Image;
  private itemTexts: Phaser.GameObjects.Container[] = [];
  private audio: AudioSystem | null = null;
  private selection = 0;
  private handlers: Array<{ event: string; fn: () => void }> = [];
  private readonly items = ['RESUME', 'RESTART ROUND', 'MAIN MENU'];
  private readonly itemX = 164;
  private readonly itemBaseY = 96;
  private readonly itemStep = 13;

  constructor(scene: Phaser.Scene, callbacks: PauseCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;

    const c = scene.add.container(0, 0);
    c.setVisible(false);
    c.setDepth(MENU_DEPTH);
    const overlay = scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.6,
    );
    c.add(overlay);

    const shadow = createPixelText(scene, GAME_WIDTH / 2 + 3, 57 + 3, 'PAUSE', {
      scale: 3,
      originX: 0.5,
      color: COLOR_DARK,
    });
    const title = createPixelText(scene, GAME_WIDTH / 2, 57, 'PAUSE', {
      scale: 3,
      originX: 0.5,
      color: COLOR_GOLD,
    });
    c.add([shadow, title]);

    this.items.forEach((label, i) => {
      const t = createPixelText(scene, this.itemX, this.itemBaseY + i * this.itemStep, label, {
        scale: 1,
        color: COLOR_WHITE,
      });
      this.itemTexts.push(t);
      c.add(t);
    });

    this.cursor = scene.add.image(this.itemX - 10, this.itemBaseY, 'font_>');
    this.cursor.setOrigin(0, 0);
    c.add(this.cursor);

    const hint = createPixelText(scene, GAME_WIDTH / 2, GAME_HEIGHT - 24, 'ESC: RESUME', {
      scale: 1,
      originX: 0.5,
      color: COLOR_WHITE,
    });
    hint.setAlpha(0.7);
    c.add(hint);

    this.container = c;
  }

  open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.selection = 0;
    this.updateVisual();
    this.container.setVisible(true);
    this.container.setAlpha(0);
    this.scene.tweens.add({ targets: this.container, alpha: 1, duration: 80 });
    if (!this.audio) this.audio = new AudioSystem(this.scene);
    const kb = this.scene.input.keyboard;
    if (!kb) return;
    const on = (event: string, fn: () => void): void => {
      kb.on(event, fn);
      this.handlers.push({ event, fn });
    };
    on('keydown-W', () => this.move(-1));
    on('keydown-UP', () => this.move(-1));
    on('keydown-S', () => this.move(1));
    on('keydown-DOWN', () => this.move(1));
    on('keydown-ENTER', () => this.confirm());
    on('keydown-ESC', () => {
      this.close();
      this.callbacks.resume();
    });
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    const kb = this.scene.input.keyboard;
    for (const h of this.handlers) kb?.off(h.event, h.fn);
    this.handlers = [];
    this.container.setVisible(false);
  }

  private move(dir: number): void {
    this.selection = (this.selection + dir + this.items.length) % this.items.length;
    this.updateVisual();
    this.audio?.play('menuSelect');
  }

  private confirm(): void {
    this.audio?.play('menuSelect');
    const action = [this.callbacks.resume, this.callbacks.restart, this.callbacks.mainMenu][
      this.selection
    ];
    this.close();
    action();
  }

  private updateVisual(): void {
    this.itemTexts.forEach((t, i) => this.tintText(t, i === this.selection ? COLOR_GOLD : COLOR_WHITE));
    this.cursor.setPosition(this.itemX - 10, this.itemBaseY + this.selection * this.itemStep + 1);
  }

  private tintText(c: Phaser.GameObjects.Container, color: number): void {
    for (const child of c.list) {
      if (child instanceof Phaser.GameObjects.Image) child.setTint(color);
    }
  }
}
