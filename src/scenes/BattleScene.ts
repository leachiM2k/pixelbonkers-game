// CONTRACT (COMBAT): BattleScene orchestriert Arena, Spieler, Countdown, 60s-Timer,
// KO-Sequenz, Pause (PauseMenu), Debug (F10), Rematch (ENTER) / Hauptmenue (ESC).
import Phaser from 'phaser';
import { EV, GAME_HEIGHT, GAME_WIDTH } from '../types';
import { Player, safePlayAnim } from '../entities/Player';
import { InputSystem, PlayerInput } from '../systems/input';
import { CpuAi } from '../systems/cpuAi';
import { PowerUpSystem } from '../systems/powerups';
import { FxSystem } from '../systems/fx';
import { AudioSystem } from '../systems/audio';
import { MusicSystem } from '../systems/music';
import { CombatSystem } from '../systems/combat';
import { WeaponSystem } from '../systems/weapons';
import { Hud } from '../ui/hud';
import { PauseMenu } from '../ui/PauseMenu';
import { NetBattleConfig, NetSession, NetStatus } from '../net/contract';
import { NetSession as NetSessionImpl } from '../net/session';
import { encodeSnapshot, NetAnim, NetSnapshot } from '../net/snapshot';
import { GuestView } from '../net/guestView';
import { createPixelText } from '../ui/pixelText';
import { PLAYER_MAX_HP } from '../entities/Player';
import { isPngKey } from '../sprites/manifest';
import { SHEET_SCALE } from '../sprites/sheetScale';
import { ArenaLayout, arenaForRound } from '../game/arenas';

const GROUND_TOP = 188;
const ROUND_MS = 60000;
const COUNTDOWN_STEP_MS = 800;
const PAL_GRASS_HIDDEN = 0x48a838;
const PAL_WOOD = 0x8a5a30;
const PAL_WOOD_LIGHT = 0xc89858;
const PAL_WOOD_DARK = 0x5a3820;

type Phase = 'countdown' | 'fight' | 'ko' | 'result';

const EMPTY_INPUT: PlayerInput = {
  left: false, right: false, up: false, down: false,
  melee: false, weapon: false, special: false,
  meleePressed: false, weaponPressed: false, specialPressed: false,
};

export class BattleScene extends Phaser.Scene {
  private phase: Phase = 'countdown';
  private paused = false;
  private players!: [Player, Player];
  private inputSystem!: InputSystem;
  private cpuAi: CpuAi | null = null;
  private powerups!: PowerUpSystem;
  private fx!: FxSystem;
  private audioS!: AudioSystem;
  private music!: MusicSystem;
  private hud!: Hud;
  private combat!: CombatSystem;
  private weapons!: WeaponSystem;
  private pauseMenu!: PauseMenu;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private arenaIndex = 0;
  private arena: ArenaLayout = arenaForRound(0);
  private timeLeft = ROUND_MS;
  private lastTimerShown = 60;
  private debugEnabled = false;
  private debugG!: Phaser.GameObjects.Graphics;
  private debugText!: Phaser.GameObjects.Text;
  private netCfg: NetBattleConfig = { mode: 'local' };
  private netSession: NetSession | null = null;
  private remoteInput: PlayerInput | null = null;
  private guestView: GuestView | null = null;
  private netKeepSession = false;
  private netWired = false;
  private netCenterText = '';
  private netWinnerIdx: 0 | 1 | -1 | null = null;
  private netSeq = 0;
  private netLastSendAt = 0;
  private netRecvSnap = 0;
  private netRecvInput = 0;

  constructor() {
    super('BattleScene');
  }

  init(data: Partial<NetBattleConfig> & { arenaIndex?: number }): void {
    this.netCfg = { mode: data?.mode ?? 'local', roomCode: data?.roomCode };
    // ?arena=N erzwingt das Layout nur beim ersten Start; ein Runden-Restart
    // uebergibt arenaIndex in den Daten und hat Vorrang (Rotation).
    const q = typeof window !== 'undefined' ? window.location.search : '';
    const forced = q.match(/arena=(\d+)/);
    this.arenaIndex = data?.arenaIndex ?? (forced ? Number(forced[1]) : 0);
    if (!this.netKeepSession) {
      this.netSession = (data as { session?: NetSession } | undefined)?.session ?? null;
      this.netWired = false;
      this.remoteInput = null;
    }
  }

