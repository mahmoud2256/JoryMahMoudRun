import Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {

    constructor() {
        super("MenuScene");
    }

    create() {

        this.cameras.main.setBackgroundColor("#151933");

        this.add.text(
            this.scale.width / 2,
            140,
            "JORY MAHMOUD RUN",
            {
                fontFamily: "Arial",
                fontSize: "30px",
                fontStyle: "bold",
                color: "#ffffff",
                align: "center",
                wordWrap: { width: this.scale.width - 40 }
            }
        ).setOrigin(0.5);

        this.add.text(
            this.scale.width / 2,
            210,
            "Made with ❤️ by Mahmoud Amin",
            {
                fontFamily: "Arial",
                fontSize: "20px",
                color: "#FFD54F",
                align: "center",
                wordWrap: { width: this.scale.width - 40 }
            }
        ).setOrigin(0.5);

        this.add.text(
            this.scale.width / 2,
            280,
            "Collect Coins • Avoid Slimes • Reach The Finish",
            {
                fontFamily: "Arial",
                fontSize: "16px",
                color: "#DDDDDD",
                align: "center",
                wordWrap: { width: this.scale.width - 40 }
            }
        ).setOrigin(0.5);

        const playButton = this.add.text(
            this.scale.width / 2,
            390,
            "▶ PLAY",
            {
                fontFamily: "Arial",
                fontSize: "34px",
                fontStyle: "bold",
                backgroundColor: "#00C853",
                color: "#ffffff",
                padding: { left: 30, right: 30, top: 15, bottom: 15 }
            }
        ).setOrigin(0.5);

        playButton.setInteractive({ useHandCursor: true });

        playButton.on("pointerover", () => { playButton.setScale(1.08); });
        playButton.on("pointerout", () => { playButton.setScale(1); });
        playButton.on("pointerdown", () => { this.scene.start("GameScene"); });

        this.add.text(
            this.scale.width / 2,
            560,
            "Version 1.0",
            {
                fontFamily: "Arial",
                fontSize: "16px",
                color: "#888888"
            }
        ).setOrigin(0.5);

    }

}
