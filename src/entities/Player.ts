// CONTRACT (fuer COMBAT): Player(scene, x, y, idx) — x = Bildmitte, y = FUSSposition (origin 0.5/1, scale 2).
// update(input) JEDES Frame nach InputSystem.update()+get() aufrufen. hp<=0 -> isDead=true setzen und selbst
// safePlayAnim(player, prefix+'_ko', prefix+'_ko') spielen; Player.update friert danach nur die X-Velocity ein.
// safePlayAnim(sprite, animKey, textureFallbackPrefix) ist exportiert und fail-safe (kein Crash ohne Assets).
// PLAYER_BODY_W/H + DUCK_BODY_H sind WELT-Einheiten (384x216); setSize bekommt intern /scale, ist also
// unabhaengig von setScale. Body bleibt immer fuss- und mittenzentriert ausgerichtet.

import Phaser from 'phaser';
import { WeaponId, PLAYER1_SKIN, PLAYER2_SKIN } from '../types';
import { PlayerInput } from '../systems/input';

export const MOVE_SPEED = 120;
export const DUCK_SPEED_FACTOR = 0.6;
export const JUMP_VELOCITY = 365;
export const PLAYER_BODY_W = 16;
export const PLAYER_BODY_H = 48;
export const DUCK_BODY_H = 24;
export const PLAYER_MAX_HP = 100;

export function safePlayAnim(sprite: Phaser.GameObjects.Sprite, animKey: string, textureFallbackPrefix: string): void {
  const scene = sprite.scene;
  if (!scene) return;
  if (scene.anims.exists(animKey)) {
    sprite.play(animKey, true);
    return;
  }
  const fallback = textureFallbackPrefix + '_0';
  if (scene.textures.exists(fallback)) {
    if (sprite.anims.isPlaying) sprite.anims.stop();
    if (sprite.texture.key !== fallback) sprite.setTexture(fallback);
  }
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  readonly idx: 0 | 1;
  facing: -1 | 1;
  hp: number;
  isDead: boolean;
  heldWeapon: WeaponId | null;
  isDucking: boolean;
  private readonly prefix: string;

  constructor(scene: Phaser.Scene, x: number, y: number, idx: 0 | 1) {
    const skin = idx === 0 ? PLAYER1_SKIN : PLAYER2_SKIN;
    const startTex = skin.prefix + '_idle_0';
    super(scene, x, y, startTex);
    this.idx = idx;
    this.prefix = skin.prefix;
    this.facing = idx === 0 ? 1 : -1;
    this.hp = PLAYER_MAX_HP;
    this.isDead = false;
    this.heldWeapon = null;
    this.isDucking = false;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setScale(2);
    this.setCollideWorldBounds(true);
    this.setFlipX(this.facing === -1);
    this.applyBodyShape(PLAYER_BODY_H);
  }

  get arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  update(input: PlayerInput): void {
    if (this.isDead) {
      this.setVelocityX(0);
      return;
    }
    const body = this.arcadeBody;
    const onGround = body.blocked.down;
    if (input.left && !input.right) this.facing = -1;
    else if (input.right && !input.left) this.facing = 1;
    this.setFlipX(this.facing === -1);
    this.isDucking = input.down && onGround;
    const speed = MOVE_SPEED * (this.isDucking ? DUCK_SPEED_FACTOR : 1);
    let vx = 0;
    if (input.left) vx -= speed;
    if (input.right) vx += speed;
    this.setVelocityX(vx);
    if (input.up && onGround && !this.isDucking) {
      this.setVelocityY(-JUMP_VELOCITY);
    }
    this.applyBodyShape(this.isDucking ? DUCK_BODY_H : PLAYER_BODY_H);
    this.updateVisualState(onGround);
  }

  private applyBodyShape(height: number): void {
    const body = this.arcadeBody;
    const sw = PLAYER_BODY_W / Math.max(this.scaleX, 0.0001);
    const sh = height / Math.max(this.scaleY, 0.0001);
    body.setSize(sw, sh, false);
    body.setOffset(this.frame.width / 2 - sw / 2, this.frame.height - sh);
  }

  private updateVisualState(onGround: boolean): void {
    if (!onGround) {
      this.setStaticFrame(this.arcadeBody.velocity.y < 0 ? 'jump_0' : 'fall_0');
      return;
    }
    if (this.isDucking) {
      this.setStaticFrame('duck_0');
      return;
    }
    if (this.arcadeBody.velocity.x !== 0) {
      safePlayAnim(this, this.prefix + '_walk', this.prefix + '_walk');
      return;
    }
    safePlayAnim(this, this.prefix + '_idle', this.prefix + '_idle');
  }

  private setStaticFrame(frameSuffix: string): void {
    const key = this.prefix + '_' + frameSuffix;
    if (!this.scene.textures.exists(key)) return;
    if (this.anims.isPlaying) this.anims.stop();
    if (this.texture.key !== key) this.setTexture(key);
  }
}
