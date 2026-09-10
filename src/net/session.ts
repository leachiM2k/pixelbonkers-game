// NET-CORE (src/net/session.ts): NetSession-Implementierung des Vertrags (contract.ts).
// Host = P1 simuliert autoritativ, Guest = P2 sendet Input (max 30/s, letzter Zustand gewinnt,
// pressed-Edges werden gelatcht) und empfegt Snapshots (Binary, Tag-Byte 0x01) vom Host.
// Server-URL: Query ?server= > localStorage 'pb-net-server' > NET_SERVER_URL_DEFAULT.
import { PlayerInput } from '../systems/input';
import type { NetSession as INetSession, NetState, NetStatus } from './contract';
import { NET_SERVER_URL_DEFAULT } from './contract';

const SNAPSHOT_TAG = 1;
const INPUT_FLUSH_MS = 33;
const MASK_LEFT = 1;
const MASK_RIGHT = 2;
const MASK_UP = 4;
const MASK_DOWN = 8;
const MASK_MELEE = 16;
const MASK_WEAPON = 32;
const MASK_SPECIAL = 64;

export function resolveServerUrl(): string {
  try {
    const q = new URLSearchParams(window.location.search).get('server');
    if (q) return q;
    const ls = window.localStorage.getItem('pb-net-server');
    if (ls) return ls;
  } catch {
    return NET_SERVER_URL_DEFAULT;
  }
  return NET_SERVER_URL_DEFAULT;
}

function decodeInput(h: number, p: number): PlayerInput {
  return {
    left: (h & MASK_LEFT) !== 0,
    right: (h & MASK_RIGHT) !== 0,
    up: (h & MASK_UP) !== 0,
    down: (h & MASK_DOWN) !== 0,
    melee: (h & MASK_MELEE) !== 0,
    weapon: (h & MASK_WEAPON) !== 0,
    special: (h & MASK_SPECIAL) !== 0,
    meleePressed: (p & 1) !== 0,
    weaponPressed: (p & 2) !== 0,
    specialPressed: (p & 4) !== 0,
  };
}

function heldEquals(a: PlayerInput, b: PlayerInput): boolean {
  return (
    a.left === b.left &&
    a.right === b.right &&
    a.up === b.up &&
    a.down === b.down &&
    a.melee === b.melee &&
    a.weapon === b.weapon &&
    a.special === b.special
  );
}

export class NetSession implements INetSession {
  readonly role: 'host' | 'guest';
  sentInputs = 0;
  sentSnapshots = 0;
  receivedInputs = 0;
  receivedSnapshots = 0;
  private roomCode: string;
  private ws: WebSocket | null = null;
  private status: NetStatus = { state: 'idle' };
  private statusCbs: ((s: NetStatus) => void)[] = [];
  private inputCbs: ((i: PlayerInput) => void)[] = [];
  private snapshotCbs: ((s: Uint8Array) => void)[] = [];
  private pending: PlayerInput | null = null;
  private lastSent: PlayerInput | null = null;
  private lastFlushAt = 0;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private closed = false;

  constructor(role: 'host' | 'guest', roomCode = '') {
    this.role = role;
    this.roomCode = roomCode.toUpperCase();
    this.connect();
  }

  getStatus(): NetStatus {
    return { ...this.status };
  }

  getRoomCode(): string {
    return this.roomCode;
  }

  onStatus(cb: (s: NetStatus) => void): void {
    this.statusCbs.push(cb);
    cb(this.getStatus());
  }

  onInput(cb: (input: PlayerInput) => void): void {
    this.inputCbs.push(cb);
  }

  onSnapshot(cb: (snap: Uint8Array) => void): void {
    this.snapshotCbs.push(cb);
  }

  sendInput(input: PlayerInput): void {
    if (this.role !== 'guest' || this.closed) return;
    if (!this.pending) {
      this.pending = { ...input };
    } else {
      const p = this.pending;
      p.left = input.left;
      p.right = input.right;
      p.up = input.up;
      p.down = input.down;
      p.melee = input.melee;
      p.weapon = input.weapon;
      p.special = input.special;
      p.meleePressed = p.meleePressed || input.meleePressed;
      p.weaponPressed = p.weaponPressed || input.weaponPressed;
      p.specialPressed = p.specialPressed || input.specialPressed;
    }
    this.flushInput();
  }

