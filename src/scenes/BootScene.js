import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {

    preload() {
        this.load.image("background", "assets/background.png");
        this.load.image("ground", "assets/ground.png");
        this.load.image("playerRun", "assets/playerRun.png");
    }

    create() {
        this.scene.start("MenuScene");
    }
}