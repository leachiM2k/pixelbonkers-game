import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../types';
import { settings, saveSettings } from '../game/settings';
import { AudioSystem } from '../systems/audio';
import { KEYMAP } from '../systems/input';
import { createPixelText } from '../ui/pixelText';
import { ControlsScreen } from '../ui/ControlsScreen';
import { OnlineMenu, NetSessionFactoryLike } from '../ui/OnlineMenu';
import { createNetSessionFactory } from '../ui/netFactory';
import { isPngKey } from '../sprites/manifest';
import type { NetBattleConfig, NetSession } from '../net/contract';

// META-Ownership: MainMenuScene. Arcade-Titelbildschirm laut Spezifikation 16/36.

const COLOR_WHITE = 0xf2f0e5;
const COLOR_GOLD = 0xf8d848;
const COLOR_DARK = 0x1a1c2c;

type ToggleKey = 'sound' | 'music' | 'screenShake' | 'melee';

interface MenuItem {
  label: () => string;
  run: () => void;
  status?: () => boolean;
}

export class MainMenuScene extends Phaser.Scene {
  private audio!: AudioSystem;
  private controls!: ControlsScreen;
  private items: MenuItem[] = [];
  private rowObjects: Array<Phaser.GameObjects.Rectangle | Phaser.GameObjects.Container> = [];
  private footerTexts: Phaser.GameObjects.Container[] = [];
  private pressEnter: Phaser.GameObjects.Container | null = null;
  private selection = 0;
  private menuMode: 'main' | 'settings' = 'main';
  private coinText: Phaser.GameObjects.Container | null = null;
  private coinTween: Phaser.Tweens.Tween | null = null;
  private showCredits = false;
  private onlineMenu: OnlineMenu | null = null;
  private netFactory: NetSessionFactoryLike = createNetSessionFactory();

  private readonly startNetBattle = (cfg: NetBattleConfig, session: NetSession): void => {
    this.scene.start('BattleScene', { ...cfg, session });
  };

  private readonly menuX = 150;

  constructor() {
    super('MainMenuScene');
  }

  create(): void {
    if (typeof window !== 'undefined' && window.location.search.includes('nettest=host')) {
      this.scene.start('BattleScene', { mode: 'host' });
      return;
    }
    if (typeof window !== 'undefined' && window.location.search.includes('nettest=guest')) {
      this.scene.start('BattleScene', {
        mode: 'guest',
        roomCode: window.localStorage.getItem('pb-net-room') ?? '',
      });
      return;
    }
    this.selection = 0;
    this.showCredits = false;
    this.audio = new AudioSystem(this);
    this.controls = new ControlsScreen();
    this.onlineMenu = new OnlineMenu({
      host: (cb) => this.netFactory.host(cb),
      join: (code, cb) => this.netFactory.join(code, cb),
    });
    this.rowObjects = [];
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
    boy.setScale(isPngKey(frameKey) ? 1 : 2);
    boy.setFlipX(flip);
    if (this.anims.exists(animKey)) boy.play(animKey);
  }

  private buildTitle(): void {
    // Logo aus dem Original-Sheet (Fallback: PixelText-Titel)
    if (this.textures.exists('menu_logo')) {
      const logo = this.add.image(GAME_WIDTH / 2, 10, 'menu_logo');
      logo.setOrigin(0.5, 0);
      if (this.textures.exists('menu_subtitle')) {
        this.add.image(GAME_WIDTH / 2, 54, 'menu_subtitle').setOrigin(0.5, 0);
      } else {
        createPixelText(this, GAME_WIDTH / 2, 54, '2 PLAYER MAYHEM', { scale: 1, originX: 0.5, color: COLOR_WHITE });
      }
    } else {
      const title = this.add.container(GAME_WIDTH / 2, 14);
      title.add(
        createPixelText(this, 4, 4, 'PIXEL BONKERS', { scale: 4, originX: 0.5, color: COLOR_DARK }),
      );
      title.add(
        createPixelText(this, 0, 0, 'PIXEL BONKERS', { scale: 4, originX: 0.5, color: COLOR_GOLD }),
      );
      createPixelText(this, GAME_WIDTH / 2, 54, '2 PLAYER MAYHEM', {
        scale: 1,
        originX: 0.5,
        color: COLOR_WHITE,
      });
    }

    const pressEnter = createPixelText(this, GAME_WIDTH / 2, 79, 'PRESS ENTER', {
      scale: 1,
      originX: 0.5,
      color: COLOR_WHITE,
    });
    this.pressEnter = pressEnter;
    this.tweens.add({ targets: pressEnter, alpha: 0, duration: 450, yoyo: true, repeat: -1 });
  }

  private mainItems(): MenuItem[] {
    return [
      { label: () => 'VS LOCAL', run: () => this.scene.start('BattleScene') },
      { label: () => 'ONLINE', run: () => this.openOnlineMenu() },
      { label: () => 'SETTINGS', run: () => this.openSettings() },
      { label: () => 'CONTROLS', run: () => this.controls.create(this) },
    ];
  }

