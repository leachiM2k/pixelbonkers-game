import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../types';
import { createPixelText, PixelTextOptions } from './pixelText';
import { AudioSystem } from '../systems/audio';
import type { NetBattleConfig, NetSession, NetStatus } from '../net/contract';

// NET-UI-Vertrag (MainMenuScene -> OnlineMenu):
// new OnlineMenu(factory: NetSessionFactoryLike) — Factory per Konstruktor injiziert.
// create(scene, startBattle) oeffnet das Overlay, destroy() schliesst es
// (isOpen-Guard fuer den Aufrufer, ESC schliesst jederzeit).
// startBattle(cfg, session) feuert bei 'connected' (BattleScene-Start inkl.
// NetSession-Uebergabe). Factory-Callbacks muessen asynchron feuern.
// Der Status-Callback wird UEBER BEIDE Kanaele registriert (Factory-cb und
// session.onStatus); Duplikate sind idempotent.

export interface NetSessionFactoryLike {
  host(cb: (s: NetStatus) => void): NetSession;
  join(code: string, cb: (s: NetStatus) => void): NetSession;
}

export type StartNetBattleFn = (cfg: NetBattleConfig, session: NetSession) => void;

const COLOR_WHITE = 0xf2f0e5;
const COLOR_GOLD = 0xf8d848;
const COLOR_DARK = 0x1a1c2c;
const COLOR_RED = 0xe04848;
const OVERLAY_DEPTH = 300;
const ROOM_CODE_LEN = 4;
const OPTION_LABELS = ['HOST GAME', 'JOIN GAME', 'BACK'];
const OPT_X = 150;
const OPT_Y = 64;
const OPT_STEP = 12;
const SLOT_XS = [162, 182, 202, 222];

type MenuView = 'options' | 'hostWait' | 'joinInput' | 'joinWait';

export class OnlineMenu {
  isOpen = false;
  private readonly factory: NetSessionFactoryLike;
  private scene: Phaser.Scene | null = null;
  private audio: AudioSystem | null = null;
  private root: Phaser.GameObjects.Container | null = null;
  private content: Phaser.GameObjects.Container | null = null;
  private tweens: Phaser.Tweens.Tween[] = [];
  private handlers: Array<{ event: string; fn: (e: KeyboardEvent) => void }> = [];
  private startBattle: StartNetBattleFn | null = null;
  private view: MenuView = 'options';
  private selection = 0;
  private codeInput = '';
  private errorMessage = '';
  private lastStatus: NetStatus | null = null;
  private session: NetSession | null = null;
  private battleStarted = false;

  constructor(factory: NetSessionFactoryLike) {
    this.factory = factory;
  }

  create(scene: Phaser.Scene, startBattle: StartNetBattleFn): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.scene = scene;
    this.audio = new AudioSystem(scene);
    this.startBattle = startBattle;
    this.battleStarted = false;
    this.view = 'options';
    this.selection = 0;
    this.codeInput = '';
    this.errorMessage = '';
    this.lastStatus = null;
    this.session = null;