  attachNetSession(session: NetSession): void {
    if (this.netWired && this.netSession === session) return;
    this.netSession = session;
    this.netWired = true;
    session.onInput((inp) => {
      this.netRecvInput++;
      if (!this.remoteInput) {
        this.remoteInput = { ...inp };
        return;
      }
      const prev = this.remoteInput;
      this.remoteInput = {
        ...inp,
        meleePressed: prev.meleePressed || inp.meleePressed,
        weaponPressed: prev.weaponPressed || inp.weaponPressed,
        specialPressed: prev.specialPressed || inp.specialPressed,
      };
    });
    session.onSnapshot((snap) => {
      this.netRecvSnap++;
      if (this.netCfg.mode === 'guest') this.guestView?.receive(snap);
    });
    session.onStatus((s) => this.onNetStatus(s));
  }

  private onNetStatus(s: NetStatus): void {
    const dbg = (window as unknown as { __PB_NET?: Record<string, unknown> }).__PB_NET;
    if (dbg) {
      dbg.state = s.state;
      dbg.roomCode = s.roomCode;
    }
    if ((s.state === 'error' || s.state === 'closed') && (this.phase === 'fight' || this.phase === 'countdown')) {
      this.hud.showCenterText('CONNECTION LOST', 0xe04848);
    }
  }

  private getInputFor(idx: 0 | 1): PlayerInput {
    if (this.netCfg.mode === 'cpu' && idx === 1) return this.cpuAi ? this.cpuAi.getInput() : EMPTY_INPUT;
    if (this.netCfg.mode === 'host' && idx === 1) return this.remoteInput ?? EMPTY_INPUT;
    if (this.netCfg.mode === 'guest') return EMPTY_INPUT;
    return this.inputSystem.get(idx);
  }

