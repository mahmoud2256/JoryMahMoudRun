import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {

    preload() {

        this.load.image("bg", "assets/background.png");
        this.load.image("ground", "assets/ground.png");
        this.load.image("player", "assets/playerRun.png");
        this.load.image("coin", "assets/coin.png");
        this.load.image("bar", "assets/barTexture.png");
    }

    create() {
        this.scene.start("MenuScene");
    }
}