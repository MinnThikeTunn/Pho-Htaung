import Phaser from 'phaser';
import { audioDirector } from './audio/AudioDirector.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import IntroScene from './scenes/IntroScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import Chapter1Scene from './scenes/Chapter1Scene.js';
import Chapter2Scene from './scenes/Chapter2Scene.js';
import Chapter3Scene from './scenes/Chapter3Scene.js';
import Chapter4Scene from './scenes/Chapter4Scene.js';
import Chapter5Scene from './scenes/Chapter5Scene.js';
import RevealScene from './scenes/RevealScene.js';
import PauseScene from './scenes/PauseScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import VictoryScene from './scenes/VictoryScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#0c0a08',
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%',
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [
    BootScene,
    PreloadScene,
    IntroScene,
    MainMenuScene,
    Chapter1Scene,
    Chapter2Scene,
    Chapter3Scene,
    Chapter4Scene,
    Chapter5Scene,
    RevealScene,
    PauseScene,
    GameOverScene,
    VictoryScene
  ]
};

function bootGame() {
  window.__AUDIO_DIRECTOR__ = audioDirector;
  window.__GAME__ = new Phaser.Game(config);
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootGame);
} else {
  bootGame();
}
