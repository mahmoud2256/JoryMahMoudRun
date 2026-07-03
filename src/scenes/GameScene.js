import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    create() {

        const width = this.scale.width;
        const height = this.scale.height;

        // ================= BACKGROUND =================
        this.background = this.add.image(
            width / 2,
            height / 2,
            "background"
        );

        this.background.setDisplayWidth(width);
        this.background.setDisplayHeight(height);
        this.background.setScrollFactor(0);
        this.background.setDepth(0);

        // ================= GROUND =================
        this.groundY = height - 110;

        this.groundStrip = this.add.tileSprite(
            width / 2,
            this.groundY + 55,
            width,
            110,
            "ground"
        );
        this.groundStrip.setDepth(1);

        // ================= LANES SYSTEM =================
        this.currentLane = 1;

        this.horizonY = height * 0.35;
        this.nearHalfWidth = width * 0.42;
        this.farHalfWidth = width * 0.02;

        this.SPAWN_Z = 60;
        this.HIT_Z = 4;
        this.CLEANUP_Z = -6;

        // ================= PLAYER =================
        this.player = this.add.sprite(
            this.laneX(this.currentLane),
            this.groundY,
            "playerRun"
        );

        const targetH = height * 0.16;
        const aspect = this.player.width / this.player.height;

        this.player.setDisplaySize(targetH * aspect, targetH);
        this.player.setDepth(50);

        this.baseY = this.groundY - (this.player.displayHeight / 2);
        this.player.y = this.baseY;

        this.isJumping = false;
        this.gameOver = false;

        // ================= ENTITIES =================
        this.entities = [];

        // ================= SPEED =================
        this.zSpeed = 16;
        this.zBaseSpeed = 16;
        this.zMaxSpeed = 55;
        this.timeAlive = 0;

        // ================= SCORE + COINS =================
        this.score = 0;
        this.coins = 0;

        this.scoreText = this.add.text(20, 20, "Score: 0", {
            fontSize: "26px",
            color: "#fff",
            stroke: "#000",
            strokeThickness: 4
        }).setDepth(100);

        this.coinsText = this.add.text(20, 55, "Coins: 0", {
            fontSize: "24px",
            color: "#ffd54f",
            stroke: "#000",
            strokeThickness: 4
        }).setDepth(100);

        // ================= INPUT =================
        this.cursors = this.input.keyboard.createCursorKeys();

        this.input.on("pointerdown", () => {
            if (!this.gameOver) this.jump();
        });

        // ================= SPAWN =================
        this.spawnTimer = 0;
        this.nextSpawn = 1200;
    }

    // ================= LANES =================
    laneX(lane) {
        const cx = this.scale.width / 2;
        const half = this.nearHalfWidth;
        return cx + (lane - 1) * half;
    }

    // ================= JUMP =================
    jump() {
        if (this.isJumping) return;

        this.isJumping = true;

        this.tweens.add({
            targets: this.player,
            y: this.baseY - 140,
            duration: 250,
            ease: "Sine.easeOut",
            yoyo: true,
            onComplete: () => {
                this.isJumping = false;
                this.player.y = this.baseY;
            }
        });
    }

    // ================= SPAWN =================
    spawnEntity(type, lane) {

        let sprite;

        if (type === "bar") {
            sprite = this.add.image(0, 0, "barTexture");
        }

        else if (type === "coin") {
            sprite = this.add.image(0, 0, "coin");
        }

        else {
            sprite = this.add.image(0, 0, "ground");
        }

        const ent = {
            type,
            lane,
            z: this.SPAWN_Z,
            sprite,
            size: 50,
            w: 120,
            h: 40
        };

        this.entities.push(ent);
        this.updateEntity(ent);
    }

    spawnWave() {

        const lane = Phaser.Math.Between(0, 2);
        const r = Math.random();

        if (r < 0.45) {
            this.spawnEntity("bar", lane);
        }
        else if (r < 0.7) {
            this.spawnEntity("ground", lane);
        }
        else {
            this.spawnEntity("coin", lane);
        }
    }

    // ================= ENTITY UPDATE =================
    updateEntity(ent) {

        const t = Phaser.Math.Clamp(ent.z / this.SPAWN_Z, 0, 1);

        const x = this.laneX(ent.lane);
        const y = this.baseY + (this.horizonY - this.baseY) * Math.pow(t, 1.6);

        ent.sprite.x = x;
        ent.sprite.y = y;

        ent.sprite.setDepth(10 + (1 - t) * 20);

        const scale = 1 + (0.12 - 1) * Math.pow(t, 1.6);

        if (ent.type === "coin") {
            ent.sprite.setDisplaySize(ent.size * scale, ent.size * scale);
        }

        if (ent.type === "bar") {
            ent.sprite.setDisplaySize(ent.w * scale, ent.h * scale);
        }

        if (ent.type === "ground") {
            ent.sprite.setDisplaySize(ent.size * scale, ent.size * scale);
        }
    }

    // ================= UPDATE LOOP =================
    update(time, delta) {

        if (this.gameOver) return;

        const dt = delta / 1000;

        // speed increase
        this.timeAlive += dt;
        this.zSpeed = Math.min(
            this.zMaxSpeed,
            this.zBaseSpeed + this.timeAlive * 0.4
        );

        // background FIXED
        this.background.setScrollFactor(0);

        // ground movement
        this.groundStrip.tilePositionY -= this.zSpeed * dt * 6;

        // controls
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) this.currentLane = Math.max(0, this.currentLane - 1);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) this.currentLane = Math.min(2, this.currentLane + 1);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.jump();

        this.player.x = this.laneX(this.currentLane);
        this.player.y = this.baseY;

        // score
        this.score += dt * 10;
        this.scoreText.setText("Score: " + Math.floor(this.score));

        // entities update
        for (let i = this.entities.length - 1; i >= 0; i--) {

            const ent = this.entities[i];

            ent.z -= this.zSpeed * dt;

            this.updateEntity(ent);

            // collision
            if (!ent.hit && ent.lane === this.currentLane && ent.z <= this.HIT_Z) {

                ent.hit = true;

                if (ent.type === "coin") {

                    this.coins++;
                    this.coinsText.setText("Coins: " + this.coins);

                    ent.sprite.destroy();
                    this.entities.splice(i, 1);
                    this.score += 20;
                    continue;
                }

                // hit obstacle
                this.scene.restart();
                return;
            }

            // cleanup
            if (ent.z < this.CLEANUP_Z) {
                ent.sprite.destroy();
                this.entities.splice(i, 1);
            }
        }

        // spawn
        this.spawnTimer += delta;

        if (this.spawnTimer > this.nextSpawn) {
            this.spawnTimer = 0;
            this.nextSpawn = Phaser.Math.Between(900, 1400);
            this.spawnWave();
        }
    }
}