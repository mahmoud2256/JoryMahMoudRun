import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    create() {

        const width = this.scale.width;
        const height = this.scale.height;

        // ===== الخلفية (ثابتة Full Screen) =====
        this.background = this.add.image(
            width / 2,
            height / 2,
            "background"
        );

        this.background.setDisplaySize(width, height);
        this.background.setScrollFactor(0);
        this.background.setDepth(0);

        // ===== الأرض =====
        this.groundY = height - 110;

        this.groundStrip = this.add.tileSprite(
            width / 2,
            this.groundY + 55,
            width,
            110,
            "ground"
        );
        this.groundStrip.setDepth(1);

        // ===== منظور lanes =====
        this.horizonY = height * 0.35;
        this.nearHalfWidth = width * 0.42;
        this.farHalfWidth = width * 0.02;

        this.SPAWN_Z = 60;
        this.HIT_Z = 4;
        this.CLEANUP_Z = -6;

        // ===== اللاعب =====
        this.currentLane = 1;

        this.player = this.add.sprite(
            this.laneXAtDepth(this.currentLane, 0),
            this.groundY,
            "playerRun"
        );

        const targetHeight = height * 0.16;
        const aspect = this.player.width / this.player.height;

        this.player.setDisplaySize(targetHeight * aspect, targetHeight);
        this.player.setDepth(50);

        this.baseY = this.groundY - (this.player.displayHeight / 2);
        this.player.y = this.baseY;

        // ===== states =====
        this.isJumping = false;
        this.isDucking = false;
        this.gameOver = false;

        // ===== entities =====
        this.entities = [];

        // ===== speed =====
        this.zBaseSpeed = 16;
        this.zMaxSpeed = 55;
        this.zSpeed = this.zBaseSpeed;
        this.elapsedTime = 0;

        // ===== score =====
        this.score = 0;

        this.scoreText = this.add.text(20, 20, "Score: 0", {
            fontSize: "26px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4
        }).setDepth(100);

        // ===== controls =====
        this.cursors = this.input.keyboard.createCursorKeys();

        this.input.on("pointerdown", () => {
            if (!this.gameOver) this.tryJump();
        });

        this.spawnTimer = 0;
        this.nextSpawnIn = 1200;
    }

    // ===== lane system =====
    laneXAtDepth(laneIndex, depthT) {
        const cx = this.scale.width / 2;
        const halfWidth =
            this.nearHalfWidth +
            (this.farHalfWidth - this.nearHalfWidth) * depthT;

        return cx + (laneIndex - 1) * halfWidth;
    }

    depthT(z) {
        return Phaser.Math.Clamp(z / this.SPAWN_Z, 0, 1);
    }

    screenY(depthT) {
        const eased = Math.pow(depthT, 1.6);
        return this.baseY + (this.horizonY - this.baseY) * eased;
    }

    scaleByDepth(depthT) {
        const eased = Math.pow(depthT, 1.6);
        return 1 + (0.12 - 1) * eased;
    }

    // ===== FIXED entity rendering =====
    updateEntity(ent) {

        const t = this.depthT(ent.z);
        const x = this.laneXAtDepth(ent.lane, t);
        const y = this.screenY(t);
        const s = this.scaleByDepth(t);

        ent.sprite.x = x;
        ent.sprite.y = y;
        ent.sprite.setDepth(10 + (1 - t) * 20);

        if (ent.type === "coin") {
            const size = ent.size * s;
            ent.sprite.setDisplaySize(size, size);
        }

        if (ent.type === "bar") {
            ent.sprite.setDisplaySize(ent.w * s, ent.h * s);
        }

        if (ent.type === "ground") {
            const size = ent.size * s;
            ent.sprite.setDisplaySize(size, size);
        }
    }

    // ===== jump =====
    tryJump() {
        if (this.isJumping) return;

        this.isJumping = true;

        this.tweens.add({
            targets: this.player,
            y: this.baseY - 120,
            duration: 250,
            ease: "Sine.easeOut",
            yoyo: true,
            onComplete: () => {
                this.isJumping = false;
                this.player.y = this.baseY;
            }
        });
    }

    // ===== spawn =====
    spawnEntity(type, lane, zOffset = 0) {

        let sprite;

        if (type === "bar") {
            sprite = this.add.rectangle(0, 0, 120, 40, 0xff4444);
        }

        else if (type === "ground") {
            sprite = this.add.rectangle(0, 0, 70, 70, 0x00ff00);
        }

        else {
            sprite = this.add.circle(0, 0, 18, 0xffff00);
        }

        const ent = {
            type,
            lane,
            z: this.SPAWN_Z + zOffset,
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

        if (r < 0.4) {
            this.spawnEntity("bar", lane);
        }
        else if (r < 0.7) {
            this.spawnEntity("ground", lane);
        }
        else {
            for (let i = 0; i < 3; i++) {
                this.spawnEntity("coin", lane, i * 6);
            }
        }
    }

    // ===== update loop =====
    update(time, delta) {

        if (this.gameOver) return;

        const dt = delta / 1000;

        // speed
        this.elapsedTime += dt;
        this.zSpeed = Math.min(
            this.zMaxSpeed,
            this.zBaseSpeed + this.elapsedTime * 0.4
        );

        // background fixed (NO movement)
        this.background.setScrollFactor(0);

        // ground movement (optional feel)
        this.groundStrip.tilePositionY -= this.zSpeed * dt * 6;

        // controls
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) this.changeLane(-1);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) this.changeLane(1);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.tryJump();

        // score
        this.score += dt * 10;
        this.scoreText.setText("Score: " + Math.floor(this.score));

        // FIX PLAYER POSITION
        this.player.x = this.laneXAtDepth(this.currentLane, 0);
        this.player.y = this.baseY;

        // entities update
        for (let i = this.entities.length - 1; i >= 0; i--) {

            const ent = this.entities[i];

            ent.z -= this.zSpeed * dt;

            this.updateEntity(ent);

            // collision
            if (!ent.hit && ent.lane === this.currentLane && ent.z <= this.HIT_Z) {
                ent.hit = true;

                if (ent.type === "coin") {
                    ent.sprite.destroy();
                    this.entities.splice(i, 1);
                    this.score += 20;
                    continue;
                }

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

        if (this.spawnTimer > this.nextSpawnIn) {
            this.spawnTimer = 0;
            this.nextSpawnIn = Phaser.Math.Between(900, 1400);
            this.spawnWave();
        }
    }

    changeLane(dir) {
        const newLane = this.currentLane + dir;
        if (newLane < 0 || newLane > 2) return;
        this.currentLane = newLane;
    }
}