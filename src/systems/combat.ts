// CONTRACT (COMBAT -> BattleScene/META):
// export class CombatSystem { constructor(scene, players: [Player,Player], fx, audio, hud)
//   tryMelee(player) — startet Angriff (Attackbox nur im aktiven Zeitfenster aktiv)
//   update() — jedes Frame im Kampf aufrufen (Attackbox-Checks)
//   applyHit(target, {damage, knockback, hitWord, sourceX, weaponId?, wordColor?})
//   applySlip(target) — Bananen-Ausrutscher (kein Schaden, Kontrollverlust 0.8s)
//   isBusy(player), getAttackBox(idx) — fuer BattleScene-Gating + Debug
// Events auf scene.events: EV.PLAYER_DAMAGE, EV.HIT_LANDED, EV.PLAYER_KO, EV.KO, EV.ROUND_END
import Phaser from 'phaser';
import { EV, WEAPONS, WeaponId } from '../types';
import { Player, safePlayAnim, PLAYER_BODY_W } from '../entities/Player';
import { FxSystem } from './fx';
import { AudioSystem } from './audio';
import { Hud } from '../ui/hud';

export const WEAPON_WORD_COLORS: Record<WeaponId, number> = {
  plunger: 0xe04848,
  rubberChicken: 0xe8a0b0,
  banana: 0xf8d848,
  pillow: 0xf2f0e5,
  toiletBrush: 0x48e0c0,
  fryingPan: 0xf07828,
  rubberBoot: 0x48a838,
  rubberDuck: 0xf8d848,
};

export interface HitOptions {
  damage: number;
  knockback: number;
  hitWord: string;
  sourceX: number;
  weaponId?: WeaponId | null;
  wordColor?: number;
}

const ATTACK_WINDOW_FROM = 90;
const ATTACK_WINDOW_TO = 230;
const ATTACK_DURATION = 300;
const FIST_COOLDOWN = 350;
const FIST_RANGE = 14;
const FIST_KNOCKBACK = 150;
const HITSTUN_MS = 280;
const SLIP_MS = 800;
const DROP_CHANCE = 0.4;

interface AttackRuntime {
  active: boolean;
  hitFrom: number;
  hitUntil: number;
  endsAt: number;
  cooldownUntil: number;
  facing: -1 | 1;
  damage: number;
  knockback: number;
  range: number;
  hitWord: string;
  wordColor: number;
  weaponId: WeaponId | null;
  hitTargets: Set<0 | 1>;
}

function emptyAttack(): AttackRuntime {
  return {
    active: false,
    hitFrom: 0,
    hitUntil: 0,
    endsAt: 0,
    cooldownUntil: 0,
    facing: 1,
    damage: 0,
    knockback: 0,
    range: 0,
    hitWord: '',
    wordColor: 0xffffff,
    weaponId: null,
    hitTargets: new Set<0 | 1>(),
  };
}

export class CombatSystem {
  private readonly scene: Phaser.Scene;
  private readonly players: [Player, Player];
  private readonly fx: FxSystem;
  private readonly audio: AudioSystem;
  private readonly hud: Hud;
  private readonly attacks: [AttackRuntime, AttackRuntime] = [emptyAttack(), emptyAttack()];
  private readonly hitstunUntil: [number, number] = [0, 0];
  private readonly slipUntil: [number, number] = [0, 0];
  private dropHeld: ((player: Player) => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    players: [Player, Player],
    fx: FxSystem,
    audio: AudioSystem,
    hud: Hud,
  ) {
    this.scene = scene;
    this.players = players;
    this.fx = fx;
    this.audio = audio;
    this.hud = hud;
  }

  setWeaponDrop(fn: (player: Player) => void): void {
    this.dropHeld = fn;
  }

  isBusy(player: Player): boolean {
    const now = this.scene.time.now;
    const idx = player.idx;
    return this.attacks[idx].active || now < this.hitstunUntil[idx] || now < this.slipUntil[idx];
  }

  tryMelee(player: Player): void {
    const now = this.scene.time.now;
    const idx = player.idx;
    const st = this.attacks[idx];
    if (player.isDead || this.isBusy(player) || now < st.cooldownUntil) return;
    const weaponId = player.heldWeapon;
    const def = weaponId ? WEAPONS[weaponId] : null;
    st.active = true;
    st.hitFrom = now + ATTACK_WINDOW_FROM;
    st.hitUntil = now + ATTACK_WINDOW_TO;
    st.endsAt = now + ATTACK_DURATION;
    st.hitTargets.clear();
    st.facing = player.facing;
    st.weaponId = weaponId;
    if (def) {
      st.damage = Math.max(6, def.damage);
      st.knockback = Math.max(100, def.knockback);
      st.range = def.range;
      st.hitWord = def.hitWord;
      st.wordColor = WEAPON_WORD_COLORS[def.id];
      st.cooldownUntil = now + def.attackSpeed * 1000;
    } else {
      st.damage = 8 + Math.floor(Math.random() * 5);
      st.knockback = FIST_KNOCKBACK;
      st.range = FIST_RANGE;
      st.hitWord = 'POW!';
      st.wordColor = 0xffffff;
      st.cooldownUntil = now + FIST_COOLDOWN;
    }
    player.setVelocityX(0);
    safePlayAnim(player, this.prefix(idx) + '_attack', this.prefix(idx) + '_attack');
  }

