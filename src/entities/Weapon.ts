// CONTRACT: Weapon = liegende Waffe (Physik-Image 'wpn_<id>'), Pickup per WeaponSystem-Distanzcheck.
// collider-Feld wird vom WeaponSystem gesetzt und vor destroy entfernt.
import Phaser from 'phaser';
import { GAME_HEIGHT, WeaponId } from '../types';
import { isPngKey } from '../sprites/manifest';
import { WEAPON_BODY, weaponDisplayScale } from '../sprites/sheetScale';

export const WEAPON_LIFETIME_MS = 12000;
export const WEAPON_BLINK_MS = 2000;
export const WEAPON_MAX_ON_FIELD = 4;
export const WEAPON_PICKUP_DIST = 18;
export const WEAPON_PICKUP_DY = 44;

export class Weapon extends Phaser.Physics.Arcade.Image {
  readonly weaponId: WeaponId;
  age = 0;
  landed = false;
  collider: Phaser.Physics.Arcade.Collider | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, weaponId: WeaponId) {
    super(scene, x, y, `wpn_${weaponId}`);
    this.weaponId = weaponId;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(isPngKey(this.texture.key) ? weaponDisplayScale(this.height) : 2).setDepth(11);
    const pin = WEAPON_BODY[this.texture.key];
    if (pin) this.arcadeBody.setSize(pin.w, pin.h, true);
    this.arcadeBody.setBounce(0.3);
    this.arcadeBody.setDragX(150);
  }

  get arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  tick(delta: number): boolean {
    this.age += delta;
    if (this.age >= WEAPON_LIFETIME_MS) return false;
    if (this.y > GAME_HEIGHT + 24) return false;
    if (WEAPON_LIFETIME_MS - this.age <= WEAPON_BLINK_MS) {
      this.setAlpha(Math.floor(this.age / 130) % 2 === 0 ? 1 : 0.3);
    }
    return true;
  }
}
