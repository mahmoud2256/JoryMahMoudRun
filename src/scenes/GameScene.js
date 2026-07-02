import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {

    create() {

        const width = this.scale.width;
        const height = this.scale.height;

        // ================= SAFE BACKGROUND =================
        this.add.image(width / 2, height / 2, "background")
            .setDisplaySize(width, height);

        // ================= GROUND =================
        this.groundY = height - 110;

        this.groundStrip = this.add.tileSprite(
            width / 2,
            this.groundY + 55,
            width,
            110,
            "ground"
        );

        // ================= PLAYER (SAFE) =================
        this.player = this.add.image(
            width / 2,
            this.groundY - 80,
            "playerRun"
        );

        this.player.setDisplaySize(120, 120);

        this.currentLane = 1;

        this.laneX = (lane) => (width / 2) + (lane - 1) * 180;

        // ================= SAFE STATE =================
        this.isJumping = false;
        this.isDucking = false;

        // ================= INPUT =================
        this.cursors = this.input.keyboard.createCursorKeys();

        // ================= ENTITIES =================
        this.entities = [];

        this.spawnTimer = 0;
        this.nextSpawn = 1200;

        // ================= SCORE =================
        this.score = 0;

        this.add.text(20, 20, "GAME STARTED", {
            fontSize: "24px",
            color: "#fff"
        });

        // ================= CAMERA FIX (IMPORTANT) =================
        this.cameras.main.setBackgroundColor("#000000");
    }

    // ================= MOVEMENT =================
    changeLane(dir) {

        const next = this.currentLane + dir;

        if (next < 0 || next > 2) return;

        this.currentLane = next;

        this.tweens.add({
            targets: this.player,
            x: this.laneX(this.currentLane),
            duration: 150
        });
    }

    tryJump() {

        if (this.isJumping) return;

        this.isJumping = true;

        this.tweens.add({
            targets: this.player,
            y: this.player.y - 140,
            duration: 300,
            yoyo: true,
            onComplete: () => {
                this.isJumping = false;
            }
        });
    }

    // ================= SPAWN =================
    spawn() {

        const lane = Phaser.Math.Between(0, 2);

        const obj = this.add.image(
            this.laneX(lane),
            -50,
            Math.random() > 0.5 ? "coin" : "barTexture"
        );

        obj.setDisplaySize(60, 60);

        this.entities.push(obj);
    }

    // ================= UPDATE =================
    update(time, delta) {

        const dt = delta / 1000;

        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) this.changeLane(-1);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) this.changeLane(1);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.tryJump();

        // movement illusion
        this.groundStrip.tilePositionX += 6;

        // entities
        for (let i = this.entities.length - 1; i >= 0; i--) {

            const e = this.entities[i];

            e.y += 6;

            if (e.y > 1400) {
                e.destroy();
                this.entities.splice(i, 1);
            }
        }

        // spawn
        this.spawnTimer += delta;

        if (this.spawnTimer > this.nextSpawn) {
            this.spawnTimer = 0;
            this.spawn();
        }
    }
}