// NET-CORE (src/net/guestView.ts): GuestView appliziert Host-Snapshots OHNE lokale Simulation.
// Positionen interpoliert (~100 ms Puffer), HP/Timer/Phase/Countdown hart. Spiegel-Images fuer
// Boden-Waffen/Projektile/Fallen/Held-Waffe. Musik/FX/Sounds Gast-lokal (HP-Delta, Countdown,
// FIGHT/K.O./TIME, Pause-Overlay ohne Menue, Result-Anzeige, Rematch-Reset bei phase->countdown).
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../types';
import { PLAYER_MAX_HP, Player, safePlayAnim } from '../entities/Player';
import { WEAPON_BLINK_MS, WEAPON_LIFETIME_MS } from '../entities/Weapon';
import { isPngKey } from '../sprites/manifest';
import { Hud } from '../ui/hud';
import { FxSystem } from '../systems/fx';
import { AudioSystem } from '../systems/audio';
import { MusicSystem } from '../systems/music';
import { createPixelText } from '../ui/pixelText';
import { decodeSnapshot, NetAnim, NetPhase, NetPlayerState, NetSnapshot, NET_CENTERS } from './snapshot';

const RENDER_DELAY_MS = 100;
const COLOR_GOLD = 0xf8d848;
const COLOR_RED = 0xe04848;
const COLOR_WHITE = 0xf2f0e5;
const GROUND_TOP = 188;

interface FramePoint {
  x: number;
  y: number;
}

interface BufferEntry {
  at: number;
  players: [FramePoint, FramePoint];
  weapons: FramePoint[];
  projectiles: FramePoint[];
  traps: FramePoint[];
}

export class GuestView {
  private latest: NetSnapshot | null = null;
  private buffer: BufferEntry[] = [];
  private prevPhase: NetPhase | null = null;
  private prevCenter = -1;
  private pausedShown = false;
  private hadFirst = false;
  private timerShown = -1;
  private lastHp: [number, number] = [PLAYER_MAX_HP, PLAYER_MAX_HP];
  private weaponMirrors: Phaser.GameObjects.Image[] = [];
  private projectileMirrors: Phaser.GameObjects.Image[] = [];
  private trapMirrors: Phaser.GameObjects.Image[] = [];
  private heldMirrors: [Phaser.GameObjects.Image | null, Phaser.GameObjects.Image | null] = [null, null];
  private resultHint: Phaser.GameObjects.Container | null = null;

  constructor(
    private scene: Phaser.Scene,
    private players: [Player, Player],
    private hud: Hud,
    private fx: FxSystem,
    private audio: AudioSystem,
    private music: MusicSystem,
  ) {}

  get currentPhase(): NetPhase | null {
    return this.latest?.phase ?? null;
  }

  get currentPaused(): boolean {
    return this.latest?.paused ?? false;
  }

  receive(bytes: Uint8Array): void {
    const snap = decodeSnapshot(bytes);
    if (!snap) return;
    this.latest = snap;
    if (!this.hadFirst) {
      this.hadFirst = true;
      this.hud.clearCenterText();
    }
    this.buffer.push({
      at: performance.now(),
      players: [
        { x: snap.players[0].x, y: snap.players[0].y },
        { x: snap.players[1].x, y: snap.players[1].y },
      ],
      weapons: snap.weapons.map((w) => ({ x: w.x, y: w.y })),
      projectiles: snap.projectiles.map((p) => ({ x: p.x, y: p.y })),
      traps: snap.traps.map((t) => ({ x: t.x, y: t.y })),
    });
    if (this.buffer.length > 64) this.buffer.splice(0, this.buffer.length - 64);
    this.applyHardState(snap);
  }

  update(): void {
    if (!this.latest || this.buffer.length === 0) return;
    const rt = performance.now() - RENDER_DELAY_MS;
    while (this.buffer.length > 1 && this.buffer[1].at <= rt) this.buffer.shift();
    const a = this.buffer[0];
    const b = this.buffer.length > 1 ? this.buffer[1] : null;
    const alpha = b && b.at > a.at ? Phaser.Math.Clamp((rt - a.at) / (b.at - a.at), 0, 1) : 1;
    this.applyPlayers(a, b, alpha);
    this.syncWeaponMirrors(a, b, alpha);
    this.syncProjectileMirrors(a, b, alpha);
    this.syncTrapMirrors(a, b, alpha);
  }

  private applyHardState(snap: NetSnapshot): void {
    this.applyHp(0, snap.players[0]);
    this.applyHp(1, snap.players[1]);
    const sec = Math.max(0, Math.ceil(snap.timeLeftMs / 1000));
    if (sec !== this.timerShown) {
      this.timerShown = sec;
      this.hud.updateTimer(sec);
    }
    if (snap.paused) {
      if (!this.pausedShown) {
        this.pausedShown = true;
        this.hud.showCenterText('PAUSE');
      }
      return;
    }
    if (this.pausedShown) {
      this.pausedShown = false;
      this.hud.clearCenterText();
      this.prevCenter = -1;
    }
    this.applyPhase(snap);
    this.applyCenter(snap);
  }

