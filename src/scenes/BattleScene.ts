// CONTRACT (COMBAT): BattleScene orchestriert Arena, Spieler, Countdown, 60s-Timer,
// KO-Sequenz, Pause (PauseMenu), Debug (F10), Rematch (ENTER) / Hauptmenue (ESC).
import Phaser from 'phaser';
import { EV, GAME_HEIGHT, GAME_WIDTH } from '../types';
import { Player, safePlayAnim } from '../entities/Player';
import { InputSystem, PlayerInput } from '../systems/input';
import { FxSystem } from '../systems/fx';
import { AudioSystem } from '../systems/audio';
import { MusicSystem } from '../systems/music';
import { CombatSystem } from '../systems/combat';
import { WeaponSystem } from '../systems/weapons';
import { Hud } from '../ui/hud';
import { PauseMenu } from '../ui/PauseMenu';

const GROUND_TOP = 188;
const ROUND_MS = 60000;
const COUNTDOWN_STEP_MS = 800;
const PAL_GRASS = 0x48a838;
const PAL_GRASS_DARK = 0x2f7024;
const PAL_GRASS_LIGHT = 0x28d84a;

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
  private fx!: FxSystem;
  private audioS!: AudioSystem;
  private music!: MusicSystem;
  private hud!: Hud;
  private combat!: CombatSystem;
  private weapons!: WeaponSystem;
  private pauseMenu!: PauseMenu;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private timeLeft = ROUND_MS;
  private lastTimerShown = 60;
  private debugEnabled = false;
  private debugG!: Phaser.GameObjects.Graphics;
  private debugText!: Phaser.GameObjects.Text;

  constructor() {
    super('BattleScene');
  }

  create(): void {
    this.phase = 'countdown';
    this.paused = false;
    this.timeLeft = ROUND_MS;
    this.lastTimerShown = 60;
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.buildArena();
    this.players = [
      new Player(this, 115, GROUND_TOP, 0),
      new Player(this, 269, GROUND_TOP, 1),
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
        this.scene.restart();
      },
      mainMenu: () => {
        this.pauseMenu.close();
        this.paused = false;
        this.music.stop();
        this.scene.start('MainMenuScene');
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
        if (this.phase === 'result' && !this.paused) this.scene.restart();
      });
      kb.on('keydown-F10', () => this.toggleDebug());
    }
    const koHandler = (idx: 0 | 1) => this.onPlayerKO(idx);
    this.events.on(EV.PLAYER_KO, koHandler);
    this.events.once('shutdown', () => {
      this.events.off(EV.PLAYER_KO, koHandler);
      this.music.stop();
    });
    this.startCountdown();
  }

  update(_time: number, delta: number): void {
    this.inputSystem.update();
    if (this.paused) return;
    if (this.phase === 'fight') {
      for (const p of this.players) {
        const inp = this.inputSystem.get(p.idx);
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
      this.fx.update(delta);
      this.tickTimer(delta);
    } else if (this.phase === 'countdown') {
      for (const p of this.players) p.update(EMPTY_INPUT);
      this.fx.update(delta);
    } else {
      for (const p of this.players) if (p.isDead) p.update(EMPTY_INPUT);
      this.fx.update(delta);
    }
    if (this.debugEnabled) this.drawDebug();
  }

  private buildArena(): void {
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'arena_sky')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.platforms = this.physics.add.staticGroup();
    this.addStaticRect(GAME_WIDTH / 2, GROUND_TOP + 14, GAME_WIDTH, 28, PAL_GRASS, 1);
    this.add.rectangle(GAME_WIDTH / 2, GROUND_TOP + 23, GAME_WIDTH, 10, PAL_GRASS_DARK).setDepth(1);
    this.add.rectangle(GAME_WIDTH / 2, GROUND_TOP + 1, GAME_WIDTH, 2, PAL_GRASS_LIGHT).setDepth(2);
    this.addPlatform(48, 150, 70);
    this.addPlatform(336, 150, 70);
    this.addPlatform(192, 170, 44);
    this.deco(70, 150, 'arena_house', 1);
    this.addCloud(56, 20, 'arena_cloud_0', 9000);
    this.addCloud(190, 34, 'arena_cloud_1', 12000);
    this.addCloud(320, 16, 'arena_cloud_2', 15000);
    this.addBird(30, 16000, false, 0);
    this.addBird(46, 21000, true, 2000);
    this.deco(26, GROUND_TOP, 'arena_tree');
    this.deco(358, GROUND_TOP, 'arena_tree');
    this.deco(80, GROUND_TOP, 'arena_bush');
    this.deco(300, GROUND_TOP, 'arena_bush');
    this.deco(140, GROUND_TOP, 'arena_bench');
    this.deco(216, GROUND_TOP, 'arena_trashcan');
    this.deco(252, GROUND_TOP, 'arena_lamp');
    this.deco(118, GROUND_TOP, 'arena_flower_0');
    this.deco(126, GROUND_TOP, 'arena_flower_1');
    this.deco(268, GROUND_TOP, 'arena_flower_1');
    this.deco(276, GROUND_TOP, 'arena_flower_0');
    this.deco(100, GROUND_TOP, 'arena_grass_0');
    this.deco(190, GROUND_TOP, 'arena_grass_1');
    this.deco(280, GROUND_TOP, 'arena_grass_2');
    this.deco(336, GROUND_TOP, 'arena_grass_0');
    this.deco(60, GROUND_TOP, 'arena_grass_1');
    this.scheduleLeaf();
  }

  private addStaticRect(
    cx: number,
    cy: number,
    w: number,
    h: number,
    color: number,
    depth: number,
  ): Phaser.GameObjects.Rectangle {
    const r = this.add.rectangle(cx, cy, w, h, color).setDepth(depth);
    this.physics.add.existing(r, true);
    this.platforms.add(r);
    return r;
  }

  private addPlatform(cx: number, topY: number, w: number): void {
    this.addStaticRect(cx, topY + 3, w, 6, PAL_GRASS, 4);
    this.add.rectangle(cx, topY + 1, w, 2, PAL_GRASS_LIGHT).setDepth(5);
  }

  private deco(x: number, y: number, key: string, depth = 3): void {
    this.add.image(x, y, key).setOrigin(0.5, 1).setScale(2).setDepth(depth);
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
    if (this.paused) {
      this.resumeGame();
      return;
    }
    if (this.phase === 'result') {
      this.music.stop();
      this.scene.start('MainMenuScene');
      return;
    }
    if (this.phase === 'fight') this.pauseGame();
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
    this.hud.showCenterText(text, color);
  }

  private clearCenterText(): void {
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
