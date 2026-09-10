import Phaser from 'phaser';
import { createGameConfig } from './game/config';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { BattleScene } from './scenes/BattleScene';

const game = new Phaser.Game(
  createGameConfig([BootScene, MainMenuScene, BattleScene])
);
// Debug-Hook fuer E2E-Probes (wie __PB_STATE/__PB_WS in BattleScene)
(window as unknown as Record<string, unknown>).__PB_GAME = game;
