// CPU-KI (Modus 'cpu'): steuert P2 mit denselben PlayerInput-Intents wie die
// Tastatur. Reaktionstakt statt Frame-Perfektion: Entscheidung alle ~150ms
// (plus Jitter), Intents gelten bis zur naechsten Entscheidung.
// Prioritaeten:
//   1) Projektile ausweichen (weglaufen, im Notfall springen)
//   2) Bananen-Falle vor den Fuessen ueberspringen
//   3) Melee im Nahkampf (mit Eigen-Cooldown)
//   4) Wurf bei horizontaler Ausrichtung (der Wurfbogen verzeiht wenig)
//   5) Ohne Waffe: naechste Bodenwaffe holen (zu Plattform-Waffen springen)
//   6) Sonst zum Gegner (Faeuste)

import { GAME_WIDTH } from '../types';
import { Player } from '../entities/Player';
import type { Weapon } from '../entities/Weapon';
import type { Projectile } from '../entities/Projectile';
import type { Trap } from '../entities/Trap';
import { emptyInput, type PlayerInput } from './input';

export interface CpuDeps {
  groundWeapons(): readonly Weapon[];
  projectiles(): readonly Projectile[];
  traps(): readonly Trap[];
  now(): number;
}

const THINK_MS = 150;
const JITTER_MS = 90;
const MELEE_RANGE = 24;
const MELEE_CD = 620;
const ALIGN_DY = 32;
const THROW_MIN = 20;
const THROW_MAX = 100;
const THROW_CD = 900;
const APPROACH_TO = 78;
const KEEP_AWAY = 34;
const PICKUP_DX = 15;
const PICKUP_DY = 42;
const DODGE_LOOK = 150;
const DODGE_JUMP = 46;
const TRAP_AHEAD = 26;
const EDGE = 16;
const JUMP_CD = 450;
const SEEK_ABOVE = 44;

export class CpuAi {
  private readonly me: Player;
  private readonly foe: Player;
  private readonly deps: CpuDeps;
  private readonly state: PlayerInput = emptyInput();
  private thinkRem = 0;
  private meleeReadyAt = 0;
  private throwReadyAt = 0;
  private jumpReadyAt = 0;

  constructor(me: Player, foe: Player, deps: CpuDeps) {
    this.me = me;
    this.foe = foe;
    this.deps = deps;
  }

  getInput(): PlayerInput {
    return this.state;
  }

  // Dev/Test-Probe: read-only Einblick fuer E2E-Debug
  get debug(): Record<string, unknown> {
    const dx = this.foe.x - this.me.x;
    return {
      thinkRem: Math.round(this.thinkRem),
      left: this.state.left,
      right: this.state.right,
      up: this.state.up,
      meleePressed: this.state.meleePressed,
      weaponPressed: this.state.weaponPressed,
      held: this.me.heldWeapon,
      dist: Math.round(Math.abs(dx)),
      meleeReadyIn: Math.round(this.meleeReadyAt - this.deps.now()),
      throwReadyIn: Math.round(this.throwReadyAt - this.deps.now()),
      meX: Math.round(this.me.x),
      foeX: Math.round(this.foe.x),
    };
  }

  update(delta: number): void {
    // Einzel-Frame-Flags zuerst zuruecksetzen: sie sind nur im Frame der
    // Entscheidung wahr (wie ein echter Tastendruck).
    this.state.meleePressed = false;
    this.state.weaponPressed = false;
    this.state.specialPressed = false;
    this.state.up = false;

    this.thinkRem -= delta;
    if (this.thinkRem > 0) return;
    this.thinkRem = THINK_MS + Math.random() * JITTER_MS;
    this.decide(this.deps.now());
  }

