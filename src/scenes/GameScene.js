import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    create() {

        const width = this.scale.width;
        const height = this.scale.height;

        // =========================
        // BACKGROUND (STATIC)
        // =========================
        this.background = this.add.tileSprite(
            width / 2,
            height / 2,
            width,
            height,
            "background"
        );
        this.background.setDepth(0);

        // =========================
        // GROUND (MOVING ONLY)
        // =========================
        this.groundY = height - 110;

        this.ground = this.add.tileSprite(
            width / 2,
            this.groundY + 55,
            width,
            110,
            "ground"
        );
        this.ground.setDepth(1);

        // =========================
        // LANES
        // =========================
        this.currentLane = 1;
        this.laneSpacing = 140;

        this.getLaneX = (lane) => {
            return width / 2 + (lane - 1) * this.laneSpacing;
        };

        // =========================
        // PLAYER
        // =========================
        this.player = this.add.image(
            this.getLaneX(this.currentLane),
            this.groundY - 60,
            "playerRun"
        );

        this.player.setDepth(10);

        this.baseY = this.player.y;

        this.isJumping = false;
        this.isDucking = false;

        // =========================
        // SPEED
        // =========================
        this.speed = 8;
        this.maxSpeed = 25;

        // =========================
        // ENTITIES
        // =========================
        this.entities = [];

        // =========================
        // INPUT
        // =========================
        this.cursors = this.input.keyboard.createCursorKeys();

        this.input.on("pointerdown", (p) => {
            this.startX = p.x;
            this.startY = p.y;
        });

        this.input.on("pointerup", (p) => {

            const dx = p.x - this.startX;
            const dy = p.y - this.startY;

            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 40) this.changeLane(1);
                else if (dx < -40) this.changeLane(-1);
            } else {
                if (dy < -40) this.jump();
                else if (dy > 40) this.duck();
            }
        });

        // =========================
        // SPAWN TIMER
        // =========================
        this.spawnTimer = 0;
        this.spawnRate = 1200;

        // =========================
        // SCORE
        // =========================
        this.score = 0;
        this.scoreText = this.add.text(20, 20, "Score: 0", {
            fontSize: "20px",
            color: "#fff"
        }).setDepth(100);
    }

    // =========================
    // UPDATE LOOP
    // =========================
    update(time, delta) {

        const dt = delta / 16;

        // speed increase
        this.speed += 0.01;
        this.speed = Math.min(this.speed, this.maxSpeed);

        // move ground only
        this.ground.tilePositionY -= this.speed * 2;

        // player reset
        if (!this.isJumping) {
            this.player.y = Phaser.Math.Linear(this.player.y, this.baseY, 0.2);
        }

        // jump
        if (this.isJumping) {
            this.player.y -= 6;
            if (this.player.y < this.baseY - 120) {
                this.isJumping = false;
            }
        }

        // spawn
        this.spawnTimer += delta;
        if (this.spawnTimer > this.spawnRate) {
            this.spawnTimer = 0;
            this.spawn();
        }

        // update entities
        for (let i = this.entities.length - 1; i >= 0; i--) {

            const e = this.entities[i];
            e.z -= this.speed;

            const scale = Phaser.Math.Clamp(1 - (e.z / 120), 0.2, 1.5);

            e.sprite.x = this.getLaneX(e.lane);
            e.sprite.y = this.baseY - e.z;
            e.sprite.setScale(scale);

            // collision
            if (e.z < 20 && e.lane === this.currentLane) {
                this.hit(e, i);
            }

            // remove
            if (e.z < -50) {
                e.sprite.destroy();
                this.entities.splice(i, 1);
            }
        }

        // score
        this.score += 0.1;
        this.scoreText.setText("Score: " + Math.floor(this.score));
    }

    // =========================
    // LANES
    // =========================
    changeLane(dir) {
        this.currentLane += dir;
        this.currentLane = Phaser.Math.Clamp(this.currentLane, 0, 2);

        this.player.x = this.getLaneX(this.currentLane);
    }

    // =========================
    // JUMP
    // =========================
    jump() {
        if (this.isJumping) return;
        this.isJumping = true;
    }

    // =========================
    // DUCK
    // =========================
    duck() {
        if (this.isDucking) return;

        this.isDucking = true;

        this.tweens.add({
            targets: this.player,
            scaleY: 0.6,
            duration: 150,
            yoyo: true,
            onComplete: () => {
                this.isDucking = false;
                this.player.scaleY = 1;
            }
        });
    }

    // =========================
    // SPAWN
    // =========================
    spawn() {

        const lane = Phaser.Math.Between(0, 2);
        const type = Math.random() > 0.5 ? "bar" : "coin";

        const sprite = this.add.image(
            this.getLaneX(lane),
            this.baseY - 200,
            type === "coin" ? "coin" : "barTexture"
        );

        sprite.setDepth(5);

        this.entities.push({
            sprite,
            lane,
            type,
            z: 120
        });
    }

    // =========================
    // HIT
    // =========================
    hit(e, index) {

        e.sprite.setTint(0xff0000);

        this.time.delayedCall(200, () => {
            e.sprite.clearTint();
        });

        // reset penalty
        this.speed = 5;
        this.player.x -= 10;
    }
}