  private applyPhase(snap: NetSnapshot): void {
    if (snap.phase === this.prevPhase) return;
    const prev = this.prevPhase;
    this.prevPhase = snap.phase;
    if (snap.phase === 'countdown') {
      this.resetLocalBattle();
      if (prev === 'result') this.hud.clearCenterText();
      this.destroyResultHint();
      return;
    }
    if (snap.phase === 'fight') {
      this.music.start();
      this.destroyResultHint();
      return;
    }
    if (snap.phase === 'ko') {
      this.destroyResultHint();
      return;
    }
    if (snap.phase === 'result') {
      this.music.stop();
      this.audio.play('victory');
      const label =
        snap.winner == null || snap.winner === -1 ? 'DRAW!' : `PLAYER ${snap.winner + 1} WINS!`;
      this.hud.showCenterText(label, COLOR_GOLD);
      this.destroyResultHint();
      this.resultHint = createPixelText(this.scene, GAME_WIDTH / 2, GAME_HEIGHT - 34, 'WAITING FOR HOST...', {
        scale: 1,
        originX: 0.5,
        color: COLOR_WHITE,
      });
      this.resultHint.setDepth(101).setAlpha(0.8);
    }
  }

  private applyCenter(snap: NetSnapshot): void {
    if (snap.phase === 'result') return;
    const code = NET_CENTERS.indexOf(snap.center);
    if (code === this.prevCenter) return;
    this.prevCenter = code;
    if (code <= 0) {
      this.hud.clearCenterText();
      return;
    }
    if (code >= 1 && code <= 3) {
      this.hud.showCenterText(snap.center);
      this.audio.play('countdown');
      return;
    }
    if (code === 4) {
      this.hud.showCenterText('FIGHT!', COLOR_RED);
      this.audio.play('fight');
      this.fx.screenShake(4);
      return;
    }
    if (code === 5) {
      this.hud.showCenterText('K.O.!', COLOR_RED);
      return;
    }
    if (code === 6) {
      this.hud.showCenterText('TIME!', COLOR_GOLD);
      this.audio.play('countdown');
    }
  }

  private applyHp(idx: 0 | 1, st: NetPlayerState): void {
    const before = this.lastHp[idx];
    if (st.hp === before) return;
    const p = this.players[idx];
    p.hp = st.hp;
    this.hud.updateHp(idx, st.hp);
    if (st.hp < before) {
      const dmg = before - st.hp;
      const power: 0 | 1 = dmg >= 14 ? 1 : 0;
      this.fx.hitBurst(p.x, p.y - 28, st.hp <= 0 ? 2 : power);
      this.fx.comicWord(p.x, p.y - 58, dmg >= 14 ? 'POW!' : 'BONK!', COLOR_WHITE);
      this.fx.screenShake(st.hp <= 0 ? 10 : power === 1 ? 5 : 3);
      this.audio.play(st.hp <= 0 ? 'ko' : dmg >= 14 ? 'heavyHit' : 'hit');
      if (st.hp <= 0) this.fx.koStars(p.x, p.y - 52);
    }
    this.lastHp[idx] = st.hp;
  }

  private applyPlayers(a: BufferEntry, b: BufferEntry | null, alpha: number): void {
    for (const idx of [0, 1] as const) {
      const p = this.players[idx];
      const pa = a.players[idx];
      const pb = b?.players[idx] ?? null;
      p.setPosition(pb ? Phaser.Math.Linear(pa.x, pb.x, alpha) : pa.x, pb ? Phaser.Math.Linear(pa.y, pb.y, alpha) : pa.y);
      const st = this.latest!.players[idx];
      p.facing = st.facing;
      p.setFlipX(st.facing === -1);
      p.isDead = st.dead;
      p.heldWeapon = st.heldWeapon;
      this.applyAnim(p, st.anim);
      this.syncHeldMirror(idx);
    }
  }

  private applyAnim(p: Player, anim: NetAnim): void {
    const prefix = p.prefix;
    switch (anim) {
      case 'idle':
        safePlayAnim(p, prefix + '_idle', prefix + '_idle');
        break;
      case 'walk':
        safePlayAnim(p, prefix + '_walk', prefix + '_walk');
        break;
      case 'attack':
        safePlayAnim(p, prefix + '_attack', prefix + '_attack');
        break;
      case 'throw':
        safePlayAnim(p, prefix + '_throw', prefix + '_throw');
        break;
      case 'hit':
        safePlayAnim(p, prefix + '_hit', prefix + '_hit');
        break;
      case 'ko':
        safePlayAnim(p, prefix + '_ko', prefix + '_ko');
        break;
      case 'victory':
        safePlayAnim(p, prefix + '_victory', prefix + '_victory');
        break;
      case 'jump':
        this.setStaticFrame(p, prefix + '_jump_0');
        break;
      case 'fall':
        this.setStaticFrame(p, prefix + '_fall_0');
        break;
      case 'duck':
        this.setStaticFrame(p, prefix + '_duck_0');
        break;
    }
  }

