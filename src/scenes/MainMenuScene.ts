import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../types';
import { settings, saveSettings } from '../game/settings';
import { AudioSystem } from '../systems/audio';
import { KEYMAP } from '../systems/input';
import { createPixelText } from '../ui/pixelText';
import { ControlsScreen } from '../ui/ControlsScreen';

// META-Ownership: MainMenuScene. Arcade-Titelbildschirm laut Spezifikation 16/36.

const COLOR_WHITE = 0xf2f0e5;
const COLOR_GOLD = 0xf8d848;
const COLOR_DARK = 0x1a1c2c;
const COLOR_RED = 0xe04848;
const COLOR_GREEN = 0x28d84a;

type ToggleKey = 'sound' | 'music' | 'screenShake';

interface MenuItem {
  label: () => string;
  run: () => void;
}

export class MainMenuScene extends Phaser.Scene {
  private audio!: AudioSystem;
  private controls!: ControlsScreen;
  private items: MenuItem[] = [];
  private itemTexts: Phaser.GameObjects.Container[] = [];
  private cursor!: Phaser.GameObjects.Image;
  private selection = 0;
  private coinText: Phaser.GameObjects.Container | null = null;
  private coinTween: Phaser.Tweens.Tween | null = null;
  private showCredits = false;
  private subtitle: Phaser.GameObjects.Container | null = null;

  private readonly menuX = 150;
  private readonly menuBaseY = 76;
  private readonly menuStep = 11;

  constructor() {
    super('MainMenuScene');
  }

  create(): void {
    this.selection = 0;
    this.showCredits = false;
    this.audio = new AudioSystem(this);
    this.controls = new ControlsScreen();
    this.itemTexts = [];
    this.subtitle = null;
    this.coinText = null;
    this.coinTween = null;

    this.buildBackground();
    this.buildTitle();
    this.buildMenu();
    this.buildFooter();

    const kb = this.input.keyboard;
    if (kb) {
      kb.on('keydown-W', this.onUp, this);
      kb.on('keydown-UP', this.onUp, this);
      kb.on('keydown-S', this.onDown, this);
      kb.on('keydown-DOWN', this.onDown, this);
      kb.on('keydown-ENTER', this.onConfirm, this);
      kb.on('keydown-ESC', this.onEscape, this);
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
  }

  private buildBackground(): void {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'arena_sky');

    const cloudSpecs: Array<[number, number, string, number]> = [
      [40, 22, 'arena_cloud_0', 9000],
      [170, 34, 'arena_cloud_1', 12000],
      [300, 18, 'arena_cloud_2', 7500],
    ];
    for (const [x, y, key, dur] of cloudSpecs) {
      const cloud = this.add.image(x, y, key).setOrigin(0, 0);
      this.tweens.add({ targets: cloud, x: x + 24, duration: dur, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }

    const tree = this.add.image(48, GAME_HEIGHT - 4, 'arena_tree');
    tree.setOrigin(0.5, 1);
    const bush = this.add.image(330, GAME_HEIGHT - 4, 'arena_bush');
    bush.setOrigin(0.5, 1);

    this.spawnIdleBoy(140, 'boy1_idle_0', 'boy1_idle', false);
    this.spawnIdleBoy(244, 'boy2_idle_0', 'boy2_idle', true);
  }

  private spawnIdleBoy(x: number, frameKey: string, animKey: string, flip: boolean): void {
    const boy = this.add.sprite(x, GAME_HEIGHT - 4, frameKey);
    boy.setOrigin(0.5, 1);
    boy.setScale(2);
    boy.setFlipX(flip);
    if (this.anims.exists(animKey)) boy.play(animKey);
  }

  private buildTitle(): void {
    const title = this.add.container(GAME_WIDTH / 2, 14);
    title.add(
      createPixelText(this, 4, 4, 'PIXEL BONKERS', { scale: 4, originX: 0.5, color: COLOR_DARK }),
    );
    title.add(
      createPixelText(this, 0, 0, 'PIXEL BONKERS', { scale: 4, originX: 0.5, color: COLOR_GOLD }),
    );

    this.subtitle = createPixelText(this, GAME_WIDTH / 2, 50, '2 PLAYER MAYHEM', {
      scale: 1,
      originX: 0.5,
      color: COLOR_WHITE,
    });
    const subColors = [COLOR_WHITE, COLOR_GOLD, COLOR_RED, COLOR_GREEN];
    let ci = 0;
    this.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => {
        ci = (ci + 1) % subColors.length;
        this.tintText(this.subtitle, subColors[ci]);
      },
    });

    const pressEnter = createPixelText(this, GAME_WIDTH / 2, 62, 'PRESS ENTER', {
      scale: 1,
      originX: 0.5,
      color: COLOR_WHITE,
    });
    this.tweens.add({ targets: pressEnter, alpha: 0, duration: 450, yoyo: true, repeat: -1 });
  }