    this.root = scene.add.container(0, 0);
    this.root.setDepth(OVERLAY_DEPTH);
    const bg = scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      COLOR_DARK,
      0.88,
    );
    this.root.add(bg);
    this.root.add(
      createPixelText(scene, GAME_WIDTH / 2, 14, 'ONLINE', {
        scale: 2,
        originX: 0.5,
        color: COLOR_GOLD,
      }),
    );
    this.content = scene.add.container(0, 0);
    this.root.add(this.content);
    this.renderOptions();

    const kb = scene.input.keyboard;
    if (kb) {
      const register = (event: string, fn: (e: KeyboardEvent) => void): void => {
        kb.on(event, fn);
        this.handlers.push({ event, fn });
      };
      register('keydown-W', () => this.nav(-1));
      register('keydown-UP', () => this.nav(-1));
      register('keydown-S', () => this.nav(1));
      register('keydown-DOWN', () => this.nav(1));
      register('keydown-ENTER', () => this.confirm());
      register('keydown-ESC', () => this.escape());
      register('keydown', (e: KeyboardEvent) => this.typeKey(e));
    }
  }

  destroy(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    const kb = this.scene?.input.keyboard;
    for (const h of this.handlers) kb?.off(h.event, h.fn);
    this.handlers = [];
    this.session?.close();
    this.session = null;
    for (const t of this.tweens) t.remove();
    this.tweens = [];
    this.root?.destroy();
    this.root = null;
    this.content = null;
    this.audio = null;
    this.scene = null;
    this.startBattle = null;
  }

  private nav(dir: number): void {
    if (!this.isOpen || this.battleStarted || this.view !== 'options') return;
    const n = OPTION_LABELS.length;
    this.selection = (this.selection + dir + n) % n;
    this.audio?.play('menuSelect');
    this.renderOptions();
  }

  private confirm(): void {
    if (!this.isOpen || this.battleStarted) return;
    if (this.view === 'options') {
      this.audio?.play('menuSelect');
      if (this.selection === 0) this.startHost();
      else if (this.selection === 1) this.openJoinInput();
      else this.destroy();
      return;
    }
    if (this.view === 'joinInput' && this.codeInput.length >= ROOM_CODE_LEN) {
      this.audio?.play('menuSelect');
      this.startJoin();
    }
  }

  private escape(): void {
    if (!this.isOpen || this.battleStarted) return;
    this.audio?.play('menuSelect');
    if (this.view === 'options') {
      this.destroy();
      return;
    }
    const session = this.session;
    this.session = null;
    this.view = 'options';
    this.renderOptions();
    session?.close();
  }

  private typeKey(e: KeyboardEvent): void {
    if (!this.isOpen || this.battleStarted || this.view !== 'joinInput') return;
    if (e.key === 'Backspace') {
      if (this.codeInput.length > 0) {
        this.codeInput = this.codeInput.slice(0, -1);
        this.audio?.play('menuSelect');
        this.renderJoinInput();
      }
      return;
    }
    if (this.codeInput.length >= ROOM_CODE_LEN) return;
    if (/^[a-zA-Z0-9]$/.test(e.key)) {
      this.codeInput += e.key.toUpperCase();
      this.audio?.play('menuSelect');
      this.renderJoinInput();
    }
  }

  private openJoinInput(): void {
    this.errorMessage = '';
    this.codeInput = '';
    this.view = 'joinInput';
    this.renderJoinInput();
  }

  private startHost(): void {
    this.beginSession((cb) => this.factory.host(cb), 'hostWait');
  }

  private startJoin(): void {
    this.beginSession((cb) => this.factory.join(this.codeInput, cb), 'joinWait');
  }

  private beginSession(make: (cb: (s: NetStatus) => void) => NetSession, view: MenuView): void {
    this.session?.close();
    this.session = null;
    this.lastStatus = null;
    this.errorMessage = '';
    this.view = view;
    this.renderView();
    try {
      const session = make((s) => this.onNetStatus(s));
      this.session = session;
      session.onStatus((s) => this.onNetStatus(s));
    } catch (err) {
      this.session = null;
      this.errorMessage = `FEHLER: ${err instanceof Error ? err.message : 'SESSION-START'}`;
      this.view = 'options';
      this.renderOptions();
    }
  }

  private onNetStatus(s: NetStatus): void {
    if (!this.isOpen || this.battleStarted) return;
    if (s.state === 'connected') {
      const session = this.session;
      if (!session) return;
      this.session = null;
      this.battleStarted = true;
      this.audio?.play('menuSelect');
      const roomCode =
        s.roomCode ?? (this.view === 'joinWait' && this.codeInput ? this.codeInput : undefined);
      this.startBattle?.({ mode: session.role, roomCode }, session);
      return;
    }
    if (s.state === 'error' || s.state === 'closed') {
      if (this.view === 'options') return;
      this.session?.close();
      this.session = null;
      this.errorMessage =
        s.state === 'closed' && !s.message
          ? 'FEHLER: VERBINDUNG GESCHLOSSEN'
          : `FEHLER: ${s.message ?? 'UNBEKANNT'}`;
      this.view = 'options';
      this.renderOptions();
      return;
    }
    this.lastStatus = s;
    this.renderView();
  }

  private renderView(): void {
    if (this.view === 'options') this.renderOptions();
    else if (this.view === 'hostWait') this.renderHostWait();
    else if (this.view === 'joinInput') this.renderJoinInput();
    else this.renderJoinWait();
  }

  private clearContent(): void {
    for (const t of this.tweens) t.remove();
    this.tweens = [];
    this.content?.destroy();
    const sc = this.scene;
    if (!sc || !this.root) return;
    this.content = sc.add.container(0, 0);
    this.root.add(this.content);
  }

  private addText(
    x: number,
    y: number,
    text: string,
    opts: PixelTextOptions,
  ): Phaser.GameObjects.Container {
    const sc = this.scene as Phaser.Scene;
    const t = createPixelText(sc, x, y, text, opts);
    this.content?.add(t);
    return t;
  }

  private blink(t: Phaser.GameObjects.Container): void {
    const sc = this.scene;
    if (!sc) return;
    this.tweens.push(
      sc.tweens.add({ targets: t, alpha: 0, duration: 450, yoyo: true, repeat: -1 }),
    );
  }

  private tintText(c: Phaser.GameObjects.Container | null, color: number): void {
    if (!c) return;
    for (const child of c.list) {
      if (child instanceof Phaser.GameObjects.Image) child.setTint(color);
    }
  }

  private renderOptions(): void {
    this.clearContent();
    OPTION_LABELS.forEach((label, i) => {
      const t = this.addText(OPT_X, OPT_Y + i * OPT_STEP, label, { scale: 1, color: COLOR_WHITE });
      if (i === this.selection) this.tintText(t, COLOR_GOLD);
    });
    const sc = this.scene;
    if (sc) {
      const cursor = sc.add.image(OPT_X - 6, OPT_Y + this.selection * OPT_STEP + 1, 'font_>');
      cursor.setOrigin(0, 0);
      this.content?.add(cursor);
    }
    if (this.errorMessage) {
      this.addText(GAME_WIDTH / 2, 112, this.errorMessage, {
        scale: 1,
        originX: 0.5,
        color: COLOR_RED,
      });
    }
    this.blink(
      this.addText(GAME_WIDTH / 2, GAME_HEIGHT - 16, 'ESC: BACK', {
        scale: 1,
        originX: 0.5,
        color: COLOR_GOLD,
      }),
    );
  }

  private renderHostWait(): void {
    this.clearContent();
    const room = this.lastStatus?.roomCode;
    if (room) {
      this.addText(GAME_WIDTH / 2, 72, `ROOM: ${room}`, {
        scale: 3,
        originX: 0.5,
        color: COLOR_GOLD,
      });
      this.blink(
        this.addText(GAME_WIDTH / 2, 102, 'WARTET AUF P2...', {
          scale: 1,
          originX: 0.5,
          color: COLOR_WHITE,
        }),
      );
    } else {
      this.blink(
        this.addText(GAME_WIDTH / 2, 72, this.lastStatus?.message ?? 'VERBINDE...', {
          scale: 2,
          originX: 0.5,
          color: COLOR_WHITE,
        }),
      );
    }
    this.blink(
      this.addText(GAME_WIDTH / 2, GAME_HEIGHT - 16, 'ESC: ABBRECHEN', {
        scale: 1,
        originX: 0.5,
        color: COLOR_GOLD,
      }),
    );
  }

  private renderJoinInput(): void {
    this.clearContent();
    this.addText(GAME_WIDTH / 2, 54, 'CODE:', { scale: 1, originX: 0.5, color: COLOR_WHITE });
    for (let i = 0; i < ROOM_CODE_LEN; i++) {
      const active = i === this.codeInput.length;
      const ch = this.codeInput[i] ?? '-';
      const slot = this.addText(SLOT_XS[i], 76, ch, {
        scale: 3,
        originX: 0.5,
        color: active ? COLOR_GOLD : COLOR_WHITE,
      });
      if (active) this.blink(slot);
    }
    this.blink(
      this.addText(GAME_WIDTH / 2, GAME_HEIGHT - 16, 'ENTER: OK  ESC: BACK', {
        scale: 1,
        originX: 0.5,
        color: COLOR_GOLD,
      }),
    );
  }

  private renderJoinWait(): void {
    this.clearContent();
    this.addText(GAME_WIDTH / 2, 72, `CODE: ${this.codeInput}`, {
      scale: 2,
      originX: 0.5,
      color: COLOR_GOLD,
    });
    this.blink(
      this.addText(GAME_WIDTH / 2, 102, this.lastStatus?.message ?? 'VERBINDE...', {
        scale: 1,
        originX: 0.5,
        color: COLOR_WHITE,
      }),
    );
    this.blink(
      this.addText(GAME_WIDTH / 2, GAME_HEIGHT - 16, 'ESC: ABBRECHEN', {
        scale: 1,
        originX: 0.5,
        color: COLOR_GOLD,
      }),
    );
  }
}