  private decide(now: number): void {
    const st = this.state;
    st.left = false;
    st.right = false;

    const myX = this.me.x;
    const myY = this.me.y;
    const dx = this.foe.x - myX;
    const dy = this.foe.y - myY;
    const dist = Math.abs(dx);
    const dir = dx >= 0 ? 1 : -1;

    // 1) Projektil-Bedrohung: kommt auf mich zu, in meiner Hoehe, nah
    for (const pr of this.deps.projectiles()) {
      const vx = pr.arcadeBody.velocity.x;
      const toward = (pr.x - myX) * vx < 0;
      const near = Math.abs(pr.x - myX) < DODGE_LOOK && Math.abs(pr.y - myY) < 46;
      if (toward && near) {
        const away = pr.x >= myX ? -1 : 1;
        if (Math.abs(pr.x - myX) < DODGE_JUMP) st.up = true; // zu knapp: springen
        this.move(away);
        return;
      }
    }

    // 2) Falle direkt vor mir (Richtung Gegner) auf Bodennaehe: drueberspringen
    const walkDir = st.left ? -1 : st.right ? 1 : dir;
    for (const t of this.deps.traps()) {
      const ahead = (t.x - myX) * walkDir > 0;
      if (ahead && Math.abs(t.x - myX) < TRAP_AHEAD && t.y >= myY - 10) {
        st.up = true;
        this.move(walkDir);
        return;
      }
    }

    // 3) Nahkampf
    if (dist < MELEE_RANGE && Math.abs(dy) < 30 && now >= this.meleeReadyAt) {
      st.meleePressed = true;
      this.meleeReadyAt = now + MELEE_CD;
      return;
    }

    // 4) bewaffnet: Wuerfe sind kurze Boegen - nah ran, ausgerichtet werfen,
    //    sonst Faeuste (melee oben) oder Fasson halten
    if (this.me.heldWeapon) {
      if (Math.abs(dy) < ALIGN_DY && dist > THROW_MIN && dist < THROW_MAX && now >= this.throwReadyAt) {
        st.weaponPressed = true;
        this.throwReadyAt = now + THROW_CD;
        return;
      }
      if (dist > APPROACH_TO) {
        this.move(dir);
        if (this.blockedH()) this.jump(now);
      } else if (dist < KEEP_AWAY) this.move(-dir);
      return;
    }

    // 5) unbewaffnet: naechste Bodenwaffe holen
    const target = this.nearestWeapon();
    if (target) {
      const wdx = target.x - myX;
      const wdy = target.y - myY;
      if (Math.abs(wdx) <= PICKUP_DX && Math.abs(wdy) <= PICKUP_DY) {
        st.weaponPressed = true; // aufheben
        return;
      }
      this.move(wdx >= 0 ? 1 : -1);
      // Waffe ueber mir (Plattform/Bank) oder gegen eine Kante gelaufen: springen
      if ((wdy < -18 && Math.abs(wdx) < SEEK_ABOVE) || this.blockedH()) this.jump(now);
      return;
    }

    // 6) keine Waffe verfuegbar (Mindestbestand spawnt gleich): an den Gegner
    if (dist > MELEE_RANGE) {
      this.move(dir);
      if (this.blockedH()) this.jump(now);
    }
  }

  private blockedH(): boolean {
    const body = this.me.body as Phaser.Physics.Arcade.Body | null;
    return !!body && (body.blocked.left || body.blocked.right);
  }

  private jump(now: number): void {
    if (now < this.jumpReadyAt) return;
    this.state.up = true;
    this.jumpReadyAt = now + JUMP_CD;
  }

  private nearestWeapon(): Weapon | null {
    let best: Weapon | null = null;
    let bestCost = Infinity;
    for (const w of this.deps.groundWeapons()) {
      const cost = Math.abs(w.x - this.me.x) + Math.abs(w.y - this.me.y) * 1.5;
      if (cost < bestCost) {
        bestCost = cost;
        best = w;
      }
    }
    return best;
  }

  private move(d: number): void {
    // Weltrand: nicht hineinlaufen, stattdessen springen (Richtung umkehren)
    if ((this.me.x < EDGE && d === -1) || (this.me.x > GAME_WIDTH - EDGE && d === 1)) {
      this.state.up = true;
      this.state.left = d > 0;
      this.state.right = d < 0;
      return;
    }
    this.state.left = d < 0;
    this.state.right = d > 0;
  }
}
