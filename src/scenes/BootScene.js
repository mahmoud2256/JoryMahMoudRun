import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {

    constructor() {
        super("BootScene");
    }

    preload() {

        this.load.image("playerIdle", "assets/player/player.png");
        this.load.image("playerRun", "assets/player/player.png");
        this.load.image("playerJump", "assets/player/player.png");

        this.load.spritesheet("playerRunAnim", "assets/player/player_run_sheet.png", {
            frameWidth: 160,
            frameHeight: 320
        });

        this.load.image("slime", "assets/enemy/slime.png");

        this.load.image("background", "assets/environment/background.png");
        this.load.image("ground", "assets/environment/ground.png");
        this.load.image("barTexture", "assets/environment/bar.png");

        this.load.image("coin", "assets/ui/coin.png");
        this.load.image("heart", "assets/ui/heart.png");

        this.load.audio("music", "assets/audio/music.mp3");

        this.load.on("loaderror", (file) => {
            console.warn("missing audio:", file.key);
        });

        this.load.audio("coinSound", "assets/audio/coin.wav");
        this.load.audio("gameOver", "assets/audio/gameover.wav");
        this.load.audio("jump", "assets/audio/jump.wav");

    }

    create() {
        this.scene.start("MenuScene");
    }

}
