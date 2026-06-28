import Phaser from "phaser";

export default class Obstacle extends Phaser.GameObjects.Rectangle {

    constructor(scene, x, y) {

        super(scene, x, y, 70, 70, 0xff3333);

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