import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {

    preload() {

        // Images فقط (ممنوع spritesheet عشان ما يبوظش)
        this.load.image("background", "assets/background.png");
        this.load.image("ground", "assets/ground.png");
        this.load.image("coin", "assets/coin.png");
        this.load.image("slime", "assets/slime.png");
        this.load.image("barTexture", "assets/barTexture.png");
        this.load.image("playerRun", "assets/playerRun.png");
    }

    create() {
        this.scene.start("MenuScene");
    }
}