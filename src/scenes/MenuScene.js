import Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {

    create() {

        const w = this.scale.width;
        const h = this.scale.height;

        this.add.text(w/2, h/2 - 100, "SUBWAY RUN", {
            fontSize: "40px",
            color: "#fff"
        }).setOrigin(0.5);

        this.add.text(w/2, h/2 + 50, "PLAY", {
            fontSize: "36px",
            backgroundColor: "#00c853",
            padding: { left: 20, right: 20, top: 10, bottom: 10 }
        })
        .setOrigin(0.5)
        .setInteractive()
        .on("pointerdown", () => {
            this.scene.start("GameScene");
        });
    }
}