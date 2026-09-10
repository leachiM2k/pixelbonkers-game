import { NetSession } from '../net/session';
import type { NetSessionFactoryLike } from './OnlineMenu';
import type { NetSession as NetSessionContract, NetStatus } from '../net/contract';

// NET-UI-Vertrag: createNetSessionFactory() ist die Default-Verdrahtung gegen
// NET-COREs src/net/session.ts (Konstruktor: new NetSession(role, roomCode);
// Status laeuft ueber session.onStatus, das den aktuellen Zustand sofort
// nachliefert). createPlaceholderNetFactory() + resolveNetFactory() sind der
// dokumentierte Offline-Fallback, falls session.ts wieder fehlt.

export function createNetSessionFactory(): NetSessionFactoryLike {
  return {
    host: (cb) => {
      const s = new NetSession('host');
      s.onStatus(cb);
      return s;
    },
    join: (code, cb) => {
      const s = new NetSession('guest', code);
      s.onStatus(cb);
      return s;
    },
  };
}

const SESSION_MODULE = ['..', '/net/', 'session'].join('');
const ROOM_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function hasFactoryShape(v: unknown): v is NetSessionFactoryLike {
  if (typeof v !== 'object' || v === null) return false;
  const f = v as Record<string, unknown>;
  return typeof f.host === 'function' && typeof f.join === 'function';
}

export function coerceNetFactory(mod: unknown): NetSessionFactoryLike | null {
  if (hasFactoryShape(mod)) return mod;
  if (typeof mod !== 'object' || mod === null) return null;
  const m = mod as Record<string, unknown>;
  if (hasFactoryShape(m.default)) return m.default;
  if (typeof m.createNetSessionFactory === 'function') {
    try {
      const made = (m.createNetSessionFactory as () => unknown)();
      if (hasFactoryShape(made)) return made;
    } catch {
      return null;
    }
  }
  if (typeof m.NetSessionFactory === 'function') {
    try {
      const made = new (m.NetSessionFactory as new () => unknown)();
      if (hasFactoryShape(made)) return made;
    } catch {
      return null;
    }
  }
  return null;
}

export async function resolveNetFactory(): Promise<NetSessionFactoryLike | null> {
  try {
    const mod: unknown = await import(/* @vite-ignore */ SESSION_MODULE);
    return coerceNetFactory(mod);
  } catch {
    return null;
  }
}

function makeRoomCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) code += ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)];
  return code;
}

function placeholderSession(
  role: 'host' | 'guest',
  cb: (s: NetStatus) => void,
  asHost: boolean,
): NetSessionContract {
  let current: NetStatus = { state: 'connecting', message: 'VERBINDE...' };
  const timers: number[] = [];
  const emit = (s: NetStatus): void => {
    current = s;
    cb(s);
  };
  timers.push(window.setTimeout(() => emit({ state: 'connecting', message: 'VERBINDE...' }), 120));
  if (asHost) {
    timers.push(window.setTimeout(() => emit({ state: 'hosting', roomCode: makeRoomCode() }), 900));
  } else {
    timers.push(
      window.setTimeout(() => emit({ state: 'error', message: 'SERVER NICHT ERREICHBAR' }), 2200),
    );
  }
  return {
    role,
    getStatus: () => current,
    onStatus: () => undefined,
    sendInput: () => undefined,
    sendSnapshot: () => undefined,
    onInput: () => undefined,
    onSnapshot: () => undefined,
    close: () => {
      for (const t of timers) clearTimeout(t);
    },
  };
}

export function createPlaceholderNetFactory(): NetSessionFactoryLike {
  return {
    host: (cb) => placeholderSession('host', cb, true),
    join: (_code, cb) => placeholderSession('guest', cb, false),
  };
}
