import Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {

    create() {

        const w = this.scale.width;
        const h = this.scale.height;

        this.add.text(w / 2, h / 2 - 80, "Jory Run", {
            fontSize: "48px",
            color: "#ffffff"
        }).setOrigin(0.5);

        const playBtn = this.add.text(w / 2, h / 2 + 50, "PLAY", {
            fontSize: "40px",
            backgroundColor: "#00c853",
            padding: { left: 20, right: 20, top: 10, bottom: 10 }
        }).setOrigin(0.5).setInteractive();

        playBtn.on("pointerdown", () => {
            this.scene.start("GameScene");
        });
    }
}