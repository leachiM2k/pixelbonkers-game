import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY } from '../types';

export function createGameConfig(sceneClasses: Phaser.Types.Scenes.SceneType[]): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: 'game',
    // Backing-Store 768x432 (doppelte Aufloesung); die Kamera zeigt per Zoom 2
    // die unveraenderte 384x216-Welt - alle Logik-/Weltkoordinaten bleiben gleich.
    width: GAME_WIDTH * 2,
    height: GAME_HEIGHT * 2,
    backgroundColor: '#5c94ec',
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: GRAVITY },
        debug: false,
      },
    },
    scene: sceneClasses,
  };
}
