import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {

    create() {

        const w = this.scale.width;
        const h = this.scale.height;

        // ================= BACKGROUND =================
        this.add.image(w/2, h/2, "bg")
            .setDisplaySize(w, h);

        // ================= GROUND =================
        this.groundY = h - 120;

        this.ground = this.add.tileSprite(
            w/2,
            this.groundY + 50,
            w,
            120,
            "ground"
        );

        // ================= PLAYER =================
        this.player = this.add.image(w/2, this.groundY - 60, "player")
            .setDisplaySize(120, 120);

        this.currentLane = 1;
        this.laneX = (lane) => (w/2) + (lane - 1) * 180;

        // ================= STATE =================
        this.isJumping = false;
        this.speed = 10;

        // ================= INPUT =================
        this.cursors = this.input.keyboard.createCursorKeys();

        // ================= ENTITIES =================
        this.entities = [];

        this.spawnTimer = 0;
        this.nextSpawn = 1200;
    }

    // ================= CONTROLS =================
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
            Math.random() > 0.5 ? "coin" : "bar"
        );

        obj.setDisplaySize(60, 60);

        this.entities.push(obj);
    }

    // ================= UPDATE =================
    update(time, delta) {

        const dt = delta / 1000;

        // INPUT
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) this.changeLane(-1);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) this.changeLane(1);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.tryJump();

        // FORWARD FEEL
        this.ground.tilePositionX += this.speed;

        // MOVE OBJECTS
        for (let i = this.entities.length - 1; i >= 0; i--) {

            const e = this.entities[i];

            e.y += this.speed * 6;

            if (e.y > 1400) {
                e.destroy();
                this.entities.splice(i, 1);
            }
        }

        // SPAWN
        this.spawnTimer += delta;

        if (this.spawnTimer > this.nextSpawn) {
            this.spawnTimer = 0;
            this.nextSpawn = Phaser.Math.Between(900, 1500);
            this.spawn();
        }
    }
}