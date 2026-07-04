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

        // =========================
        // Sound Controls
        // =========================

        // Music toggle button
        let musicOn = true;
        const musicBtn = this.add.text(
        this.scale.width / 2,
        460,
        "🎵 Music : ON",
    {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#ffffff",
        backgroundColor: "#333366",
        padding: { left: 20, right: 20, top: 10, bottom: 10 }
    }
        ).setOrigin(0.5).setInteractive();

        musicBtn.on("pointerdown", () => {
        musicOn = !musicOn;
        musicBtn.setText("🎵 Music : " + (musicOn ? "ON" : "OFF"));
        this.registry.set("musicOn", musicOn);
});

        // SFX toggle button
        let sfxOn = true;
        const sfxBtn = this.add.text(
        this.scale.width / 2,
        520,
        "🔊 Sound : ON",
    {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#ffffff",
        backgroundColor: "#333366",
        padding: { left: 20, right: 20, top: 10, bottom: 10 }
    }
        ).setOrigin(0.5).setInteractive();

        sfxBtn.on("pointerdown", () => {
        sfxOn = !sfxOn;
        sfxBtn.setText("🔊 Sound : " + (sfxOn ? "ON" : "OFF"));
        this.registry.set("sfxOn", sfxOn);
});

        // Set defaults in registry
        this.registry.set("musicOn", true);
        this.registry.set("sfxOn", true);

    }

}
