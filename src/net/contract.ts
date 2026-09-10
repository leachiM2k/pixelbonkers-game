// NETZWERK-KONTRAKT (NET-CORE implementiert src/net/* gegen dieses Interface;
// NET-UI und BattleScene konsumieren ausschliesslich diese Typen).
import { PlayerInput } from '../systems/input';

export type NetMode = 'local' | 'host' | 'guest';

export interface NetBattleConfig {
  mode: NetMode;
  roomCode?: string;
}

export type NetState = 'idle' | 'hosting' | 'connecting' | 'connected' | 'error' | 'closed';

export interface NetStatus {
  state: NetState;
  roomCode?: string;
  message?: string;
}

export interface NetSession {
  readonly role: 'host' | 'guest';
  getStatus(): NetStatus;
  onStatus(cb: (s: NetStatus) => void): void;
  sendInput(input: PlayerInput): void;
  sendSnapshot(snap: Uint8Array): void;
  onInput(cb: (input: PlayerInput) => void): void;
  onSnapshot(cb: (snap: Uint8Array) => void): void;
  close(): void;
}

export const NET_SERVER_URL_DEFAULT = 'ws://localhost:8090';
