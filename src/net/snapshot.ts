// NET-CORE (src/net/snapshot.ts): Binaerer Snapshot-Codec, Host->Guest bei 20 Hz (~90-130 Bytes).
// Layout (little endian): [seq u8][flags u8][phase u8][center u8][timeLeftMs u32]
// + 2 Spieler je 11B: x i16, y i16, vx i16, vy i16, hp u8, meta u8(facing/dead/anim), heldW u8
// + weapons [n u8]+n*(id u8,x i16,y i16,age100ms u8) + projectiles [n u8]+n*(id u8,x i16,y i16,angle i16)
// + traps [n u8]+n*(x i16,y i16,angle i8). flags: bit0=paused, bits1-2=winner(0 none,1 P1,2 P2,3 draw).
import { WEAPON_IDS, WeaponId } from '../types';

export type NetPhase = 'countdown' | 'fight' | 'ko' | 'result';
export type NetAnim = 'idle' | 'walk' | 'jump' | 'fall' | 'duck' | 'attack' | 'throw' | 'hit' | 'ko' | 'victory';

const ANIMS: readonly NetAnim[] = ['idle', 'walk', 'jump', 'fall', 'duck', 'attack', 'throw', 'hit', 'ko', 'victory'];
const PHASES: readonly NetPhase[] = ['countdown', 'fight', 'ko', 'result'];
export const NET_CENTERS: readonly string[] = ['', '3', '2', '1', 'FIGHT!', 'K.O.!', 'TIME!'];

export interface NetPlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: -1 | 1;
  hp: number;
  anim: NetAnim;
  heldWeapon: WeaponId | null;
  dead: boolean;
}

export interface NetWeaponState {
  id: WeaponId;
  x: number;
  y: number;
  ageMs: number;
}

export interface NetProjectileState {
  id: WeaponId;
  x: number;
  y: number;
  angle: number;
}

export interface NetTrapState {
  x: number;
  y: number;
  angle: number;
}

export interface NetSnapshot {
  seq: number;
  players: [NetPlayerState, NetPlayerState];
  weapons: NetWeaponState[];
  projectiles: NetProjectileState[];
  traps: NetTrapState[];
  timeLeftMs: number;
  phase: NetPhase;
  paused: boolean;
  winner: 0 | 1 | -1 | null;
  center: string;
}

function clampI16(v: number): number {
  return Math.max(-32768, Math.min(32767, Math.round(v)));
}

