import Phaser from 'phaser';
import { registerPixelSprites } from '../art/pixelToTexture';
import { allSprites, buildAnimations } from '../sprites';
import { PNG_SPRITE_KEYS, pngLoadedKeys } from '../sprites/manifest';
import { SpritePreviewScene } from '../sprites/__preview';
import { registerFontTextures } from '../ui/pixelText';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    for (const key of PNG_SPRITE_KEYS) {
      this.load.image(key, `assets/sprites/${key}.png`);
    }
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn(`[boot] PNG fehlt, Matrix-Fallback aktiv: ${file.key}`);
    });
  }

  create(): void {
    // PNG-Texturen: geladene Keys markieren + LINEAR-Filter (weiche Sheet-Optik)
    for (const key of PNG_SPRITE_KEYS) {
      if (this.textures.exists(key) && this.textures.get(key).source[0].image) {
        pngLoadedKeys.add(key);
        this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
    }
    // Matrix-Fallbacks nur fuer Keys OHNE PNG (keine Doppel-Registrierungs-Warnungen)
    registerPixelSprites(this, allSprites().filter((s) => !pngLoadedKeys.has(s.key)));
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
