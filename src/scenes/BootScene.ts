import Phaser from 'phaser';
import { registerPixelSprites } from '../art/pixelToTexture';
import { allSprites, buildAnimations } from '../sprites';
import { SpritePreviewScene } from '../sprites/__preview';
import { registerFontTextures } from '../ui/pixelText';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    // Alle Sprites einmalig in Texturen backen (Performance: danach reine GPU-Sprites)
    registerPixelSprites(this, allSprites());
    registerFontTextures(this);
    buildAnimations(this);
    // Dev-Vorschau aller Sprites via index.html?sprites=1
    if (typeof window !== 'undefined' && window.location.search.includes('sprites=1')) {
      this.scene.add('SpritePreviewScene', SpritePreviewScene, false);
      this.scene.start('SpritePreviewScene');
      return;
    }
    this.scene.start('MainMenuScene');
  }
}
