import Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {

    create() {

        const w = this.scale.width;
        const h = this.scale.height;

        this.add.text(w / 2, h / 2, "PLAY", {
            fontSize: "50px",
            color: "#ffffff"
        }).setOrigin(0.5).setInteractive()
          .on("pointerdown", () => {
              this.scene.start("GameScene");
          });
    }
}