  sendSnapshot(snap: Uint8Array): void {
    if (this.role !== 'host' || this.closed || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (this.status.state !== 'connected') return;
    const frame = new Uint8Array(1 + snap.length);
    frame[0] = SNAPSHOT_TAG;
    frame.set(snap, 1);
    this.ws.send(frame.buffer);
    this.sentSnapshots++;
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ t: 'leave' }));
      } catch {
        /* egal */
      }
    }
    try {
      this.ws?.close();
    } catch {
      /* egal */
    }
    this.cleanupTimer();
    this.setStatus('closed');
  }

  private connect(): void {
    this.setStatus('connecting');
    let ws: WebSocket;
    try {
      ws = new WebSocket(resolveServerUrl());
    } catch {
      this.setStatus('error', 'invalid server url');
      return;
    }
    ws.binaryType = 'arraybuffer';
    this.ws = ws;
    ws.onopen = () => {
      if (this.closed) return;
      if (this.role === 'host') ws.send(JSON.stringify({ t: 'host' }));
      else ws.send(JSON.stringify({ t: 'join', room: this.roomCode }));
    };
    ws.onmessage = (ev: MessageEvent) => this.onMessage(ev);
    ws.onerror = () => {
      if (!this.closed) this.setStatus('error', 'connection failed');
    };
    ws.onclose = () => {
      if (!this.closed) this.setStatus('closed');
      this.cleanupTimer();
    };
    this.flushTimer = setInterval(() => this.flushInput(), 100);
  }

  private onMessage(ev: MessageEvent): void {
    if (typeof ev.data === 'string') {
      let m: { t?: string; room?: string; code?: string; d?: unknown };
      try {
        m = JSON.parse(ev.data);
      } catch {
        return;
      }
      switch (m.t) {
        case 'hosted':
          this.roomCode = m.room ?? this.roomCode;
          this.setStatus('hosting');
          break;
        case 'peerJoined':
          this.setStatus('connected');
          break;
        case 'joined':
          this.roomCode = m.room ?? this.roomCode;
          this.setStatus('connected');
          break;
        case 'error':
          this.setStatus('error', m.code ?? 'error');
          this.close();
          break;
        case 'peerLeft':
          this.setStatus('closed', 'peer left');
          break;
        case 'msg':
          this.onRelayMsg(m.d);
          break;
        default:
          break;
      }
      return;
    }
    const buf = ev.data as ArrayBuffer | null;
    if (!buf || buf.byteLength < 2) return;
    const bytes = new Uint8Array(buf);
    if (bytes[0] !== SNAPSHOT_TAG) return;
    this.receivedSnapshots++;
    const payload = bytes.subarray(1);
    for (const cb of this.snapshotCbs) cb(payload);
  }

  private onRelayMsg(d: unknown): void {
    const m = d as { k?: string; h?: number; p?: number } | null;
    if (!m || m.k !== 'i') return;
    const input = decodeInput(m.h ?? 0, m.p ?? 0);
    this.receivedInputs++;
    for (const cb of this.inputCbs) cb(input);
  }

  private flushInput(): void {
    const p = this.pending;
    if (!p || !this.ws || this.ws.readyState !== WebSocket.OPEN || this.closed) return;
    const now = performance.now();
    if (now - this.lastFlushAt < INPUT_FLUSH_MS) return;
    const hasPressed = p.meleePressed || p.weaponPressed || p.specialPressed;
    const active =
      p.left || p.right || p.up || p.down || p.melee || p.weapon || p.special;
    const heldChanged = !this.lastSent || !heldEquals(this.lastSent, p);
    if (!hasPressed && !heldChanged && !active) return;
    const h =
      (p.left ? MASK_LEFT : 0) |
      (p.right ? MASK_RIGHT : 0) |
      (p.up ? MASK_UP : 0) |
      (p.down ? MASK_DOWN : 0) |
      (p.melee ? MASK_MELEE : 0) |
      (p.weapon ? MASK_WEAPON : 0) |
      (p.special ? MASK_SPECIAL : 0);
    const pr =
      (p.meleePressed ? 1 : 0) | (p.weaponPressed ? 2 : 0) | (p.specialPressed ? 4 : 0);
    this.ws.send(JSON.stringify({ t: 'msg', d: { k: 'i', h, p: pr } }));
    this.sentInputs++;
    this.lastFlushAt = now;
    this.lastSent = { ...p };
    p.meleePressed = false;
    p.weaponPressed = false;
    p.specialPressed = false;
  }

  private cleanupTimer(): void {
    if (this.flushTimer !== null) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private setStatus(state: NetState, message?: string): void {
    this.status = { state, roomCode: this.roomCode || undefined, message };
    for (const cb of this.statusCbs) cb(this.status);
  }
}
