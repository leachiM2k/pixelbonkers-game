import Phaser from 'phaser';
import { createGameConfig } from './game/config';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { BattleScene } from './scenes/BattleScene';

new Phaser.Game(
  createGameConfig([BootScene, MainMenuScene, BattleScene])
);