  create(): void {
    this.cameras.main.setZoom(2).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.phase = 'countdown';
    this.paused = false;
    this.netKeepSession = false;
    this.netCenterText = '';
    this.netWinnerIdx = null;
    this.guestView = null;
    this.netRecvSnap = 0;
    this.netRecvInput = 0;
    this.timeLeft = ROUND_MS;
    this.lastTimerShown = 60;
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.arena = arenaForRound(this.arenaIndex);
    this.buildArena();
    this.players = [
      new Player(this, this.arena.spawns[0], GROUND_TOP, 0),
      new Player(this, this.arena.spawns[1], GROUND_TOP, 1),
    ];
    for (const p of this.players) p.setDepth(10);
    this.inputSystem = new InputSystem(this);
    this.fx = new FxSystem(this);
    this.audioS = new AudioSystem(this);
    this.music = new MusicSystem(this);
    this.hud = new Hud(this);
    this.combat = new CombatSystem(this, this.players, this.fx, this.audioS, this.hud);
    this.weapons = new WeaponSystem(this, this.players, this.platforms, this.fx, this.audioS, this.hud, this.combat);
    this.combat.setWeaponDrop((p) => this.weapons.dropWeapon(p));
    this.powerups = new PowerUpSystem(this, this.players, this.platforms, this.fx, this.audioS, this.hud);
    if (this.netCfg.mode === 'cpu') {
      this.cpuAi = new CpuAi(this.players[1], this.players[0], {
        groundWeapons: () => this.weapons.groundWeapons,
        projectiles: () => this.weapons.activeProjectiles,
        traps: () => this.weapons.activeTraps,
        now: () => this.time.now,
      });
    }
    this.physics.add.collider(this.players[0], this.platforms);
    this.physics.add.collider(this.players[1], this.platforms);
    this.hud.updateHp(0, this.players[0].hp);
    this.hud.updateHp(1, this.players[1].hp);
    this.hud.updateTimer(60);
    this.pauseMenu = new PauseMenu(this, {
      resume: () => this.resumeGame(),
      restart: () => {
        this.pauseMenu.close();
        this.paused = false;
        this.music.stop();
        this.restartRound();
      },
      mainMenu: () => {
        this.pauseMenu.close();
        this.paused = false;
        this.music.stop();
        this.leaveToMenu();
      },
    });
    this.debugG = this.add.graphics().setDepth(950).setVisible(false);
    this.debugText = this.add
      .text(3, 3, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.55)',
      })
      .setResolution(3)
      .setDepth(951)
      .setVisible(false);
    const kb = this.input.keyboard;
    if (kb) {
      kb.addCapture('F10');
      kb.on('keydown-ESC', () => this.onEsc());
      kb.on('keydown-ENTER', () => {
        if (this.phase === 'result' && !this.paused) {
          if (this.netCfg.mode === 'guest') return;
          this.restartRound();
        }
      });
      kb.on('keydown-F10', () => this.toggleDebug());
    }
    const koHandler = (idx: 0 | 1) => this.onPlayerKO(idx);
    this.events.on(EV.PLAYER_KO, koHandler);
    this.events.once('shutdown', () => {
      this.events.off(EV.PLAYER_KO, koHandler);
      this.music.stop();
      if (!this.netKeepSession) {
        this.netSession?.close();
        this.netSession = null;
      }
    });
    this.setupNet();
    // Dev/Test-Probe: Live-State fuer E2E-Tests (read-only)
    (window as unknown as Record<string, unknown>).__PB_STATE = () => ({
      phase: this.phase,
      arena: this.arena.name,
      cpu: this.netCfg.mode === 'cpu',
      p: this.players.map((pl) => ({
        x: Math.round(pl.x),
        hp: pl.hp,
        dead: pl.isDead,
        held: pl.heldWeapon,
        spd: this.time.now < pl.speedBoostUntil,
        shd: this.time.now < pl.shieldUntil,
      })),
    });
    // Dev/Test-Probe: Waffen-System fuer deterministische E2E-Tests
    (window as unknown as Record<string, unknown>).__PB_WS = () => ({
      ws: this.weapons,
      players: this.players,
      cpu: this.cpuAi ? this.cpuAi.debug : null,
      pu: this.powerups ? this.powerups.debug : [],
      busy: this.players.map((p) => ({
        c: this.combat.isBusy(p),
        w: this.weapons.isBusy(p),
      })),
    });
    if (this.netCfg.mode === 'guest') {
      this.hud.showCenterText('WAITING FOR HOST...', 0xf2f0e5);
      const hint = createPixelText(this, GAME_WIDTH / 2, GAME_HEIGHT - 8, 'GUEST: ESC = LEAVE', {
        scale: 1,
        originX: 0.5,
        color: 0xf2f0e5,
      });
      hint.setDepth(50).setAlpha(0.55);
    } else {
      this.startCountdown();
    }
  }

  update(_time: number, delta: number): void {
    this.inputSystem.update();
    if (this.netCfg.mode === 'host') {
      this.netSendSnapshot();
      this.netDebugUpdate();
    }
    if (this.paused) return;
    if (this.netCfg.mode === 'guest') {
      this.netSession?.sendInput(this.guestLocalInput());
      this.fx.update(delta);
      this.netTick(delta);
      this.netDebugUpdate();
      if (this.debugEnabled) this.drawDebug();
      return;
    }
    if (this.phase === 'fight') {
      this.cpuAi?.update(delta);
      for (const p of this.players) {
        const inp = this.getInputFor(p.idx);
        if (this.combat.isBusy(p) || this.weapons.isBusy(p)) continue;
        p.update(inp);
        if (inp.meleePressed) this.combat.tryMelee(p);
        if (inp.weaponPressed) {
          if (p.heldWeapon) this.weapons.throwWeapon(p);
          else this.weapons.tryPickup(p);
        }
      }
      this.separatePlayers();
      this.combat.update();
      this.weapons.update(delta);
      this.powerups.update(delta);
      this.fx.update(delta);
      this.tickTimer(delta);
    } else if (this.phase === 'countdown') {
      for (const p of this.players) p.update(EMPTY_INPUT);
      this.fx.update(delta);
    } else {
      for (const p of this.players) if (p.isDead) p.update(EMPTY_INPUT);
      this.fx.update(delta);
    }
    if (this.netCfg.mode === 'host' && this.remoteInput) {
      this.remoteInput.meleePressed = false;
      this.remoteInput.weaponPressed = false;
      this.remoteInput.specialPressed = false;
    }
    if (this.debugEnabled) this.drawDebug();
  }

  protected netTick(_delta: number): void {
    this.guestView?.update();
  }

  private buildArena(): void {
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'arena_sky')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.platforms = this.physics.add.staticGroup();
    this.addStaticRect(GAME_WIDTH / 2, GROUND_TOP + 14, GAME_WIDTH, 28, PAL_GRASS_HIDDEN, 1, false);
    for (const p of this.arena.platforms) this.addPlatform(p.cx, p.topY, p.w);
    if (this.arena.house) this.deco(this.arena.house.cx, this.arena.house.topY, 'arena_house', 1);
    this.addCloud(56, 20, 'arena_cloud_0', 9000);
    this.addCloud(190, 34, 'arena_cloud_1', 12000);
    this.addCloud(320, 16, 'arena_cloud_2', 15000);
    this.addBird(30, 16000, false, 0);
    this.addBird(46, 21000, true, 2000);
    for (const prop of this.arena.props) this.deco(prop.x, GROUND_TOP, prop.key);
    this.scheduleLeaf();
  }

  private addStaticRect(
    cx: number,
    cy: number,
    w: number,
    h: number,
    color: number,
    depth: number,
    visible = true,
  ): Phaser.GameObjects.Rectangle {
    const r = this.add.rectangle(cx, cy, w, h, color).setDepth(depth).setVisible(visible);
    this.physics.add.existing(r, true);
    this.platforms.add(r);
    return r;
  }

  private addPlatform(cx: number, topY: number, w: number): void {
    // Kollisions-Body (unsichtbar) + Plattform-Textur aus dem Asset
    this.addStaticRect(cx, topY + 3, w, 6, 0x000000, 4, false);
    const h = Math.max(8, Math.round((w * 28) / 164));
    if (this.textures.exists('arena_platform')) {
      this.add.image(cx, topY, 'arena_platform').setOrigin(0.5, 0).setDisplaySize(w, h).setDepth(4);
    } else {
      this.addStaticRect(cx, topY + 3, w, 6, PAL_WOOD, 4);
      this.add.rectangle(cx, topY + 1, w, 2, PAL_WOOD_LIGHT).setDepth(5);
      this.add.rectangle(cx, topY + 6.5, w, 1, PAL_WOOD_DARK).setDepth(5);
    }
  }

  private deco(x: number, y: number, key: string, depth = 3): void {
    this.add.image(x, y, key).setOrigin(0.5, 1).setScale(isPngKey(key) ? SHEET_SCALE : 2).setDepth(depth);
  }

  private addCloud(x: number, y: number, key: string, duration: number): void {
    const cloud = this.add.image(x, y, key).setScale(2).setDepth(2);
    this.tweens.add({
      targets: cloud,
      x: x + 26,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private addBird(y: number, duration: number, startRight: boolean, delay: number): void {
    const bird = this.add
      .image(startRight ? -10 : GAME_WIDTH + 10, y, 'arena_bird_0')
      .setScale(2)
      .setDepth(2);
    this.tweens.add({
      targets: bird,
      x: startRight ? GAME_WIDTH + 10 : -10,
      duration,
      repeat: -1,
      delay,
    });
    this.tweens.add({
      targets: bird,
      y: y - 6,
      duration: 700 + Math.random() * 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.time.addEvent({
      delay: 240,
      loop: true,
      callback: () => {
        bird.setTexture(bird.texture.key === 'arena_bird_0' ? 'arena_bird_1' : 'arena_bird_0');
      },
    });
  }

  private scheduleLeaf(): void {
    this.time.delayedCall(900 + Math.random() * 1800, () => {
      const leaf = this.add
        .image(Math.random() * GAME_WIDTH, -4, 'arena_leaf')
        .setScale(2)
        .setDepth(2);
      this.tweens.add({
        targets: leaf,
        y: GROUND_TOP - 2,
        x: leaf.x + (Math.random() * 40 - 20),
        angle: 180,
        duration: 4500 + Math.random() * 2500,
        onComplete: () => leaf.destroy(),
      });
      this.scheduleLeaf();
    });
  }

  private startCountdown(): void {
    this.audioS.play('countdown');
    this.setCenterText('3');
    this.time.delayedCall(COUNTDOWN_STEP_MS, () => {
      this.audioS.play('countdown');
      this.setCenterText('2');
    });
    this.time.delayedCall(COUNTDOWN_STEP_MS * 2, () => {
      this.audioS.play('countdown');
      this.setCenterText('1');
    });
    this.time.delayedCall(COUNTDOWN_STEP_MS * 3, () => {
      this.audioS.play('fight');
      this.setCenterText('FIGHT!', 0xe04848);
      this.fx.screenShake(4);
      this.music.start();
      this.phase = 'fight';
      this.weapons.spawnInitialWeapon();
      this.time.delayedCall(650, () => {
        if (this.phase === 'fight') this.clearCenterText();
      });
    });
  }

  private tickTimer(delta: number): void {
    this.timeLeft -= delta;
    const sec = Math.max(0, Math.ceil(this.timeLeft / 1000));
    if (sec !== this.lastTimerShown) {
      this.lastTimerShown = sec;
      this.hud.updateTimer(sec);
    }
    if (this.timeLeft <= 0) this.onTimeUp();
  }

  private onTimeUp(): void {
    if (this.phase !== 'fight') return;
    this.phase = 'ko';
    const p1hp = this.players[0].hp;
    const p2hp = this.players[1].hp;
    const winner: 0 | 1 | -1 = p1hp === p2hp ? -1 : p1hp > p2hp ? 0 : 1;
    this.setCenterText('TIME!', 0xf8d848);
    this.audioS.play('countdown');
    if (winner !== -1) {
      const w = this.players[winner];
      w.setVelocity(0, -120);
      safePlayAnim(w, this.prefix(winner) + '_victory', this.prefix(winner) + '_victory');
    }
    this.time.delayedCall(1400, () => {
      this.audioS.play('victory');
      this.finishRound(winner);
    });
  }

  private onPlayerKO(loserIdx: 0 | 1): void {
    if (this.phase !== 'fight') return;
    this.phase = 'ko';
    const winnerIdx = (1 - loserIdx) as 0 | 1;
    const loser = this.players[loserIdx];
    const winner = this.players[winnerIdx];
    this.setCenterText('K.O.!', 0xe04848);
    this.fx.koStars(loser.x, loser.y - 52);
    this.fx.screenShake(12);
    this.fx.hitstop(120);
    winner.setVelocity(0, -120);
    safePlayAnim(winner, this.prefix(winnerIdx) + '_victory', this.prefix(winnerIdx) + '_victory');
    this.time.delayedCall(700, () => this.audioS.play('victory'));
    this.time.delayedCall(1600, () => this.finishRound(winnerIdx));
  }

  private finishRound(winnerIdx: 0 | 1 | -1): void {
    this.phase = 'result';
    this.netWinnerIdx = winnerIdx;
    this.music.stop();
    this.clearCenterText();
    this.hud.roundResult(winnerIdx);
  }

  private separatePlayers(): void {
    const a = this.players[0].arcadeBody;
    const b = this.players[1].arcadeBody;
    if (!Phaser.Geom.Intersects.RectangleToRectangle(
      new Phaser.Geom.Rectangle(a.x, a.y, a.width, a.height),
      new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height),
    )) {
      return;
    }
    const dir = this.players[0].x <= this.players[1].x ? 1 : -1;
    this.players[0].x -= 0.6 * dir;
    this.players[1].x += 0.6 * dir;
  }

  private onEsc(): void {
    if (this.netCfg.mode === 'guest') {
      this.music.stop();
      this.leaveToMenu();
      return;
    }
    if (this.paused) {
      this.resumeGame();
      return;
    }
    if (this.phase === 'result') {
      this.music.stop();
      this.leaveToMenu();
      return;
    }
    if (this.phase === 'fight') this.pauseGame();
  }

  private leaveToMenu(): void {
    this.netKeepSession = false;
    this.netSession?.close();
    this.netSession = null;
    this.scene.start('MainMenuScene');
  }

  private restartRound(): void {
    if (this.netCfg.mode === 'host') this.netKeepSession = true;
    const rotates = this.netCfg.mode === 'local' || this.netCfg.mode === 'cpu';
    this.scene.restart({
      mode: this.netCfg.mode,
      arenaIndex: rotates ? this.arenaIndex + 1 : this.arenaIndex,
    });
  }

  private setupNet(): void {
    if (this.netCfg.mode === 'guest') {
      this.guestView = new GuestView(this, this.players, this.hud, this.fx, this.audioS, this.music);
      for (const p of this.players) {
        p.setAcceleration(0, 0);
        p.arcadeBody.moves = false;
        p.arcadeBody.enable = false;
      }
    }
    if (this.netCfg.mode !== 'local' && this.netSession && !this.netWired) {
      this.attachNetSession(this.netSession);
    }
    const nettest = typeof window !== 'undefined' && window.location.search.includes('nettest=');
    if (!nettest) return;
    (window as unknown as { __PB_NET: Record<string, unknown> }).__PB_NET = {
      role: this.netCfg.mode,
      state: 'idle',
      roomCode: undefined,
      sent: 0,
      recv: this.netRecvSnap,
      recvInput: 0,
      sentInput: 0,
      phase: this.phase,
      paused: false,
      p1: { x: 0, y: 0 },
      p2: { x: 0, y: 0 },
      hp: [PLAYER_MAX_HP, PLAYER_MAX_HP],
    };
    if (this.netCfg.mode !== 'local' && this.netCfg.mode !== 'cpu' && !this.netSession) {
      this.attachNetSession(new NetSessionImpl(this.netCfg.mode, this.netCfg.roomCode));
    }
  }

  private netSendSnapshot(): void {
    if (!this.netSession || this.netCfg.mode !== 'host') return;
    const now = this.time.now;
    if (now - this.netLastSendAt < 45) return;
    this.netLastSendAt = now;
    this.netSeq = (this.netSeq + 1) & 0xff;
    const snap: NetSnapshot = {
      seq: this.netSeq,
      players: [
        this.netPlayerState(0),
        this.netPlayerState(1),
      ],
      weapons: this.weapons.groundWeapons.map((w) => ({ id: w.weaponId, x: w.x, y: w.y, ageMs: w.age })),
      projectiles: this.weapons.activeProjectiles.map((pr) => ({
        id: pr.def.id,
        x: pr.x,
        y: pr.y,
        angle: pr.angle,
      })),
      traps: this.weapons.activeTraps.map((t) => ({ x: t.x, y: t.y, angle: t.angle })),
      timeLeftMs: Math.max(0, this.timeLeft),
      phase: this.phase,
      paused: this.paused,
      winner: this.phase === 'result' ? this.netWinnerIdx : null,
      center: this.netCenterText,
    };
    this.netSession.sendSnapshot(encodeSnapshot(snap));
  }

  private netPlayerState(idx: 0 | 1): NetSnapshot['players'][0] {
    const p = this.players[idx];
    const b = p.arcadeBody;
    return {
      x: p.x,
      y: p.y,
      vx: b.velocity.x,
      vy: b.velocity.y,
      facing: p.facing,
      hp: p.hp,
      anim: this.netAnimOf(p),
      heldWeapon: p.heldWeapon,
      dead: p.isDead,
    };
  }

  private netAnimOf(p: Player): NetAnim {
    if (p.isDead) return 'ko';
    const keys = `${p.anims.currentAnim?.key ?? ''} ${p.texture.key}`;
    if (keys.includes('attack')) return 'attack';
    if (keys.includes('throw')) return 'throw';
    if (keys.includes('hit')) return 'hit';
    if (keys.includes('victory')) return 'victory';
    if (keys.includes('duck')) return 'duck';
    if (keys.includes('jump')) return 'jump';
    if (keys.includes('fall')) return 'fall';
    if (keys.includes('walk') || keys.includes('run')) return 'walk';
    return 'idle';
  }

  private guestLocalInput(): PlayerInput {
    const a = this.inputSystem.get(0);
    const b = this.inputSystem.get(1);
    return {
      left: a.left || b.left,
      right: a.right || b.right,
      up: a.up || b.up,
      down: a.down || b.down,
      melee: a.melee || b.melee,
      weapon: a.weapon || b.weapon,
      special: a.special || b.special,
      meleePressed: a.meleePressed || b.meleePressed,
      weaponPressed: a.weaponPressed || b.weaponPressed,
      specialPressed: a.specialPressed || b.specialPressed,
    };
  }

  private netDebugUpdate(): void {
    const dbg = (window as unknown as { __PB_NET?: Record<string, unknown> }).__PB_NET;
    if (!dbg) return;
    const [p1, p2] = this.players;
    const sess = this.netSession as unknown as { sentSnapshots?: number; sentInputs?: number } | null;
    dbg.phase = this.guestView?.currentPhase ?? this.phase;
    dbg.paused = (this.guestView?.currentPaused ?? false) || this.paused;
    dbg.p1 = { x: Math.round(p1.x), y: Math.round(p1.y) };
    dbg.p2 = { x: Math.round(p2.x), y: Math.round(p2.y) };
    dbg.hp = [p1.hp, p2.hp];
    dbg.sent = sess?.sentSnapshots ?? 0;
    dbg.sentInput = sess?.sentInputs ?? 0;
    dbg.recv = this.netRecvSnap;
    dbg.recvInput = this.netRecvInput;
    dbg.fps = Math.round(this.game.loop.actualFps);
  }

  private pauseGame(): void {
    if (this.paused) return;
    this.paused = true;
    this.physics.world.pause();
    this.pauseMenu.open();
    this.audioS.play('menuSelect');
    this.events.emit(EV.PAUSE_TOGGLED, true);
  }

  private resumeGame(): void {
    if (!this.paused) return;
    this.paused = false;
    this.physics.world.resume();
    this.pauseMenu.close();
    this.audioS.play('menuSelect');
    this.events.emit(EV.PAUSE_TOGGLED, false);
  }

  private setCenterText(text: string, color = 0xf8d848): void {
    this.netCenterText = text;
    this.hud.showCenterText(text, color);
  }

  private clearCenterText(): void {
    this.netCenterText = '';
    this.hud.clearCenterText();
  }

  private prefix(idx: 0 | 1): string {
    return idx === 0 ? 'boy1' : 'boy2';
  }

  private toggleDebug(): void {
    this.debugEnabled = !this.debugEnabled;
    this.debugG.setVisible(this.debugEnabled).clear();
    this.debugText.setVisible(this.debugEnabled).setText('');
  }

  private drawDebug(): void {
    const g = this.debugG;
    g.clear();
    for (const p of this.players) {
      const b = p.arcadeBody;
      g.lineStyle(1, 0x00ff44, 1);
      g.strokeRect(b.x, b.y, b.width, b.height);
      const box = this.combat.getAttackBox(p.idx);
      if (box) {
        g.lineStyle(1, 0xff2222, 1);
        g.strokeRect(box.x, box.y, box.width, box.height);
      }
    }
    g.lineStyle(1, 0xf8d848, 1);
    for (const w of this.weapons.groundWeapons) {
      const b = w.arcadeBody;
      g.strokeRect(b.x, b.y, b.width, b.height);
    }
    for (const t of this.weapons.activeTraps) {
      g.strokeRect(t.x - 8, t.y - 8, 16, 16);
    }
    g.lineStyle(1, 0x48e0c0, 1);
    for (const pr of this.weapons.activeProjectiles) {
      const b = pr.arcadeBody;
      g.strokeRect(b.x, b.y, b.width, b.height);
    }
    const [p1, p2] = this.players;
    this.debugText.setText(
      [
        `FPS ${Math.round(this.game.loop.actualFps)}`,
        `P1 ${Math.round(p1.x)},${Math.round(p1.y)} HP ${p1.hp} HELD ${p1.heldWeapon ?? '-'}`,
        `P2 ${Math.round(p2.x)},${Math.round(p2.y)} HP ${p2.hp} HELD ${p2.heldWeapon ?? '-'}`,
        `WPN ${this.weapons.groundWeapons.length} PROJ ${this.weapons.activeProjectiles.length} TRAP ${this.weapons.activeTraps.length}`,
      ].join('\n'),
    );
  }
}
