// CONTRACT (COMBAT -> BattleScene):
// export class WeaponSystem { constructor(scene, players, platforms: StaticGroup, fx, audio, hud, combat)
//   update(delta) — jedes Frame im Kampf (Spawner, Lifetime, Prompts, Projektile, Fallen)
//   spawnInitialWeapon() — Startwaffe in der Arenamitte beim Fight-Start
//   tryPickup(player), throwWeapon(player), dropWeapon(player)
//   isBusy(player) — Wurf-Animation blockiert Spieler-Update
// Events: EV.WEAPON_PICKUP, EV.WEAPON_THROW, EV.WEAPON_LANDED
import Phaser from 'phaser';
import { EV, GAME_WIDTH, WEAPON_IDS, WEAPONS, WeaponId } from '../types';
import { isPngKey } from '../sprites/manifest';
import { Player, safePlayAnim } from '../entities/Player';
import {
  Weapon,
  WEAPON_MAX_ON_FIELD,
  WEAPON_PICKUP_DIST,
  WEAPON_PICKUP_DY,
} from '../entities/Weapon';
import { Projectile } from '../entities/Projectile';
import { Trap, BANANA_MAX_TRAPS } from '../entities/Trap';
import { FxSystem } from './fx';
import { AudioSystem } from './audio';
import { Hud } from '../ui/hud';
import { CombatSystem, WEAPON_WORD_COLORS } from './combat';

const SPAWN_MIN_MS = 5000;
const SPAWN_VAR_MS = 5000;
const SPAWN_MIN_PLAYER_DIST = 40;
const SPAWN_MIN_WEAPON_DIST = 26;
const THROW_ANIM_MS = 240;

interface HasArcadeBody {
  arcadeBody: Phaser.Physics.Arcade.Body;
  x: number;
  y: number;
}

function bodyRect(go: HasArcadeBody): Phaser.Geom.Rectangle {
  const b = go.arcadeBody;
  if (!b) return new Phaser.Geom.Rectangle(go.x ?? 0, go.y ?? 0, 0, 0);
  return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
}

export class WeaponSystem {
  private readonly scene: Phaser.Scene;
  private readonly players: [Player, Player];
  private readonly platforms: Phaser.Physics.Arcade.StaticGroup;
  private readonly fx: FxSystem;
  private readonly audio: AudioSystem;
  private readonly hud: Hud;
  private readonly combat: CombatSystem;
  private weapons: Weapon[] = [];
  private traps: Trap[] = [];
  private projectiles: Projectile[] = [];
  private heldImages: [Phaser.GameObjects.Image | null, Phaser.GameObjects.Image | null] = [null, null];
  private promptShown: [boolean, boolean] = [false, false];
  private throwBusyUntil: [number, number] = [0, 0];
  private spawnInMs = 3000;

  constructor(
    scene: Phaser.Scene,
    players: [Player, Player],
    platforms: Phaser.Physics.Arcade.StaticGroup,
    fx: FxSystem,
    audio: AudioSystem,
    hud: Hud,
    combat: CombatSystem,
  ) {
    this.scene = scene;
    this.players = players;
    this.platforms = platforms;
    this.fx = fx;
    this.audio = audio;
    this.hud = hud;
    this.combat = combat;
  }

  get groundWeapons(): readonly Weapon[] {
    return this.weapons;
  }

  get activeProjectiles(): readonly Projectile[] {
    return this.projectiles;
  }

  get activeTraps(): readonly Trap[] {
    return this.traps;
  }

  isBusy(player: Player): boolean {
    return this.scene.time.now < this.throwBusyUntil[player.idx];
  }

  spawnInitialWeapon(): void {
    this.spawnAt(GAME_WIDTH / 2, -14, this.randomWeaponId());
  }

  update(delta: number): void {
    this.spawnInMs -= delta;
    if (this.spawnInMs <= 0) {
      this.spawnRandomWeapon();
      this.spawnInMs = SPAWN_MIN_MS + Math.random() * SPAWN_VAR_MS;
    }
    for (let i = this.weapons.length - 1; i >= 0; i--) {
      const w = this.weapons[i];
      if (!w.landed && w.arcadeBody.blocked.down) {
        w.landed = true;
        this.audio.play('land');
        this.scene.events.emit(EV.WEAPON_LANDED, w.weaponId, w.x, w.y);
      }
      if (!w.tick(delta)) this.removeWeaponAt(i);
    }
    this.updatePrompts();
    this.updateHeldImages();
    this.updateProjectiles(delta);
    this.updateTraps();
  }

