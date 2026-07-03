import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    create() {

        const width = this.scale.width;
        const height = this.scale.height;

        // الخلفية ثابتة (مش tile scrolling)
        this.background = this.add.image(
            width / 2,
            height / 2,
            "background"
        ).setDisplaySize(width, height);

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

        this.horizonY = height * 0.35;
        this.nearHalfWidth = width * 0.42;
        this.farHalfWidth = width * 0.02;
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

        if (!this.anims.exists("run")) {
            this.anims.create({
                key: "run",
                frames: this.anims.generateFrameNumbers("playerRunAnim", { start: 0, end: 5 }),
                frameRate: 12,
                repeat: -1
            });
        }

        const hasAnim = this.textures.exists("playerRunAnim");

        this.player = this.add.sprite(
            this.laneXAtDepth(this.currentLane, 0),
            0,
            hasAnim ? "playerRunAnim" : "playerRun"
        );

        const targetPlayerHeight = height * 0.16;
        const nativeAspect = hasAnim
            ? (160 / 320)
            : (this.player.width / this.player.height);

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

        this.hasAnim = hasAnim;

        if (this.hasAnim) this.player.play("run");

        this.isJumping = false;
        this.isDucking = false;
        this.invincible = false;
        this.gameOver = false;

        const isDesktop = this.sys.game.device.os.desktop;
        this.duckScaleFactor = isDesktop ? 0.55 : 0.4;

        this.entities = [];

        this.zBaseSpeed = 16;
        this.zMaxSpeed = 55;
        this.zSpeed = this.zBaseSpeed;
        this.zRampRate = 0.4;
        this.elapsedTime = 0;

        this.hudBackdrop = this.add.graphics();
        this.hudBackdrop.setDepth(99);
        this.hudBackdrop.fillStyle(0x000000, 0.35);
        this.hudBackdrop.fillRoundedRect(10, 10, 175, 120, 12);

        this.score = 0;

        this.scoreText = this.add.text(20, 20, "Score : 0", {
            fontSize: "26px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 4
        }).setDepth(100);

        this.coinsCollected = 0;

        this.coinsText = this.add.text(20, 55, "Coins : 0", {
            fontSize: "22px",
            color: "#ffd54f",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 3
        }).setDepth(100);

        this.lives = 3;

        this.lifeText = this.add.text(20, 90, "Lives : 3", {
            fontSize: "22px",
            color: "#ff6666",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 3
        }).setDepth(100);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.pointerStartX = 0;
        this.pointerStartY = 0;
        this.pointerStartTime = 0;
        this.duckHoldActive = false;

        const SWIPE_THRESHOLD = 35;
        const SWIPE_MAX_TIME = 600;

        this.input.on("pointerdown", (pointer) => {
            if (this.gameOver) return;
            this.pointerStartX = pointer.x;
            this.pointerStartY = pointer.y;
            this.pointerStartTime = this.time.now;
            this.duckHoldActive = false;
        });

        this.input.on("pointermove", (pointer) => {
            if (this.gameOver) return;
            if (!pointer.isDown) return;
            if (this.duckHoldActive) return;
            if (this.isJumping) return;

            const dx = pointer.x - this.pointerStartX;
            const dy = pointer.y - this.pointerStartY;

            if (dy > SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
                this.duckHoldActive = true;
                this.beginDuck();
            }
        });

        this.input.on("pointerup", (pointer) => {
            if (this.gameOver) return;

            if (this.duckHoldActive) {
                this.endDuck();
                this.duckHoldActive = false;
                return;
            }

            const dx = pointer.x - this.pointerStartX;
            const dy = pointer.y - this.pointerStartY;
            const dt = this.time.now - this.pointerStartTime;

            if (dt <= SWIPE_MAX_TIME) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    if (dx > SWIPE_THRESHOLD) this.changeLane(1);
                    else if (dx < -SWIPE_THRESHOLD) this.changeLane(-1);
                } else {
                    if (dy < -SWIPE_THRESHOLD) this.tryJump();
                    else if (dy > SWIPE_THRESHOLD) this.quickDuck();
                }
            }
        });

        this.spawnTimer = 0;
        this.nextSpawnIn = 1500;
    }

    update(time, delta) {

        if (this.gameOver) return;

        const dt = delta / 1000;

        this.elapsedTime += dt;
        this.zSpeed = Math.min(this.zMaxSpeed, this.zBaseSpeed + this.elapsedTime * this.zRampRate);

        // ❌ الخلفية ثابتة (اتشالت الحركة نهائي)
        // this.background.tilePositionY -= ...

        // الأرض فقط تتحرك
        this.groundStrip.tilePositionY -= this.zSpeed * 8 * dt;

        if (!this.isJumping && !this.isDucking) {
            if (this.hasAnim) {
                if (!this.player.anims.isPlaying) this.player.play("run");
            } else {
                this.player.setTexture("playerRun");
            }
        }

        this.score += dt * 12;
        this.scoreText.setText("Score : " + Math.floor(this.score));

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

    // باقي الكود زي ما هو بدون أي تغيير
}