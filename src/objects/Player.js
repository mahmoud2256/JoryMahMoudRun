import Phaser from "phaser";

export default class Player extends Phaser.GameObjects.Rectangle {

    constructor(scene, x, y) {

        super(scene, x, y, 60, 90, 0x00ffcc);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setCollideWorldBounds(true);
        this.body.setGravityY(1800);
        this.body.setBounce(0);

        this.lanes = [220, 360, 500];
        this.currentLane = 1;

        this.setPosition(this.lanes[this.currentLane], y);
    }

    moveLeft() {

        if (this.currentLane > 0) {

            this.currentLane--;

            this.scene.tweens.add({
                targets: this,
                x: this.lanes[this.currentLane],
                duration: 120,
                ease: "Sine.easeOut"
            });

        }

    }

    moveRight() {

        if (this.currentLane < 2) {

            this.currentLane++;

            this.scene.tweens.add({
                targets: this,
                x: this.lanes[this.currentLane],
                duration: 120,
                ease: "Sine.easeOut"
            });

        }

    }

    jump() {

        if (this.body.blocked.down || this.body.touching.down) {
            this.body.setVelocityY(-900);
        }

    }

}