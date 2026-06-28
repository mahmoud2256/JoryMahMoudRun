import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {

    constructor() {
        super("BootScene");
    }

    preload() {

        // =========================
        // Images - Player (same image used for all 3 states)
        // =========================

        this.load.image("playerIdle", "assets/player/player.png");
        this.load.image("playerRun", "assets/player/player.png");
        this.load.image("playerJump", "assets/player/player.png");

        // =========================
        // Images - Enemy
        // =========================

        this.load.image("slime", "assets/enemy/slime.png");

        // =========================
        // Images - Environment
        // =========================

        this.load.image("background", "assets/environment/background.png");
        this.load.image("ground", "assets/environment/ground.png");
        this.load.image("barTexture", "assets/environment/bar.png");

        // =========================
        // Images - UI
        // =========================

        this.load.image("coin", "assets/ui/coin.png");
        this.load.image("heart", "assets/ui/heart.png");

        // =========================
        // Audio (اختياري - اللعبة هتكمل عادي لو ملف صوت مش موجود)
        // =========================

        this.load.on("loaderror", (file) => {
            console.warn("ملف الصوت ده مش موجود، اللعبة هتكمل من غيره:", file.key);
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