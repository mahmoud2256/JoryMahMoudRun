import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {

    constructor() {
        super("BootScene");
    }

    preload() {

        this.load.image("playerIdle", "assets/player/player.png");
        this.load.image("playerRun", "assets/player/player.png");
        this.load.image("playerJump", "assets/player/player.png");

        this.load.image("slime", "assets/enemy/slime.png");

        this.load.image("background", "assets/environment/background.png");
        this.load.image("ground", "assets/environment/ground.png");
        this.load.image("barTexture", "assets/environment/bar.png");

        this.load.image("coin", "assets/ui/coin.png");
        this.load.image("heart", "assets/ui/heart.png");

        this.load.on("loaderror", (file) => {
            console.warn("missing audio:", file.key);
        });

        this.load.audio("jump", [
            "assets/audio/jump.mp3",
            "assets/audio/jump.wav"
        ]);

        this.load.audio("coinSound", [
            "assets/audio/coin.mp3",
            "assets/audio/coin.wav"
        ]);

        this.load.audio("gameOver", [
            "assets/audio/gameOver.mp3",
            "assets/audio/gameOver.wav"
        ]);

    }

    create() {
        this.scene.start("MenuScene");
    }

}