  tryPickup(player: Player): void {
    const w = this.findNearWeapon(player);
    if (!w) return;
    const id = w.weaponId;
    player.heldWeapon = id;
    this.audio.play('pickup');
    this.scene.events.emit(EV.WEAPON_PICKUP, player.idx, id);
    this.removeWeaponAt(this.weapons.indexOf(w));
    this.heldImages[player.idx] = this.scene.add
      .image(player.x, player.y - 30, `wpn_${id}`)
      .setScale(isPngKey(`wpn_${id}`) ? 1 : 2)
      .setDepth(11);
    this.hidePrompt(player.idx);
  }

  throwWeapon(player: Player): void {
    const id = player.heldWeapon;
    if (!id || this.combat.isBusy(player) || this.isBusy(player)) return;
    player.heldWeapon = null;
    this.destroyHeldImage(player.idx);
    this.audio.play('throw');
    this.scene.events.emit(EV.WEAPON_THROW, player.idx, id);
    this.throwBusyUntil[player.idx] = this.scene.time.now + THROW_ANIM_MS;
    const prefix = player.idx === 0 ? 'boy1' : 'boy2';
    safePlayAnim(player, prefix + '_throw', prefix + '_throw');
    const def = WEAPONS[id];
    const proj = new Projectile(
      this.scene,
      player.x + player.facing * 10,
      player.y - 30,
      id,
      player.idx,
      player,
      this.platforms,
      {
        onBounce: () => this.audio.play('squeak'),
        onSettleWeapon: (p) => this.spawnAt(p.x, p.y, p.def.id),
        onSettleTrap: (p) => this.addTrap(new Trap(this.scene, p.x, p.y + 4)),
      },
    );
    proj.setVelocity(player.facing * (def.projectileSpeed ?? 150), def.behavior === 'boomerang' ? -70 : -50);
    this.projectiles.push(proj);
  }

  dropWeapon(player: Player): void {
    const id = player.heldWeapon;
    if (!id) return;
    player.heldWeapon = null;
    this.destroyHeldImage(player.idx);
    const w = this.spawnAt(player.x, player.y - 26, id);
    w.arcadeBody.setVelocity(-player.facing * 90, -180);
  }

  private spawnRandomWeapon(): void {
    if (this.weapons.length >= WEAPON_MAX_ON_FIELD) return;
    let x = GAME_WIDTH / 2;
    for (let a = 0; a < 14; a++) {
      x = 24 + Math.random() * (GAME_WIDTH - 48);
      const ok =
        this.players.every((p) => Math.abs(x - p.x) >= SPAWN_MIN_PLAYER_DIST) &&
        this.weapons.every((w) => Math.abs(x - w.x) >= SPAWN_MIN_WEAPON_DIST);
      if (ok) break;
    }
    this.spawnAt(x, -14, this.randomWeaponId());
  }

  private spawnAt(x: number, y: number, id: WeaponId): Weapon {
    const w = new Weapon(this.scene, x, y, id);
    w.collider = this.scene.physics.add.collider(w, this.platforms);
    this.weapons.push(w);
    return w;
  }

  private randomWeaponId(): WeaponId {
    return WEAPON_IDS[Math.floor(Math.random() * WEAPON_IDS.length)];
  }

  private removeWeaponAt(i: number): void {
    const w = this.weapons[i];
    if (w.collider) this.scene.physics.world.removeCollider(w.collider);
    w.destroy();
    this.weapons.splice(i, 1);
  }

  private removeProjectileAt(i: number): void {
    const p = this.projectiles[i];
    if (p.collider) this.scene.physics.world.removeCollider(p.collider);
    p.destroy();
    this.projectiles.splice(i, 1);
  }

  private addTrap(trap: Trap): void {
    this.traps.push(trap);
    if (this.traps.length > BANANA_MAX_TRAPS) {
      this.traps.shift()?.destroy();
    }
  }

