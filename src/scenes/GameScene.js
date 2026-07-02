import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    create() {

        const width = this.scale.width;
        const height = this.scale.height;

        this.background = this.add.image(width / 2, height / 2, "background");
        this.background.setDisplaySize(width, height);
        this.background.setDepth(0);

        this.groundY = height - 110;

        this.groundStrip = this.add.tileSprite(
            width / 2,
            this.groundY + 55,
            width,
            110,
            "ground"
        );
        this.groundStrip.setDepth(1);

        this.horizonY = height * 0.22;
        this.nearHalfWidth = width * 0.30;
        this.farHalfWidth = width * 0.05;

        this.SPAWN_Z = 60;
        this.HIT_Z = 4;
        this.CLEANUP_Z = -6;

        this.currentLane = 1;

        this.player = this.add.sprite(
            this.laneXAtDepth(this.currentLane, 0),
            0,
            "playerRun"
        );

        const targetPlayerHeight = height * 0.16;
        const aspect = this.player.width / this.player.height;

        this.player.setDisplaySize(targetPlayerHeight * aspect, targetPlayerHeight);

        this.baseScaleX = this.player.scaleX;
        this.baseScaleY = this.player.scaleY;

        this.standHeight = this.player.displayHeight;
        this.baseY = this.groundY - (this.standHeight / 2);
        this.player.y = this.baseY;

        this.player.setDepth(50);

        this.isJumping = false;
        this.isDucking = false;
        this.invincible = false;

        this.entities = [];

        this.zBaseSpeed = 16;
        this.zMaxSpeed = 55;
        this.zSpeed = this.zBaseSpeed;
        this.zRampRate = 0.4;
        this.elapsedTime = 0;

        this.score = 0;
        this.coinsCollected = 0;
        this.lives = 3;

        this.scoreText = this.add.text(20, 20, "Score : 0", { fontSize: "26px", color: "#fff" }).setDepth(100);
        this.coinsText = this.add.text(20, 55, "Coins : 0", { fontSize: "22px", color: "#ffd54f" }).setDepth(100);
        this.lifeText = this.add.text(20, 90, "Lives : 3", { fontSize: "22px", color: "#ff6666" }).setDepth(100);

        this.spawnTimer = 0;
        this.nextSpawnIn = 1500;
    }

    // ======================
    // LANE SYSTEM
    // ======================

    laneXAtDepth(laneIndex, depthT) {
        const cx = this.scale.width / 2;
        const halfWidth = this.nearHalfWidth + (this.farHalfWidth - this.nearHalfWidth) * depthT;
        return cx + (laneIndex - 1) * halfWidth;
    }

    depthTForZ(z) {
        return Phaser.Math.Clamp(z / this.SPAWN_Z, 0, 1);
    }

    screenYForDepth(t) {
        const eased = Math.pow(t, 1.6);
        return this.baseY + (this.horizonY - this.baseY) * eased;
    }

    updateEntityVisual(ent) {
        const t = this.depthTForZ(ent.z);

        const x = this.laneXAtDepth(ent.lane, t);
        const y = this.screenYForDepth(t);
        const s = 1 + (0.12 - 1) * Math.pow(t, 1.6);

        ent.sprite.setPosition(x, y);
        ent.sprite.setDepth(10 + (1 - t) * 20);

        // 👇 مهم: إصلاح اتجاه الحواجز
        if (ent.type === "bar") {
            ent.sprite.setDisplaySize(ent.nearWidth * s, ent.nearHeight * s);
            ent.sprite.setAngle(90); // 🔥 يخليه واقف بالطول بدل العرض
        }

        if (ent.type === "coin") {
            ent.sprite.setDisplaySize(ent.nearSize * s, ent.nearSize * s);
        }

        if (ent.type === "ground") {
            ent.sprite.setDisplaySize(ent.nearSize * s, ent.nearSize * s);
        }
    }

    // ======================
    // UPDATE LOOP
    // ======================

    update(time, delta) {

        const dt = delta / 1000;
        this.elapsedTime += dt;

        this.zSpeed = Math.min(
            this.zMaxSpeed,
            this.zBaseSpeed + this.elapsedTime * this.zRampRate
        );

        this.score += dt * 12;
        this.scoreText.setText("Score : " + Math.floor(this.score));

        // ======================
        // MOVE ENTITIES
        // ======================
        for (let i = this.entities.length - 1; i >= 0; i--) {

            const ent = this.entities[i];

            ent.z -= this.zSpeed * dt;

            this.updateEntityVisual(ent);

            if (!ent.resolved &&
                ent.lane === this.currentLane &&
                ent.z <= this.HIT_Z
            ) {
                ent.resolved = true;
                this.resolveEntity(ent, i);
            }

            if (ent.z <= this.CLEANUP_Z) {
                ent.sprite.destroy();
                this.entities.splice(i, 1);
            }
        }

        // ======================
        // SPAWN FIXED (NO DUPLICATION)
        // ======================
        this.spawnTimer += delta;

        if (this.spawnTimer >= this.nextSpawnIn) {
            this.spawnTimer = 0;

            this.nextSpawnIn =
                Phaser.Math.Between(1100, 1700) *
                (this.zBaseSpeed / this.zSpeed);

            this.spawnWave();
        }
    }

    // ======================
    // SPAWN
    // ======================

    spawnEntity(type, lane, zOffset = 0) {

        let sprite;

        if (type === "ground") sprite = this.add.image(0, 0, "slime");
        if (type === "coin") sprite = this.add.image(0, 0, "coin");
        if (type === "bar") sprite = this.add.image(0, 0, "barTexture");

        const ent = {
            type,
            lane,
            z: this.SPAWN_Z + zOffset,
            sprite,
            resolved: false,
            nearSize: 70,
            nearWidth: 110,
            nearHeight: this.standHeight * 0.18
        };

        this.updateEntityVisual(ent);
        this.entities.push(ent);

        return ent;
    }

    spawnWave() {
        const lane = Phaser.Math.Between(0, 2);
        const roll = Math.random();

        if (roll < 0.35) {
            this.spawnEntity("ground", lane);
        }
        else if (roll < 0.65) {
            this.spawnEntity("bar", lane);
        }
        else {
            for (let i = 0; i < 4; i++) {
                this.spawnEntity("coin", lane, i * 5);
            }
        }
    }
}