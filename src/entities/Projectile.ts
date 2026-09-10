// CONTRACT: Projectile = geworfene Waffe mit individuellem Verhalten (WEAPONS.behavior).
// WeaponSystem ruft tick(delta) jedes Frame (false = entfernen), prueft Spieler-Treffer selbst
// und entfernt via removeCollider/destroy. hooks: onBounce (Gummihuhn-Bodenkontakt),
// onSettleWeapon (landet als liegende Weapon), onSettleTrap (Banane wird zur Falle).
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, GRAVITY, WEAPONS, WeaponDefinition, WeaponId } from '../types';
import { isPngKey } from '../sprites/manifest';
import { WEAPON_BODY, weaponDisplayScale } from '../sprites/sheetScale';

export interface ProjectileHooks {
  onBounce: (p: Projectile) => void;
  onSettleWeapon: (p: Projectile) => void;
  onSettleTrap: (p: Projectile) => void;
}

const MAX_AGE_MS = 9000;
const BOOMERANG_RETURN_MS = 500;

export class Projectile extends Phaser.Physics.Arcade.Image {
  readonly def: WeaponDefinition;
  readonly ownerIdx: 0 | 1;
  readonly hooks: ProjectileHooks;
  readonly hitPlayers = new Set<0 | 1>();
  age = 0;
  bouncesLeft = 3;
  returning = false;
  catchable = false;
  collider: Phaser.Physics.Arcade.Collider | null = null;
  private readonly owner: Phaser.Physics.Arcade.Sprite;
  private readonly spinPerSec: number;
  private wasBlockedDown = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    weaponId: WeaponId,
    ownerIdx: 0 | 1,
    owner: Phaser.Physics.Arcade.Sprite,
    platforms: Phaser.Physics.Arcade.StaticGroup,
    hooks: ProjectileHooks,
  ) {
    super(scene, x, y, `wpn_${weaponId}`);
    this.def = WEAPONS[weaponId];
    this.ownerIdx = ownerIdx;
    this.owner = owner;
    this.hooks = hooks;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(isPngKey(this.texture.key) ? weaponDisplayScale(this.height) : 2).setDepth(12);
    const body = this.arcadeBody;
    const pin = WEAPON_BODY[this.texture.key];
    if (pin) body.setSize(pin.w, pin.h, true);
    body.setBounce(this.def.bounces ? 0.55 : 0.2);
    body.setGravityY((this.def.projectileGravity ?? GRAVITY) - GRAVITY);
    this.collider = scene.physics.add.collider(this, platforms);
    this.spinPerSec =
      this.def.id === 'rubberChicken' ? 1500
      : this.def.behavior === 'boomerang' ? 1100
      : this.def.id === 'pillow' ? 220
      : 600;
  }

  get arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  tick(delta: number): boolean {
    const dt = delta / 1000;
    this.age += delta;
    this.setAngle(this.angle + this.spinPerSec * dt * (this.arcadeBody.velocity.x >= 0 ? 1 : -1));
    if (this.age >= MAX_AGE_MS) return false;
    if (this.x < -24 || this.x > GAME_WIDTH + 24 || this.y > GAME_HEIGHT + 24) return false;

    if (this.def.behavior === 'boomerang') {
      if (!this.returning && this.age >= BOOMERANG_RETURN_MS) {
        this.returning = true;
        this.catchable = true;
      }
      if (this.returning) {
        const dx = this.owner.x - this.x;
        this.arcadeBody.setVelocityX(Math.max(-270, Math.min(270, dx * 5)));
      }
    }
    if (this.def.behavior === 'wobbly') {
      this.arcadeBody.velocity.y += Math.sin(this.age * 0.012) * 850 * dt;
    }

    const body = this.arcadeBody;
    const down = body.blocked.down;
    if (this.def.bounces && down && !this.wasBlockedDown) {
      this.bouncesLeft -= 1;
      this.hooks.onBounce(this);
      if (this.bouncesLeft <= 0) body.setBounce(0);
    }
    this.wasBlockedDown = down;
    if (down && Math.abs(body.velocity.y) <= 40 && Math.abs(body.velocity.x) <= 40) {
      if (this.def.isTrap) this.hooks.onSettleTrap(this);
      else this.hooks.onSettleWeapon(this);
      return false;
    }
    return true;
  }
}