  private setStaticFrame(p: Player, key: string): void {
    if (!this.scene.textures.exists(key)) return;
    if (p.anims.isPlaying) p.anims.stop();
    if (p.texture.key !== key) p.setTexture(key);
  }

  private syncHeldMirror(idx: 0 | 1): void {
    const p = this.players[idx];
    const id = this.latest!.players[idx].heldWeapon;
    if (!id) {
      this.heldMirrors[idx]?.destroy();
      this.heldMirrors[idx] = null;
      return;
    }
    let img = this.heldMirrors[idx];
    if (!img || img.texture.key !== `wpn_${id}`) {
      img?.destroy();
      img = this.scene.add.image(p.x, p.y - 30, `wpn_${id}`);
      img.setScale(isPngKey(`wpn_${id}`) ? 1 : 2).setDepth(11);
      this.heldMirrors[idx] = img;
    }
    img.setPosition(p.x + p.facing * 9, p.y - 30);
    img.setFlipX(p.facing === -1);
  }

  private syncWeaponMirrors(a: BufferEntry, b: BufferEntry | null, alpha: number): void {
    const weapons = this.latest!.weapons;
    this.fitMirrorCount(this.weaponMirrors, weapons.length);
    for (let i = 0; i < weapons.length; i++) {
      const st = weapons[i];
      const img = this.weaponMirrors[i];
      if (img.texture.key !== `wpn_${st.id}`) {
        img.setTexture(`wpn_${st.id}`);
        img.setScale(isPngKey(`wpn_${st.id}`) ? 1 : 2);
      }
      this.lerpMirror(img, a.weapons[i] ?? st, b?.weapons[i] ?? null, alpha);
      const blink = WEAPON_LIFETIME_MS - st.ageMs <= WEAPON_BLINK_MS;
      img.setAlpha(blink ? (Math.floor(st.ageMs / 130) % 2 === 0 ? 1 : 0.3) : 1);
    }
  }

  private syncProjectileMirrors(a: BufferEntry, b: BufferEntry | null, alpha: number): void {
    const projectiles = this.latest!.projectiles;
    this.fitMirrorCount(this.projectileMirrors, projectiles.length);
    for (let i = 0; i < projectiles.length; i++) {
      const st = projectiles[i];
      const img = this.projectileMirrors[i];
      if (img.texture.key !== `wpn_${st.id}`) {
        img.setTexture(`wpn_${st.id}`);
        img.setScale(isPngKey(`wpn_${st.id}`) ? 1 : 2);
      }
      this.lerpMirror(img, a.projectiles[i] ?? st, b?.projectiles[i] ?? null, alpha);
      img.setAngle(st.angle);
    }
  }

  private syncTrapMirrors(a: BufferEntry, b: BufferEntry | null, alpha: number): void {
    const traps = this.latest!.traps;
    this.fitMirrorCount(this.trapMirrors, traps.length);
    for (let i = 0; i < traps.length; i++) {
      const st = traps[i];
      const img = this.trapMirrors[i];
      if (img.texture.key !== 'wpn_banana') {
        img.setTexture('wpn_banana');
        img.setScale(2);
      }
      this.lerpMirror(img, a.traps[i] ?? st, b?.traps[i] ?? null, alpha);
      img.setAngle(st.angle);
    }
  }

  private fitMirrorCount(mirrors: Phaser.GameObjects.Image[], n: number): void {
    while (mirrors.length > n) mirrors.pop()?.destroy();
    while (mirrors.length < n) {
      mirrors.push(this.scene.add.image(-100, -100, 'wpn_plunger'));
    }
  }

  private lerpMirror(img: Phaser.GameObjects.Image, pa: FramePoint, pb: FramePoint | null, alpha: number): void {
    img.setPosition(pb ? Phaser.Math.Linear(pa.x, pb.x, alpha) : pa.x, pb ? Phaser.Math.Linear(pa.y, pb.y, alpha) : pa.y);
  }

  private resetLocalBattle(): void {
    for (const img of this.weaponMirrors) img.destroy();
    for (const img of this.projectileMirrors) img.destroy();
    for (const img of this.trapMirrors) img.destroy();
    this.weaponMirrors = [];
    this.projectileMirrors = [];
    this.trapMirrors = [];
    for (const idx of [0, 1] as const) {
      const p = this.players[idx];
      p.hp = PLAYER_MAX_HP;
      p.isDead = false;
      p.heldWeapon = null;
      p.setPosition(idx === 0 ? 115 : 269, GROUND_TOP);
      this.heldMirrors[idx]?.destroy();
      this.heldMirrors[idx] = null;
      this.hud.updateHp(idx, PLAYER_MAX_HP);
      this.lastHp[idx] = PLAYER_MAX_HP;
    }
    this.hud.updateTimer(60);
    this.timerShown = 60;
  }

  private destroyResultHint(): void {
    this.resultHint?.destroy();
    this.resultHint = null;
  }
}
