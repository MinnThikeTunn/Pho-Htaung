import Phaser from 'phaser';

export default class Chapter5Scene extends Phaser.Scene {
  constructor() {
    super('Chapter5Scene');
  }

  create(data) {
    this.scene.start('CHAPTER_5', data);
  }
}
