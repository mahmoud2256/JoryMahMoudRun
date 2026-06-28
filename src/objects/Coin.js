import Phaser from "phaser";

export default class Coin extends Phaser.GameObjects.Arc {

    constructor(scene, x, y) {

        super(scene, x, y, 18, 0, 360, false, 0xFFD700);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setAllowGravity(false);

        this.speed = 8;

    }

    update() {

        this.y += this.speed;

        if (this.y > 1300) {

            this.destroy();

        }

    }

}