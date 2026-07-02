import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    create() {

        const width = this.scale.width;
        const height = this.scale.height;

        // ======================
        // BACKGROUND
        // ======================
        this.background = this.add.image(width / 2, height / 2, "background");
        this.background.setDisplaySize(width, height);
        this.background.setDepth(0);

        // ======================
        // GROUND
        // ======================
        this.groundY = height - 110;

        this.groundStrip = this.add.tileSprite(
            width / 2,
            this.groundY + 55,
            width,
            110,
            "ground"
        );
        this.groundStrip.setDepth(1);

        // ======================
        // CAMERA (IMPORTANT)
        // ======================
        this.cameras.main.startFollow(null);
        this.cameras.main.roundPixels = true;
        this.cameras.main.setLerp(0.08, 0.08);
        this.cameras.main.setDeadzone(0, 200);
        this.cameras.main.setFollowOffset(0, -120);

        // ======================
        // LANES
        // ======================
        this.nearHalfWidth = width * 0.30;
        this.farHalfWidth = width * 0.05;

        this.horizonY = height * 0.22;

        this.SPAWN_Z = 60;
        this.HIT_Z = 4;
        this.CLEANUP_Z = -6;

        this.currentLane = 1;

        // ======================
        // PLAYER
        // ======================
        this.player = this.add.sprite(0, 0, "playerRun");

        const targetHeight = height * 0.16;
        const aspect = this.player.width / this.player.height;

        this.player.setDisplaySize(targetHeight * aspect, targetHeight);
        this.player.setDepth(50);

        this.standHeight = this.player.displayHeight;
        this.baseY = this.groundY - (this.standHeight / 2);
        this.player.y = this.baseY;

        // 👉 CAMERA follows player
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        // ======================
        // RUN ANIMATION
        // ======================
        this.anims.create({
            key: "run",
            frames: this.anims.generateFrameNumbers("playerRun", {
                start: 0,
                end: 5
            }),
            frameRate: 12,
            repeat: -1
        });

        this.player.play("run");

        // ======================
        // STATE
        // ======================
        this.isJumping = false;
        this.isDucking = false;
        this.invincible = false;

        this.entities = [];

        this.zSpeed = 16;
        this.elapsedTime = 0;

        // ======================
        // INPUT
        // ======================
        this.cursors = this.input.keyboard.createCursorKeys();

        // ======================
        // HUD
        // ======================
        this.score = 0;
        this.coins = 0;
        this.lives = 3;

        this.scoreText = this.add.text(20, 20, "Score: 0", {
            fontSize: "24px",
            color: "#fff"
        }).setDepth(100);

        this.coinsText = this.add.text(20, 50, "Coins: 0", {
            fontSize: "20px",
            color: "#ffd54f"
        }).setDepth(100);

        this.lifeText = this.add.text(20, 80, "Lives: 3", {
            fontSize: "20px",
            color: "#ff6666"
        }).setDepth(100);

        // ======================
        // SPAWN
        // ======================
        this.spawnTimer = 0;
        this.nextSpawnIn = 1500;
    }

    // ======================
    // LANE SYSTEM
    // ======================
    laneXAtDepth(lane, t) {
        const cx = this.scale.width / 2;
        const w = this.nearHalfWidth + (this.farHalfWidth - this.nearHalfWidth) * t;
        return cx + (lane - 1) * w;
    }

    depthT(z) {
        return Phaser.Math.Clamp(z / this.SPAWN_Z, 0, 1);
    }

    yFromDepth(t) {
        const e = Math.pow(t, 1.6);
        return this.baseY + (this.horizonY - this.baseY) * e;
    }

    // ======================
    // UPDATE ENTITY
    // ======================
    updateEntity(ent) {

        const t = this.depthT(ent.z);

        ent.sprite.x = this.laneXAtDepth(ent.lane, t);
        ent.sprite.y = this.yFromDepth(t);

        const scale = 1 + (0.12 - 1) * Math.pow(t, 1.6);

        ent.sprite.setDepth(10 + (1 - t) * 20);

        if (ent.type === "bar") {
            ent.sprite.setDisplaySize(ent.w * scale, ent.h * scale);
            ent.sprite.setAngle(90); // واقف بالطول
        }

        if (ent.type === "coin") {
            ent.sprite.setDisplaySize(ent.size * scale, ent.size * scale);
        }

        if (ent.type === "ground") {
            ent.sprite.setDisplaySize(ent.size * scale, ent.size * scale);
        }
    }

    // ======================
    // CONTROLS
    // ======================
    changeLane(dir) {

        const newLane = this.currentLane + dir;
        if (newLane < 0 || newLane > 2) return;

        this.currentLane = newLane;

        this.tweens.add({
            targets: this.player,
            x: this.laneXAtDepth(this.currentLane, 0),
            duration: 150,
            ease: "Sine.easeOut"
        });
    }

    tryJump() {
        if (this.isJumping || this.isDucking) return;

        this.isJumping = true;

        this.tweens.add({
            targets: this.player,
            y: this.baseY - 120,
            duration: 300,
            yoyo: true,
            ease: "Sine.easeOut",
            onComplete: () => {
                this.isJumping = false;
                this.player.y = this.baseY;
            }
        });
    }

    beginDuck() {
        if (this.isJumping || this.isDucking) return;

        this.isDucking = true;

        this.player.setScale(1, 0.6);
        this.player.y = this.baseY + 20;
    }

    endDuck() {
        this.isDucking = false;

        this.player.setScale(1, 1);
        this.player.y = this.baseY;
    }

    // ======================
    // SPAWN
    // ======================
    spawnEntity(type, lane, zOffset = 0) {

        let sprite;

        if (type === "coin") sprite = this.add.image(0, 0, "coin");
        if (type === "bar") sprite = this.add.image(0, 0, "barTexture");
        if (type === "ground") sprite = this.add.image(0, 0, "slime");

        const ent = {
            type,
            lane,
            z: this.SPAWN_Z + zOffset,
            sprite,
            size: 60,
            w: 120,
            h: 80
        };

        this.updateEntity(ent);
        this.entities.push(ent);
    }

    spawnWave() {

        const lane = Phaser.Math.Between(0, 2);
        const r = Math.random();

        if (r < 0.4) {
            this.spawnEntity("ground", lane);
        } else if (r < 0.7) {
            this.spawnEntity("bar", lane);
        } else {
            for (let i = 0; i < 4; i++) {
                this.spawnEntity("coin", lane, i * 6);
            }
        }
    }

    // ======================
    // UPDATE LOOP
    // ======================
    update(time, delta) {

        const dt = delta / 1000;

        // INPUT
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            this.changeLane(-1);
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            this.changeLane(1);
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.tryJump();
        }

        if (this.cursors.down.isDown) {
            this.beginDuck();
        } else {
            this.endDuck();
        }

        // SCORE
        this.score += dt * 10;
        this.scoreText.setText("Score: " + Math.floor(this.score));

        // MOVE ENTITIES
        for (let i = this.entities.length - 1; i >= 0; i--) {

            const e = this.entities[i];

            e.z -= this.zSpeed * dt;

            this.updateEntity(e);

            if (e.z <= this.CLEANUP_Z) {
                e.sprite.destroy();
                this.entities.splice(i, 1);
            }
        }

        // SPAWN
        this.spawnTimer += delta;

        if (this.spawnTimer > this.nextSpawnIn) {
            this.spawnTimer = 0;
            this.nextSpawnIn = Phaser.Math.Between(1200, 1800);
            this.spawnWave();
        }
    }
}