function clampU8(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function weaponIdx(id: WeaponId): number {
  const i = WEAPON_IDS.indexOf(id);
  return i < 0 ? 0 : i;
}

function weaponByIdx(i: number): WeaponId {
  return WEAPON_IDS[i] ?? 'plunger';
}

export function encodeSnapshot(s: NetSnapshot): Uint8Array {
  const size =
    8 +
    2 * 11 +
    1 +
    s.weapons.length * 6 +
    1 +
    s.projectiles.length * 7 +
    1 +
    s.traps.length * 5;
  const buf = new ArrayBuffer(size);
  const v = new DataView(buf);
  let o = 0;
  const winnerBits = s.winner == null ? 0 : s.winner === -1 ? 3 : s.winner + 1;
  v.setUint8(o++, s.seq & 0xff);
  v.setUint8(o++, (s.paused ? 1 : 0) | ((winnerBits & 3) << 1));
  v.setUint8(o++, Math.max(0, PHASES.indexOf(s.phase)));
  v.setUint8(o++, Math.max(0, NET_CENTERS.indexOf(s.center)));
  v.setUint32(o, Math.max(0, Math.min(0xffffffff, Math.round(s.timeLeftMs))), true);
  o += 4;
  for (const p of s.players) {
    v.setInt16(o, clampI16(p.x), true);
    o += 2;
    v.setInt16(o, clampI16(p.y), true);
    o += 2;
    v.setInt16(o, clampI16(p.vx), true);
    o += 2;
    v.setInt16(o, clampI16(p.vy), true);
    o += 2;
    v.setUint8(o++, clampU8(p.hp));
    v.setUint8(o++, (p.facing === 1 ? 1 : 0) | ((p.dead ? 1 : 0) << 1) | ((ANIMS.indexOf(p.anim) & 15) << 2));
    v.setUint8(o++, p.heldWeapon ? weaponIdx(p.heldWeapon) + 1 : 0);
  }
  v.setUint8(o++, s.weapons.length);
  for (const w of s.weapons) {
    v.setUint8(o++, weaponIdx(w.id));
    v.setInt16(o, clampI16(w.x), true);
    o += 2;
    v.setInt16(o, clampI16(w.y), true);
    o += 2;
    v.setUint8(o++, clampU8(w.ageMs / 100));
  }
  v.setUint8(o++, s.projectiles.length);
  for (const pr of s.projectiles) {
    v.setUint8(o++, weaponIdx(pr.id));
    v.setInt16(o, clampI16(pr.x), true);
    o += 2;
    v.setInt16(o, clampI16(pr.y), true);
    o += 2;
    v.setInt16(o, clampI16(pr.angle), true);
    o += 2;
  }
  v.setUint8(o++, s.traps.length);
  for (const t of s.traps) {
    v.setInt16(o, clampI16(t.x), true);
    o += 2;
    v.setInt16(o, clampI16(t.y), true);
    o += 2;
    v.setInt8(o++, Math.max(-128, Math.min(127, Math.round(t.angle))));
  }
  return new Uint8Array(buf);
}

export function decodeSnapshot(b: Uint8Array): NetSnapshot | null {
  try {
    if (b.length < 32) return null;
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
    let o = 0;
    const seq = v.getUint8(o++);
    const flags = v.getUint8(o++);
    const phaseIdx = v.getUint8(o++);
    const centerIdx = v.getUint8(o++);
    const timeLeftMs = v.getUint32(o, true);
    o += 4;
    const players: NetPlayerState[] = [];
    for (let i = 0; i < 2; i++) {
      const x = v.getInt16(o, true);
      const y = v.getInt16(o + 2, true);
      const vx = v.getInt16(o + 4, true);
      const vy = v.getInt16(o + 6, true);
      const hp = v.getUint8(o + 8);
      const meta = v.getUint8(o + 9);
      const heldIdx = v.getUint8(o + 10);
      o += 11;
      players.push({
        x,
        y,
        vx,
        vy,
        facing: (meta & 1) === 1 ? 1 : -1,
        hp,
        anim: ANIMS[(meta >> 2) & 15] ?? 'idle',
        heldWeapon: heldIdx > 0 ? weaponByIdx(heldIdx - 1) : null,
        dead: ((meta >> 1) & 1) === 1,
      });
    }
    if (o + 1 > b.length) return null;
    const nw = v.getUint8(o++);
    const weapons: NetWeaponState[] = [];
    if (o + nw * 6 > b.length) return null;
    for (let i = 0; i < nw; i++) {
      weapons.push({
        id: weaponByIdx(v.getUint8(o)),
        x: v.getInt16(o + 1, true),
        y: v.getInt16(o + 3, true),
        ageMs: v.getUint8(o + 5) * 100,
      });
      o += 6;
    }
    if (o + 1 > b.length) return null;
    const np = v.getUint8(o++);
    const projectiles: NetProjectileState[] = [];
    if (o + np * 7 > b.length) return null;
    for (let i = 0; i < np; i++) {
      projectiles.push({
        id: weaponByIdx(v.getUint8(o)),
        x: v.getInt16(o + 1, true),
        y: v.getInt16(o + 3, true),
        angle: v.getInt16(o + 5, true),
      });
      o += 7;
    }
    if (o + 1 > b.length) return null;
    const nt = v.getUint8(o++);
    const traps: NetTrapState[] = [];
    if (o + nt * 5 > b.length) return null;
    for (let i = 0; i < nt; i++) {
      traps.push({ x: v.getInt16(o, true), y: v.getInt16(o + 2, true), angle: v.getInt8(o + 4) });
      o += 5;
    }
    const winnerBits = (flags >> 1) & 3;
    return {
      seq,
      players: [players[0], players[1]],
      weapons,
      projectiles,
      traps,
      timeLeftMs,
      phase: PHASES[phaseIdx] ?? 'countdown',
      paused: (flags & 1) === 1,
      winner: winnerBits === 0 ? null : winnerBits === 3 ? -1 : (winnerBits - 1) as 0 | 1,
      center: NET_CENTERS[centerIdx] ?? '',
    };
  } catch {
    return null;
  }
}
