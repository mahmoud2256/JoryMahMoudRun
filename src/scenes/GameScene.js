import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    create() {

        const width = this.scale.width;
        const height = this.scale.height;

        // الخلفية كـ tileSprite عشان تتحرك (parallax)
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
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 3
        });
        this.lifeText.setDepth(100);

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
            const size = ent.nearSize * rel;
            ent.sprite.setDisplaySize(size, size);
        } else if (ent.type === "coin") {
            const size = ent.nearSize * rel;
            ent.sprite.setDisplaySize(size, size);
        } else if (ent.type === "bar") {
            const size = Phaser.Math.Clamp(ent.nearWidth * rel, 90, 260);

            ent.sprite.setDisplaySize(size, size);
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
        if (this.cache.audio.exists("jump")) this.sound.play("jump");
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
                else this.player.setTexture(this.isDucking ? "playerIdle" : "playerRun");
            }
        });
    }

    beginDuck() {
        if (this.isJumping || this.isDucking) return;
        this.isDucking = true;
        if (!this.hasAnim) this.player.setTexture("playerIdle");
        if (this.hasAnim) this.player.stop();
        this.tweens.add({
            targets: this.player,
            scaleY: this.baseScaleY * this.duckScaleFactor,
            y: this.groundY - (this.standHeight * this.duckScaleFactor) / 2,
            duration: 150,
            ease: "Sine.easeOut"
        });
    }

    endDuck() {
        if (!this.isDucking) return;
        this.isDucking = false;
        if (this.hasAnim) this.player.play("run");
        else this.player.setTexture("playerRun");
        this.tweens.add({
            targets: this.player,
            scaleY: this.baseScaleY,
            y: this.baseY,
            duration: 150,
            ease: "Sine.easeOut"
        });
    }

    quickDuck() {
        if (this.isJumping || this.isDucking) return;
        this.beginDuck();
        this.time.delayedCall(550, () => { this.endDuck(); });
    }

    update(time, delta) {

        if (this.gameOver) return;

        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.tryJump();
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) this.changeLane(-1);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) this.changeLane(1);
        if (this.cursors.down.isDown && !this.isDucking && !this.isJumping) this.beginDuck();
        if (!this.cursors.down.isDown && this.isDucking) this.endDuck();

        const dt = delta / 1000;

        this.elapsedTime += dt;
        this.zSpeed = Math.min(this.zMaxSpeed, this.zBaseSpeed + this.elapsedTime * this.zRampRate);

        // الخلفية بتتحرك ببطء (parallax) - إحساس العمق
        this.background.tilePositionY -= this.zSpeed * 1.5 * dt;

        // الأرضية بتتحرك أسرع - إحساس الجري على الطريق
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

    spawnEntity(type, lane, zOffset) {
        let sprite;
        if (type === "ground") sprite = this.add.image(0, 0, "slime");
        else if (type === "coin") sprite = this.add.image(0, 0, "coin");
        else if (type === "bar") sprite = this.add.image(0, 0, "barTexture");
        const ent = {
            type, lane,
            z: this.SPAWN_Z + zOffset,
            sprite,
            resolved: false,
            nearSize: type === "coin" ? 46 : 70,
            nearWidth: 220,
            nearHeight: this.standHeight * 220
        };
        this.updateEntityVisual(ent);
        this.entities.push(ent);
        return ent;
    }

    spawnWave() {
        const roll = Math.random();
        const lane = Phaser.Math.Between(0, 2);
        if (roll < 0.35) {
            this.spawnEntity("ground", lane, 0);
        } else if (roll < 0.65) {
            this.spawnEntity("bar", lane, 0);
        } else {
            for (let i = 0; i < 4; i++) this.spawnEntity("coin", lane, i * 5);
        }
        if (Math.random() < 0.3) {
            const bonusLane = Phaser.Math.Between(0, 2);
            this.spawnEntity("coin", bonusLane, 12);
        }
    }

    resolveEntity(ent, index) {
        if (ent.type === "coin") {
            ent.sprite.destroy();
            this.entities.splice(index, 1);
            if (this.cache.audio.exists("coinSound")) this.sound.play("coinSound");
            this.score += 15;
            this.coinsCollected++;
            this.coinsText.setText("Coins : " + this.coinsCollected);
            return;
        }
        if (ent.type === "ground" && this.isJumping) return;
        if (ent.type === "bar" && this.isDucking) return;
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
            if (this.cache.audio.exists("gameOver")) this.sound.play("gameOver");
            this.showGameOver();
        }

    }

    showGameOver() {

        this.gameOver = true;

        const width = this.scale.width;
        const height = this.scale.height;

        if (this.hasAnim) this.player.stop();

        const overlay = this.add.rectangle(
            width / 2, height / 2,
            width, height,
            0x000000, 0.75
        );
        overlay.setDepth(200);

        this.add.text(width / 2, height * 0.32, "GAME OVER", {
            fontSize: "48px",
            fontStyle: "bold",
            color: "#ff3333",
            stroke: "#000000",
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(201);

        this.add.text(width / 2, height * 0.45, "Score : " + Math.floor(this.score), {
            fontSize: "28px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(201);

        this.add.text(width / 2, height * 0.53, "Coins : " + this.coinsCollected, {
            fontSize: "24px",
            color: "#ffd54f",
            stroke: "#000000",
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(201);

        const retryBtn = this.add.text(width / 2, height * 0.68, "▶  PLAY AGAIN", {
            fontSize: "30px",
            fontStyle: "bold",
            backgroundColor: "#00C853",
            color: "#ffffff",
            padding: { left: 28, right: 28, top: 14, bottom: 14 }
        }).setOrigin(0.5).setDepth(201);

        retryBtn.setInteractive();
        retryBtn.on("pointerdown", () => { this.scene.restart(); });

        const menuBtn = this.add.text(width / 2, height * 0.80, "MAIN MENU", {
            fontSize: "22px",
            color: "#cccccc",
            stroke: "#000000",
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(201);

        menuBtn.setInteractive();
        menuBtn.on("pointerdown", () => { this.scene.start("MenuScene"); });

    }

}
