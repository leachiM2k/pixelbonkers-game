// POWER-UPS: Bonus-Items (Herz/Speed/Schild) sinken periodisch vom Himmel,
// landen auf Boden/Plattform und werden bei Beruehrung sofort aktiviert.
//   heart  : +25 HP (bis Maximum)
//   speed  : 1.45x Tempo fuer 8s
//   shield : 5s unverwundbar (Aura-Ring, blinkt vor Ablauf)
// Items despawnen nach 10s (letzte 2s Blinken). ?pu=<ms> setzt das
// Spawn-Intervall fuer E2E-Tests.

import Phaser from 'phaser';
import { GAME_WIDTH } from '../types';
import { PLAYER_MAX_HP } from '../entities/Player';
import type { Player } from '../entities/Player';
import type { FxSystem } from './fx';
import type { AudioSystem } from './audio';
import type { Hud } from '../ui/hud';

export type PowerUpKind = 'heart' | 'speed' | 'shield';

const KINDS: PowerUpKind[] = ['heart', 'speed', 'shield'];
const LIFETIME_MS = 10000;
const BLINK_FROM = 8000;
const HEAL = 25;
const SPEED_MS = 8000;
const SHIELD_MS = 5000;
const COLLECT_DX = 14;
const COLLECT_DY = 22;

interface PowerUpItem {
  kind: PowerUpKind;
  img: Phaser.Physics.Arcade.Image;
  age: number;
}

export class PowerUpSystem {
  private readonly scene: Phaser.Scene;
  private readonly players: Player[];
  private readonly platforms: Phaser.Physics.Arcade.StaticGroup;
  private readonly fx: FxSystem;
  private readonly audio: AudioSystem;
  private readonly hud: Hud;
  private items: PowerUpItem[] = [];
  private spawnInMs = 6000;
  private spawnInterval = 12000;
  private forcedCycle = false;
  private spawnCount = 0;
  private shieldAuras = new Map<number, Phaser.GameObjects.Arc>();

  constructor(
    scene: Phaser.Scene,
    players: Player[],
    platforms: Phaser.Physics.Arcade.StaticGroup,
    fx: FxSystem,
    audio: AudioSystem,
    hud: Hud,
  ) {
    this.scene = scene;
    this.players = players;
    this.platforms = platforms;
    this.fx = fx;
    this.audio = audio;
    this.hud = hud;
    const q = typeof window !== 'undefined' ? window.location.search : '';
    const forced = q.match(/pu=(\d+)/);
    this.spawnInterval = forced ? Number(forced[1]) : 12000;
    this.forcedCycle = !!forced;
    this.buildTextures();
  }


  private buildTextures(): void {
    if (this.scene.textures.exists('pu_speed')) return;
    const bolt = this.scene.add.graphics();
    bolt.fillStyle(0xf8d848);
    bolt.fillPoints(
      [
        { x: 8, y: 0 }, { x: 2, y: 8 }, { x: 6, y: 8 },
        { x: 4, y: 16 }, { x: 12, y: 7 }, { x: 7, y: 7 },
      ],
      true,
    );
    bolt.generateTexture('pu_speed', 14, 16);
    bolt.destroy();
    const shield = this.scene.add.graphics();
    shield.fillStyle(0x7dd3fc);
    shield.fillPoints(
      [
        { x: 7, y: 0 }, { x: 14, y: 3 }, { x: 14, y: 9 },
        { x: 7, y: 16 }, { x: 0, y: 9 }, { x: 0, y: 3 },
      ],
      true,
    );
    shield.lineStyle(1, 0x1a1c2c);
    shield.strokePoints(
      [
        { x: 7, y: 0 }, { x: 14, y: 3 }, { x: 14, y: 9 },
        { x: 7, y: 16 }, { x: 0, y: 9 }, { x: 0, y: 3 },
      ],
      true,
    );
    shield.generateTexture('pu_shield', 15, 17);
    shield.destroy();
  }

  update(delta: number): void {
    this.spawnInMs -= delta;
    if (this.spawnInMs <= 0) {
      this.spawn();
      // erzwungenes Test-Intervall (?pu=) bleibt deterministisch
      this.spawnInMs = this.spawnInterval + (this.spawnInterval >= 12000 ? Math.random() * 6000 : 0);
    }

    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.age += delta;
      if (it.age > LIFETIME_MS) {
        this.destroyItem(i);
        continue;
      }
      it.img.setAlpha(it.age > BLINK_FROM && Math.floor(it.age / 200) % 2 === 0 ? 0.25 : 1);
      for (const p of this.players) {
        if (p.isDead) continue;
        if (Math.abs(p.x - it.img.x) <= COLLECT_DX && Math.abs(p.y - it.img.y) <= COLLECT_DY) {
          this.collect(p, it.kind);
          this.destroyItem(i);
          break;
        }
      }
    }

    this.updateShieldAuras();
  }

  get debug(): Array<{ kind: PowerUpKind; x: number; y: number }> {
    return this.items.map((it) => ({ kind: it.kind, x: Math.round(it.img.x), y: Math.round(it.img.y) }));
  }

  private spawn(): void {
    if (this.items.length >= 1) return;
    const kind = this.forcedCycle
      ? KINDS[this.spawnCount++ % KINDS.length]
      : KINDS[Math.floor(Math.random() * KINDS.length)];
    const tex = kind === 'heart' ? 'hud_heart' : kind === 'speed' ? 'pu_speed' : 'pu_shield';
    const img = this.scene.physics.add.image(30 + Math.random() * (GAME_WIDTH - 60), -12, tex);
    img.setDepth(9);
    if (kind === 'heart') img.setScale(0.5); // hud_heart ist 2x-Quelle
    const body = img.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(28);
    body.setGravityY(60);
    body.setBounce(0);
    this.scene.physics.add.collider(img, this.platforms);
    this.items.push({ kind, img, age: 0 });
  }

  private collect(player: Player, kind: PowerUpKind): void {
    const now = this.scene.time.now;
    this.audio.play('pickup');
    if (kind === 'heart') {
      player.hp = Math.min(PLAYER_MAX_HP, player.hp + HEAL);
      this.hud.updateHp(player.idx, player.hp);
      this.fx.puffCloud(player.x, player.y - 20);
    } else if (kind === 'speed') {
      player.speedBoostUntil = now + SPEED_MS;
      this.fx.puffCloud(player.x, player.y - 20);
    } else {
      player.shieldUntil = now + SHIELD_MS;
    }
  }

  private updateShieldAuras(): void {
    const now = this.scene.time.now;
    for (const p of this.players) {
      const active = now < p.shieldUntil;
      let aura = this.shieldAuras.get(p.idx);
      if (!active) {
        if (aura) {
          aura.destroy();
          this.shieldAuras.delete(p.idx);
        }
        continue;
      }
      if (!aura) {
        aura = this.scene.add.arc(p.x, p.y - 2, 26);
        aura.setStrokeStyle(2, 0x7dd3fc, 1);
        aura.setDepth(9);
        aura.isStroked = true;
        aura.setFillStyle(0x000000, 0);
        this.shieldAuras.set(p.idx, aura);
      }
      const remain = p.shieldUntil - now;
      aura.setPosition(p.x, p.y - 2);
      aura.setAlpha(remain < 1500 && Math.floor(now / 200) % 2 === 0 ? 0.25 : 1);
    }
  }

  private destroyItem(i: number): void {
    const it = this.items[i];
    it.img.destroy();
    this.items.splice(i, 1);
  }
}
