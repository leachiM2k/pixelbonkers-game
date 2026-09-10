// PIXEL BONKERS Relay-Server (NET-CORE).
// Raeume: {t:'host'} -> {t:'hosted',room} | {t:'join',room} -> {t:'joined'} + {t:'peerJoined'}
// Relay:  {t:'msg',d} an Gegenseite | Binary-Frames 1:1 | {t:'leave'} -> {t:'peerLeft'}
// Fehler: {t:'error',code:'roomNotFound'|'roomFull'} · max 8 Raeume · TTL 10 Min Inaktivitaet.
import { WebSocket, WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT || 8090);
const MAX_ROOMS = 8;
const ROOM_TTL_MS = 10 * 60 * 1000;
const HEARTBEAT_MS = 10000;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LEN = 4;

const wss = new WebSocketServer({ port: PORT });
const rooms = new Map();

function send(ws, obj) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

function newRoomCode() {
  for (let i = 0; i < 64; i++) {
    let code = '';
    for (let j = 0; j < CODE_LEN; j++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    if (!rooms.has(code)) return code;
  }
  return null;
}

function peerOf(ws) {
  const room = ws.__room ? rooms.get(ws.__room) : null;
  if (!room) return null;
  if (ws === room.host) return room.guest;
  if (ws === room.guest) return room.host;
  return null;
}

function leaveRoom(ws, notify = true) {
  const code = ws.__room;
  if (!code) return;
  const room = rooms.get(code);
  ws.__room = null;
  if (!room) return;
  const peer = ws === room.host ? room.guest : ws === room.guest ? room.host : null;
  if (ws === room.host) {
    rooms.delete(code);
  } else if (ws === room.guest) {
    room.guest = null;
    room.lastActive = Date.now();
  }
  if (notify && peer) send(peer, { t: 'peerLeft' });
}

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.__room = null;
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  ws.on('message', (data, isBinary) => {
    ws.isAlive = true;
    const room = ws.__room ? rooms.get(ws.__room) : null;
    if (room) room.lastActive = Date.now();
    if (isBinary) {
      const peer = peerOf(ws);
      if (peer && peer.readyState === WebSocket.OPEN) peer.send(data, { binary: true });
      return;
    }
    let msg = null;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }
    if (!msg || typeof msg !== 'object') return;
    if (msg.t === 'host') {
      leaveRoom(ws, true);
      if (rooms.size >= MAX_ROOMS) {
        send(ws, { t: 'error', code: 'roomFull' });
        return;
      }
      const code = newRoomCode();
      if (!code) {
        send(ws, { t: 'error', code: 'roomFull' });
        return;
      }
      rooms.set(code, { host: ws, guest: null, lastActive: Date.now() });
      ws.__room = code;
      send(ws, { t: 'hosted', room: code });
      return;
    }
    if (msg.t === 'join') {
      const code = String(msg.room ?? '').toUpperCase();
      const room = rooms.get(code);
      if (!room) {
        send(ws, { t: 'error', code: 'roomNotFound' });
        return;
      }
      if (room.guest) {
        send(ws, { t: 'error', code: 'roomFull' });
        return;
      }
      if (ws.__room) leaveRoom(ws, false);
      room.guest = ws;
      room.lastActive = Date.now();
      ws.__room = code;
      send(ws, { t: 'joined', room: code });
      send(room.host, { t: 'peerJoined', room: code });
      return;
    }
    if (msg.t === 'leave') {
      leaveRoom(ws, true);
      return;
    }
    if (msg.t === 'msg') {
      const peer = peerOf(ws);
      if (peer && peer.readyState === WebSocket.OPEN) {
        peer.send(JSON.stringify({ t: 'msg', d: msg.d }));
      }
    }
  });
  ws.on('close', () => leaveRoom(ws, true));
  ws.on('error', () => leaveRoom(ws, true));
});

setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    ws.ping();
  }
}, HEARTBEAT_MS);

setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.lastActive <= ROOM_TTL_MS) continue;
    rooms.delete(code);
    for (const member of [room.host, room.guest]) {
      if (!member) continue;
      if (member.__room === code) member.__room = null;
      send(member, { t: 'peerLeft' });
      member.terminate();
    }
  }
}, 30000);

console.log(`pixel-bonkers relay listening on ws://localhost:${PORT} (max ${MAX_ROOMS} rooms, ttl 10min)`);
