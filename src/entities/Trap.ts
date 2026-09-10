// CONTRACT: Trap = liegende Banane (keine Physik, Slip-Check per Distanz im WeaponSystem).
import Phaser from 'phaser';
import { isPngKey } from '../sprites/manifest';
import { weaponDisplayScale } from '../sprites/sheetScale';

export const BANANA_MAX_TRAPS = 3;

export class Trap extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const trapKey = 'wpnp_banana';
    super(scene, x, y, scene.textures.exists(trapKey) ? trapKey : 'wpn_banana');
    scene.add.existing(this);
    this.setScale(isPngKey(this.texture.key) ? weaponDisplayScale(this.height) : 2).setDepth(8);
    this.setAngle(Math.random() < 0.5 ? -16 : 16);
  }
}