  private settingsItems(): MenuItem[] {
    return [
      { label: () => 'SOUND', status: () => settings.sound, run: () => this.toggle('sound') },
      { label: () => 'MUSIC', status: () => settings.music, run: () => this.toggle('music') },
      {
        label: () => 'SCREEN SHAKE',
        status: () => settings.screenShake,
        run: () => this.toggle('screenShake'),
      },
      {
        label: () => 'FULLSCREEN',
        status: () => this.scale.isFullscreen,
        run: () => this.scale.toggleFullscreen(),
      },
      { label: () => 'MELEE', status: () => settings.melee, run: () => this.toggle('melee') },
      { label: () => 'BACK', run: () => this.openMainMenu() },
    ];
  }

  private buildMenu(): void {
    this.items = this.mainItems();
    this.renderItems();
  }

  private openSettings(): void {
    this.menuMode = 'settings';
    this.selection = 0;
    this.items = this.settingsItems();
    this.footerTexts.forEach((t) => t.setVisible(false));
    this.pressEnter?.setVisible(false);
    this.renderItems();
  }

  private openMainMenu(): void {
    this.menuMode = 'main';
    this.selection = 2;
    this.items = this.mainItems();
    this.footerTexts.forEach((t) => t.setVisible(true));
    this.pressEnter?.setVisible(true);
    this.renderItems();
  }

  private buildFooter(): void {
    const km1 = KEYMAP[0];
    const km2 = KEYMAP[1];
    const move1 = km1.up + km1.left + km1.down + km1.right;
    const move2 = km2.up + km2.left + km2.down + km2.right;
    this.footerTexts = [
      createPixelText(this, GAME_WIDTH / 2, 150, `P1: ${move1} ${km1.melee}/${km1.weapon}`, {
        scale: 1,
        originX: 0.5,
        color: COLOR_WHITE,
      }),
      createPixelText(this, GAME_WIDTH / 2, 161, `P2: ${move2} ${km2.melee}/${km2.weapon}`, {
        scale: 1,
        originX: 0.5,
        color: COLOR_WHITE,
      }),
    ];
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
    this.rowObjects.forEach((o) => o.destroy());
    this.rowObjects = [];
    const step = this.menuMode === 'settings' ? 14 : 11;
    const baseY = this.menuMode === 'settings' ? 84 : 88;
    const COLOR_BOX_ON = 0x28d84a;
    const COLOR_BOX_ON_EDGE = 0x1a5c1c;
    const COLOR_BOX_OFF = 0xf84838;
    const COLOR_BOX_OFF_EDGE = 0x8c1c14;

    this.items.forEach((item, i) => {
      const y = baseY + i * step;
      const selected = i === this.selection;
      const label = item.label();
      const labelW = label.length * 6 - 1;
      const on = item.status ? item.status() : null;
      const boxW = on === null ? 0 : on ? 20 : 26;
      const rowW = boxW > 0 ? 106 : labelW;

      if (selected) {
        const hl = this.add
          .rectangle(this.menuX - 3, y - 1, rowW + 7, 10, COLOR_GOLD)
          .setOrigin(0, 0);
        this.rowObjects.push(hl);
      }
      const t = createPixelText(this, this.menuX, y, label, { scale: 1, color: COLOR_WHITE });
      this.rowObjects.push(t);

      if (on !== null) {
        const colRight = this.menuX + 104;
        const bx = colRight - boxW;
        const box = this.add.rectangle(bx + boxW / 2, y + 4, boxW, 10, on ? COLOR_BOX_ON : COLOR_BOX_OFF);
        box.setStrokeStyle(1, on ? COLOR_BOX_ON_EDGE : COLOR_BOX_OFF_EDGE);
        this.rowObjects.push(box);
        const bt = createPixelText(this, bx + (boxW - (on ? 11 : 17)) / 2, y + 1, on ? 'ON' : 'OFF', {
          scale: 1,
          color: 0xffffff,
        });
        this.rowObjects.push(bt);
      }
    });
  }

  private openOnlineMenu(): void {
    this.onlineMenu?.create(this, this.startNetBattle);
  }

  private onUp(): void {
    if (this.controls.isOpen || this.onlineMenu?.isOpen) return;
    this.selection = (this.selection - 1 + this.items.length) % this.items.length;
    this.renderItems();
    this.audio.play('menuSelect');
  }

  private onDown(): void {
    if (this.controls.isOpen || this.onlineMenu?.isOpen) return;
    this.selection = (this.selection + 1) % this.items.length;
    this.renderItems();
    this.audio.play('menuSelect');
  }

  private onConfirm(): void {
    if (this.controls.isOpen || this.onlineMenu?.isOpen) return;
    this.audio.play('menuSelect');
    this.items[this.selection].run();
  }

  private onEscape(): void {
    if (this.controls.isOpen || this.onlineMenu?.isOpen) return;
    if (this.menuMode === 'settings') {
      this.audio.play('menuSelect');
      this.openMainMenu();
      return;
    }
    this.showCredits = !this.showCredits;
    this.renderCoin();
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
    this.onlineMenu?.destroy();
    this.onlineMenu = null;
  }
}