  private findNearWeapon(player: Player): Weapon | null {
    if (player.heldWeapon || this.combat.isBusy(player)) return null;
    let best: Weapon | null = null;
    let bestDx = WEAPON_PICKUP_DIST;
    for (const w of this.weapons) {
      if (!w.landed) continue;
      const dx = Math.abs(w.x - player.x);
      const dy = Math.abs(w.y - player.y);
      if (dx <= bestDx && dy <= WEAPON_PICKUP_DY) {
        best = w;
        bestDx = dx;
      }
    }
    return best;
  }

  private updatePrompts(): void {
    for (const idx of [0, 1] as const) {
      const near = this.findNearWeapon(this.players[idx]);
      if (near && !this.promptShown[idx]) {
        this.hud.showPickupPrompt(idx, idx === 0 ? 'PRESS G' : 'PRESS U');
        this.promptShown[idx] = true;
      } else if (!near && this.promptShown[idx]) {
        this.hidePrompt(idx);
      }
    }
  }

  private hidePrompt(idx: 0 | 1): void {
    this.hud.hidePickupPrompt(idx);
    this.promptShown[idx] = false;
  }

  private destroyHeldImage(idx: 0 | 1): void {
    this.heldImages[idx]?.destroy();
    this.heldImages[idx] = null;
  }

  private updateHeldImages(): void {
    for (const idx of [0, 1] as const) {
      const img = this.heldImages[idx];
      const p = this.players[idx];
      if (!img) continue;
      if (!p.heldWeapon) {
        this.destroyHeldImage(idx);
        continue;
      }
      img.setPosition(p.x + p.facing * 9, p.y - 30);
      img.setFlipX(p.facing === -1);
    }
  }

  private updateProjectiles(delta: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      if (!pr.tick(delta)) {
        this.removeProjectileAt(i);
        continue;
      }
      this.checkProjectileHits(i, pr);
    }
  }

  private checkProjectileHits(i: number, pr: Projectile): void {
    for (const pl of this.players) {
      if (pl.idx === pr.ownerIdx) {
        if (
          pr.catchable &&
          !pl.heldWeapon &&
          !this.combat.isBusy(pl) &&
          Phaser.Geom.Intersects.RectangleToRectangle(bodyRect(pl), bodyRect(pr))
        ) {
          pl.heldWeapon = pr.def.id;
          this.audio.play('pickup');
          this.scene.events.emit(EV.WEAPON_PICKUP, pl.idx, pr.def.id);
          this.heldImages[pl.idx] = this.scene.add
            .image(pl.x, pl.y - 30, `wpn_${pr.def.id}`)
            .setScale(isPngKey(`wpn_${pr.def.id}`) ? 1 : 2)
            .setDepth(11);
          this.removeProjectileAt(i);
          break;
        }
        continue;
      }
      if (pl.isDead || pr.hitPlayers.has(pl.idx)) continue;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(bodyRect(pl), bodyRect(pr))) continue;
      pr.hitPlayers.add(pl.idx);
      const def = pr.def;
      this.combat.applyHit(pl, {
        damage: def.damage,
        knockback: def.knockback,
        hitWord: def.hitWord,
        sourceX: pr.x,
        weaponId: def.id,
        wordColor: WEAPON_WORD_COLORS[def.id],
      });
      if (def.behavior === 'explosive') this.fx.hitBurst(pr.x, pr.y, 1);
      if (def.id === 'rubberChicken') {
        const w = this.spawnAt(pr.x, pr.y - 6, def.id);
        w.arcadeBody.setVelocity((pl.x >= pr.x ? -1 : 1) * 90, -160);
        this.removeProjectileAt(i);
      } else if (def.behavior === 'boomerang') {
        pr.returning = true;
        pr.catchable = true;
      } else {
        this.removeProjectileAt(i);
      }
      break;
    }
  }

  private updateTraps(): void {
    for (let i = this.traps.length - 1; i >= 0; i--) {
      const trap = this.traps[i];
      for (const pl of this.players) {
        if (pl.isDead || !pl.arcadeBody.blocked.down || this.combat.isBusy(pl)) continue;
        if (Math.abs(pl.x - trap.x) < 13 && Math.abs(pl.y - trap.y) < 34) {
          this.combat.applySlip(pl);
          trap.destroy();
          this.traps.splice(i, 1);
          break;
        }
      }
    }
  }
}