  private buildMenu(): void {
    this.items = [
      { label: () => 'VS LOCAL', run: () => this.scene.start('BattleScene') },
      { label: () => `SOUND: ${settings.sound ? 'ON' : 'OFF'}`, run: () => this.toggle('sound') },
      { label: () => `MUSIC: ${settings.music ? 'ON' : 'OFF'}`, run: () => this.toggle('music') },
      {
        label: () => `SCREEN SHAKE: ${settings.screenShake ? 'ON' : 'OFF'}`,
        run: () => this.toggle('screenShake'),
      },
      { label: () => 'FULLSCREEN', run: () => this.scale.toggleFullscreen() },
      { label: () => 'CONTROLS', run: () => this.controls.create(this) },
    ];
    this.cursor = this.add.image(this.menuX - 6, this.menuBaseY, 'font_>');
    this.cursor.setOrigin(0, 0);
    this.renderItems();
  }

  private buildFooter(): void {
    const km1 = KEYMAP[0];
    const km2 = KEYMAP[1];
    const move1 = km1.up + km1.left + km1.down + km1.right;
    const move2 = km2.up + km2.left + km2.down + km2.right;
    createPixelText(this, GAME_WIDTH / 2, 150, `P1: ${move1} ${km1.melee}/${km1.weapon}`, {
      scale: 1,
      originX: 0.5,
      color: COLOR_WHITE,
    });
    createPixelText(this, GAME_WIDTH / 2, 161, `P2: ${move2} ${km2.melee}/${km2.weapon}`, {
      scale: 1,
      originX: 0.5,
      color: COLOR_WHITE,
    });
    this.renderCoin();
  }

  private renderCoin(): void {
    this.coinTween?.remove();
    this.coinTween = null;
    this.coinText?.destroy();
    this.coinText = null;
    this.coinText = createPixelText(
      this,
      GAME_WIDTH - 4,
      GAME_HEIGHT - 9,
      this.showCredits ? '(C) 2026 BONKWORKS - FREE PLAY' : 'INSERT COIN',
      { scale: 1, originX: 1, color: COLOR_GOLD },
    );
    this.coinTween = this.tweens.add({
      targets: this.coinText,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
  }

  private toggle(key: ToggleKey): void {
    settings[key] = !settings[key];
    saveSettings(settings);
    this.renderItems();
  }

  private renderItems(): void {
    this.itemTexts.forEach((t) => t.destroy());
    this.itemTexts = this.items.map((item, i) => {
      const t = createPixelText(this, this.menuX, this.menuBaseY + i * this.menuStep, item.label(), {
        scale: 1,
        color: COLOR_WHITE,
      });
      if (i === this.selection) this.tintText(t, COLOR_GOLD);
      return t;
    });
    this.cursor.setPosition(this.menuX - 6, this.menuBaseY + this.selection * this.menuStep + 1);
  }

  private onUp(): void {
    if (this.controls.isOpen) return;
    this.selection = (this.selection - 1 + this.items.length) % this.items.length;
    this.renderItems();
    this.audio.play('menuSelect');
  }

  private onDown(): void {
    if (this.controls.isOpen) return;
    this.selection = (this.selection + 1) % this.items.length;
    this.renderItems();
    this.audio.play('menuSelect');
  }

  private onConfirm(): void {
    if (this.controls.isOpen) return;
    this.audio.play('menuSelect');
    this.items[this.selection].run();
  }

  private onEscape(): void {
    if (this.controls.isOpen) return;
    this.showCredits = !this.showCredits;
    this.renderCoin();
  }

  private tintText(c: Phaser.GameObjects.Container | null, color: number): void {
    if (!c) return;
    for (const child of c.list) {
      if (child instanceof Phaser.GameObjects.Image) child.setTint(color);
    }
  }

  private cleanup(): void {
    const kb = this.input.keyboard;
    if (kb) {
      kb.off('keydown-W', this.onUp, this);
      kb.off('keydown-UP', this.onUp, this);
      kb.off('keydown-S', this.onDown, this);
      kb.off('keydown-DOWN', this.onDown, this);
      kb.off('keydown-ENTER', this.onConfirm, this);
      kb.off('keydown-ESC', this.onEscape, this);
    }
    this.controls.destroy();
  }
}
