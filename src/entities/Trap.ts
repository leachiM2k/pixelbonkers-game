// CONTRACT: Trap = liegende Banane (keine Physik, Slip-Check per Distanz im WeaponSystem).
import Phaser from 'phaser';

export const BANANA_MAX_TRAPS = 3;

export class Trap extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'wpn_banana');
    scene.add.existing(this);
    this.setScale(2).setDepth(8);
    this.setAngle(Math.random() < 0.5 ? -16 : 16);
  }
}
