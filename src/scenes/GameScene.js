import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    create() {

        const width = this.scale.width;
        const height = this.scale.height;

        // =========================
        // BACKGROUND (FIX ONLY)
        // =========================
        this.background = this.add.tileSprite(
            width / 2,
            height / 2,
            width,
            height,
            "background"
        );

        this.background.setDepth(0);
        this.background.setScrollFactor(0);

        this.groundY = height - 110;

        this.groundStrip = this.add.tileSprite(
            width / 2,
            this.groundY + 55,
            width,
            110,
            "ground"
        );
        this.groundStrip.setDepth(1);

        // =========================
        // KEEP YOUR SYSTEM (UNCHANGED)
        // =========================
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

        // =========================
        // PLAYER (UNCHANGED)
        // =========================
        const hasAnim = this.textures.exists("playerRunAnim");

        if (!this.anims.exists("run") && hasAnim) {
            this.anims.create({
                key: "run",
                frames: this.anims.generateFrameNumbers("playerRunAnim", {
                    start: 0,
                    end: 5
                }),
                frameRate: 12,
                repeat: -1
            });
        }

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

        // =========================
        // HUD (UNCHANGED)
        // =========================
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
        });
        this.scoreText.setDepth(100);

        this.coinsCollected = 0;

        this.coinsText = this.add.text(20, 55, "Coins : 0", {
            fontSize: "22px",
            color: "#ffd54f",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 3
        });
        this.coinsText.setDepth(100);

        this.lives = 3;

        this.lifeText = this.add.text(20, 90, "Lives : 3", {
            fontSize: "22px",
            color: "#ff6666",
            stroke: "#000000",
            strokeThickness: 3
        });
        this.lifeText.setDepth(100);

        // =========================
        // INPUT (UNCHANGED)
        // =========================
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

            const deltaX = pointer.x - this.pointerStartX;
            const deltaY = pointer.y - this.pointerStartY;

            if (deltaY > SWIPE_THRESHOLD && Math.abs(deltaY) > Math.abs(deltaX)) {
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

            const deltaX = pointer.x - this.pointerStartX;
            const deltaY = pointer.y - this.pointerStartY;
            const deltaTime = this.time.now - this.pointerStartTime;

            if (deltaTime <= SWIPE_MAX_TIME) {

                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    if (deltaX > SWIPE_THRESHOLD) this.changeLane(1);
                    else if (deltaX < -SWIPE_THRESHOLD) this.changeLane(-1);
                } else {
                    if (deltaY < -SWIPE_THRESHOLD) this.tryJump();
                    else if (deltaY > SWIPE_THRESHOLD) this.quickDuck();
                }
            }
        });

        this.spawnTimer = 0;
        this.nextSpawnIn = 1500;
    }

    // =========================
    // EVERYTHING BELOW (UNCHANGED)
    // =========================

    laneXAtDepth(laneIndexFloat, depthT) {
        const cx = this.scale.width / 2;
        const halfWidth = this.nearHalfWidth + (this.farHalfWidth - this.nearHalfWidth) * depthT;
        return cx + (laneIndexFloat - 1) * halfWidth;
    }

    depthTForZ(z) {
        return Phaser.Math.Clamp(z / this.SPAWN_Z, 0, 1);
    }

    screenYForDepth(depthT) {
        const eased = Math.pow(depthT, 1.6);
        return this.baseY + (this.horizonY - this.baseY) * eased;
    }

    relativeScaleForDepth(depthT) {
        const eased = Math.pow(depthT, 1.6);
        return 1.0 + (0.12 - 1.0) * eased;
    }

    updateEntityVisual(ent) {
        const depthT = this.depthTForZ(ent.z);
        const screenX = this.laneXAtDepth(ent.lane, depthT);
        const screenY = this.screenYForDepth(depthT);
        const rel = this.relativeScaleForDepth(depthT);

        ent.sprite.setPosition(screenX, screenY);
        ent.sprite.setDepth(10 + (1 - depthT) * 20);

        if (ent.type === "ground") {
            ent.sprite.setDisplaySize(ent.nearSize * rel, ent.nearSize * rel);
        } else if (ent.type === "coin") {
            ent.sprite.setDisplaySize(ent.nearSize * rel, ent.nearSize * rel);
        } else if (ent.type === "bar") {
            ent.sprite.setDisplaySize(ent.nearWidth * rel, ent.nearHeight * rel);
        }
    }

    changeLane(direction) {
        const newLane = this.currentLane + direction;
        if (newLane < 0 || newLane > 2) return;
        if (this.isDucking) return;

        this.currentLane = newLane;

        this.tweens.add({
            targets: this.player,
            x: this.laneXAtDepth(this.currentLane, 0),
            duration: 180,
            ease: "Sine.easeOut"
        });
    }

    tryJump() {
        if (this.isJumping || this.isDucking) return;

        this.isJumping = true;

        if (!this.hasAnim) this.player.setTexture("playerJump");
        if (this.hasAnim) this.player.stop();

        const jumpHeight = this.standHeight * 1.55;

        this.tweens.add({
            targets: this.player,
            y: this.baseY - jumpHeight,
            duration: 300,
            ease: "Sine.easeOut",
            yoyo: true,
            onComplete: () => {
                this.isJumping = false;
                this.player.y = this.baseY;
                if (this.hasAnim) this.player.play("run");
            }
        });
    }

    beginDuck() {
        if (this.isJumping || this.isDucking) return;

        this.isDucking = true;

        this.tweens.add({
            targets: this.player,
            scaleY: this.baseScaleY * this.duckScaleFactor,
            y: this.groundY - (this.standHeight * this.duckScaleFactor) / 2,
            duration: 150
        });
    }

    endDuck() {
        if (!this.isDucking) return;

        this.isDucking = false;

        this.tweens.add({
            targets: this.player,
            scaleY: this.baseScaleY,
            y: this.baseY,
            duration: 150
        });
    }

    quickDuck() {
        if (this.isJumping || this.isDucking) return;

        this.beginDuck();
        this.time.delayedCall(550, () => this.endDuck());
    }

    update(time, delta) {

        if (this.gameOver) return;

        const dt = delta / 1000;

        this.background.tilePositionY -= 2;
        this.groundStrip.tilePositionY -= this.zSpeed * 8 * dt;

        this.elapsedTime += dt;
        this.zSpeed = Math.min(this.zMaxSpeed, this.zBaseSpeed + this.elapsedTime * this.zRampRate);

        this.score += dt * 12;
        this.scoreText.setText("Score : " + Math.floor(this.score));

        for (let i = this.entities.length - 1; i >= 0; i--) {

            const ent = this.entities[i];

            ent.z -= this.zSpeed * dt;

            this.updateEntityVisual(ent);

            if (ent.z <= this.HIT_Z && ent.lane === this.currentLane) {
                this.resolveEntity(ent, i);
            }

            if (ent.z <= this.CLEANUP_Z) {
                if (ent.sprite) ent.sprite.destroy();
                this.entities.splice(i, 1);
            }
        }

        this.spawnTimer += delta;

        if (this.spawnTimer >= this.nextSpawnIn) {
            this.spawnTimer = 0;
            this.nextSpawnIn = Phaser.Math.Between(1100, 1700);
            this.spawnWave();
        }
    }

    spawnEntity(type, lane, zOffset = 0) {

        let key = "slime";

        if (type === "coin") key = "coin";
        else if (type === "bar") key = "barTexture";

        const sprite = this.add.image(0, 0, key);

        const ent = {
            type,
            lane,
            z: this.SPAWN_Z + zOffset,
            sprite,
            resolved: false,
            nearSize: type === "coin" ? 46 : 70,
            nearWidth: 110,
            nearHeight: this.standHeight * 0.18
        };

        this.updateEntityVisual(ent);
        this.entities.push(ent);
    }

    spawnWave() {

        const lane = Phaser.Math.Between(0, 2);
        const r = Math.random();

        if (r < 0.4) this.spawnEntity("bar", lane);
        else if (r < 0.7) this.spawnEntity("slime", lane);
        else this.spawnEntity("coin", lane);

        if (Math.random() < 0.3) {
            this.spawnEntity("coin", Phaser.Math.Between(0, 2), 12);
        }
    }

    resolveEntity(ent, index) {

        if (ent.type === "coin") {
            ent.sprite.destroy();
            this.entities.splice(index, 1);

            this.score += 15;
            this.coinsCollected++;
            this.coinsText.setText("Coins : " + this.coinsCollected);
            return;
        }

        this.applyHit();
    }

    applyHit() {

        if (this.invincible) return;

        this.lives--;
        this.lifeText.setText("Lives : " + this.lives);

        this.invincible = true;

        this.player.setTint(0xff0000);

        this.time.delayedCall(500, () => {
            this.player.clearTint();
            this.invincible = false;
        });

        if (this.lives <= 0) {
            this.showGameOver();
        }
    }

    showGameOver() {
        this.gameOver = true;
        this.scene.restart(); // بسيط زي ما عندك
    }
}