  update(): void {
    const now = this.scene.time.now;
    for (const idx of [0, 1] as const) {
      const st = this.attacks[idx];
      if (!st.active) continue;
      if (now >= st.endsAt) {
        st.active = false;
        continue;
      }
      if (now < st.hitFrom || now > st.hitUntil) continue;
      const box = this.getAttackBox(idx);
      if (!box) continue;
      const target = this.players[1 - idx];
      if (target.isDead || st.hitTargets.has(target.idx)) continue;
      const tb = target.arcadeBody;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(box, new Phaser.Geom.Rectangle(tb.x, tb.y, tb.width, tb.height))) continue;
      st.hitTargets.add(target.idx);
      this.applyHit(target, {
        damage: st.damage,
        knockback: st.knockback,
        hitWord: st.hitWord,
        sourceX: this.players[idx].x,
        weaponId: st.weaponId,
        wordColor: st.wordColor,
      });
    }
  }

  getAttackBox(idx: 0 | 1): Phaser.Geom.Rectangle | null {
    const now = this.scene.time.now;
    const st = this.attacks[idx];
    if (!st.active || now < st.hitFrom || now > st.hitUntil) return null;
    const p = this.players[idx];
    const w = st.range + 6;
    const cx = p.x + st.facing * (PLAYER_BODY_W / 2 + w / 2);
    const cy = p.y - 26;
    return new Phaser.Geom.Rectangle(cx - w / 2, cy - 16, w, 32);
  }

  applyHit(target: Player, o: HitOptions): void {
    if (target.isDead) return;
    const now = this.scene.time.now;
    const idx = target.idx;
    const dmg = Math.max(0, Math.round(o.damage));
    target.hp = Math.max(0, target.hp - dmg);
    this.hud.updateHp(idx, target.hp);
    this.scene.events.emit(EV.PLAYER_DAMAGE, idx, target.hp);
    this.attacks[idx].active = false;
    const dir = target.x >= o.sourceX ? 1 : -1;
    const power: 0 | 1 = dmg >= 14 ? 1 : 0;
    const wid = o.weaponId ?? null;
    const wordColor = o.wordColor ?? 0xffffff;
    if (target.hp <= 0) {
      target.isDead = true;
      target.setVelocity(dir * 240, -320);
      safePlayAnim(target, this.prefix(idx) + '_ko', this.prefix(idx) + '_ko');
      this.fx.hitBurst(target.x, target.y - 30, 2);
      this.dropIfHeld(target, 1);
      this.scene.events.emit(EV.HIT_LANDED, target.x, target.y - 30, 2, o.hitWord);
      this.scene.events.emit(EV.KO);
      this.scene.events.emit(EV.PLAYER_KO, idx);
      this.scene.events.emit(EV.ROUND_END, (1 - idx) as 0 | 1);
      return;
    }
    target.setVelocity(dir * o.knockback, -(120 + o.knockback * 0.25));
    this.hitstunUntil[idx] = now + HITSTUN_MS;
    safePlayAnim(target, this.prefix(idx) + '_hit', this.prefix(idx) + '_hit');
    this.fx.hitBurst(target.x, target.y - 28, power);
    this.fx.comicWord(target.x, target.y - 58, o.hitWord, wordColor);
    this.fx.screenShake(power === 1 ? 6 : 3);
    this.fx.hitstop(power === 1 ? 80 : 55);
    if (wid === 'rubberChicken' || wid === 'rubberDuck') this.audio.play('squeak');
    else if (wid === 'plunger') this.audio.play('bonk');
    else if (dmg >= 14) this.audio.play('heavyHit');
    else this.audio.play('hit');
    if (wid === 'fryingPan') this.fx.koStars(target.x, target.y - 46);
    this.dropIfHeld(target, DROP_CHANCE);
    this.scene.events.emit(EV.HIT_LANDED, target.x, target.y - 28, power, o.hitWord);
  }

  applySlip(target: Player): void {
    if (target.isDead || this.isBusy(target)) return;
    const now = this.scene.time.now;
    const idx = target.idx;
    this.attacks[idx].active = false;
    this.slipUntil[idx] = now + SLIP_MS;
    const vx = target.arcadeBody.velocity.x;
    target.setVelocity(vx !== 0 ? vx : target.facing * 80, -70);
    safePlayAnim(target, this.prefix(idx) + '_hit', this.prefix(idx) + '_hit');
    this.fx.comicWord(target.x, target.y - 56, 'PLOP!', 0xf8d848);
    this.fx.hitBurst(target.x, target.y - 8, 0);
    this.audio.play('bonk');
  }

  private dropIfHeld(target: Player, chance: number): void {
    if (!target.heldWeapon) return;
    if (Math.random() > chance) return;
    this.dropHeld?.(target);
  }

  private prefix(idx: 0 | 1): string {
    return idx === 0 ? 'boy1' : 'boy2';
  }
}
