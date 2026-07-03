import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {

    constructor() {
        super("BootScene");
    }

    preload() {

        // ==========================
        // PLAYER
        // ==========================

        this.load.image("playerIdle", "assets/player/player.png");
        this.load.image("playerRun", "assets/player/player.png");
        this.load.image("playerJump", "assets/player/player.png");

        // ==========================
        // ENVIRONMENT
        // ==========================

        this.load.image("background", "assets/environment/background.png");
        this.load.image("ground", "assets/environment/ground.png");
        this.load.image("barTexture", "assets/environment/bar.png");

        // ==========================
        // OBJECTS
        // ==========================

        this.load.image("slime", "assets/enemy/slime.png");
        this.load.image("coin", "assets/ui/coin.png");
        this.load.image("heart", "assets/ui/heart.png");

        // ==========================
        // AUDIO
        // ==========================

        this.load.audio("jump", "assets/audio/jump.wav");
        this.load.audio("coinSound", "assets/audio/coin.wav");
        this.load.audio("gameOver", "assets/audio/gameOver.wav");

        // ==========================
        // LOAD ERRORS
        // ==========================

        this.load.on("loaderror", (file) => {
            console.warn("Missing Asset:", file.src);
        });

    }

    create() {

        this.scene.start("MenuScene");

    }

}