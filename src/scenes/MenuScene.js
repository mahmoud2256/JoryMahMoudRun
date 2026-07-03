import Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {

    constructor() {
        super("MenuScene");
    }

    create() {

        const width = this.scale.width;
        const height = this.scale.height;

        // =========================
        // Background
        // =========================

        this.add.image(
            width / 2,
            height / 2,
            "background"
        ).setDisplaySize(width, height);

        this.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x000000,
            0.35
        );

        // =========================
        // Title
        // =========================

        this.add.text(
            width / 2,
            height * 0.15,
            "JORY MAHMOUD RUN",
            {
                fontFamily: "Arial",
                fontSize: "48px",
                fontStyle: "bold",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 6,
                align: "center"
            }
        ).setOrigin(0.5);

        // =========================
        // Developer
        // =========================

        this.add.text(
            width / 2,
            height * 0.24,
            "Made By Mahmoud Amin",
            {
                fontSize: "22px",
                color: "#FFD54F"
            }
        ).setOrigin(0.5);

        // =========================
        // Play Button
        // =========================

        const playButton = this.add.text(
            width / 2,
            height * 0.55,
            "PLAY",
            {
                fontSize: "42px",
                fontStyle: "bold",
                backgroundColor: "#00C853",
                color: "#ffffff",
                padding: {
                    left: 45,
                    right: 45,
                    top: 20,
                    bottom: 20
                }
            }
        ).setOrigin(0.5);

        playButton.setInteractive({ useHandCursor: true });

        playButton.on("pointerover", () => {
            playButton.setScale(1.08);
        });

        playButton.on("pointerout", () => {
            playButton.setScale(1);
        });

        playButton.on("pointerdown", () => {

            this.cameras.main.fadeOut(250);

            this.time.delayedCall(250, () => {

                this.scene.start("GameScene");

            });

        });

        // =========================
        // Instructions
        // =========================

        this.add.text(
            width / 2,
            height * 0.73,
            "Swipe Left / Right\nSwipe Up To Jump\nSwipe Down To Slide",
            {
                fontSize: "20px",
                color: "#FFFFFF",
                align: "center"
            }
        ).setOrigin(0.5);

        // =========================
        // Version
        // =========================

        this.add.text(
            width / 2,
            height - 35,
            "Version 2.0",
            {
                fontSize: "16px",
                color: "#CCCCCC"
            }
        ).setOrigin(0.5);

        this.cameras.main.fadeIn(250);

    }

}