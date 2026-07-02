import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    create() {

        const width = this.scale.width;
        const height = this.scale.height;

        this.background = this.add.tileSprite(
            width / 2,
            height / 2,
            width,
            height,
            "background"
        );

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

        this.laneGraphics = this.add.graphics();
        this.laneGraphics.setDepth(2);
        this.laneGraphics.lineStyle(2, 0xffffff, 0.25);

        const nearY = this.groundY;

        [-0.5, 0.5, 1.5, 2.5].forEach((boundary) => {
            const nearX = this.laneXAtDepth(boundary, 0);
            const farX = this.laneXAtDepth(boundary, 1);
            this.laneGraphics.beginPath();
            this.laneGraphics.moveTo(nearX, nearY);
            this.laneGraphics.lineTo(farX, this.horizonY);
            this.laneGraphics.strokePath();
        });

        this.currentLane = 1;

        this.player = this.add.sprite(
            this.laneXAtDepth(this.currentLane, 0),
            0,
            "playerRun"
        );

        const targetPlayerHeight = height * 0.16;
        const nativeAspect = this.player.width / this.player.height;

        this.player.setDisplaySize(
            targetPlayerHeight * nativeAspect,
            targetPlayerHeight
        );

        this.baseScaleX = this.player.scaleX;
        this.baseScaleY = this.player.scaleY;

        this.player.setDepth(50);

        this.standHeight = this.player.displayHeight;
        this.baseY = this.groundY - (this.standHeight / 2);
        this.player.y = this.baseY;

        this.isJumping = false;
        this.isDucking = false;
        this.invincible = false;

        const isDesktop = this.sys.game.device.os.desktop;
        this.duckScaleFactor = isDesktop ? 0.55 : 0.4;

        this.entities = [];

        this.zBaseSpeed = 16;
        this.zMaxSpeed = 55;
        this.zSpeed = this.zBaseSpeed;
        this.zRampRate = 0.4;
        this.elapsedTime = 0;

        this.score = 0;
        this.coinsCollected = 0;
        this.lives = 3;

        this.cursors = this.input.keyboard.createCursorKeys();

        this.spawnTimer = 0;
        this.nextSpawnIn = 1500;
    }

    update(time, delta) {

        const dt = delta / 1000;

        this.elapsedTime += dt;
        this.zSpeed = Math.min(this.zMaxSpeed, this.zBaseSpeed + this.elapsedTime * this.zRampRate);

        // ❌ اتشالت حركة الخلفية عشان تبقى ثابتة
        // this.background.tilePositionY -= this.zSpeed * 4 * dt;
        // this.groundStrip.tilePositionY -= this.zSpeed * 8 * dt;

        this.score += dt * 12;

        for (let i = this.entities.length - 1; i >= 0; i--) {
            const ent = this.entities[i];
            ent.z -= this.zSpeed * dt;
            this.updateEntityVisual(ent);

            if (!ent.resolved && ent.lane === this.currentLane && ent.z <= this.HIT_Z) {
                ent.resolved = true;
                this.resolveEntity(ent, i);
            }

            if (ent.z <= this.CLEANUP_Z) {
                if (ent.sprite && ent.sprite.active) ent.sprite.destroy();
                this.entities.splice(i, 1);
            }
        }

        this.spawnTimer += delta;
        if (this.spawnTimer >= this.nextSpawnIn) {
            this.spawnTimer = 0;
            this.nextSpawnIn = Phaser.Math.Between(1100, 1700) * (this.zBaseSpeed / this.zSpeed);
            this.spawnWave();
        }
    }
}