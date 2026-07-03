import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    create() {

        const width = this.scale.width;
        const height = this.scale.height;

        // =========================
        // BACKGROUND
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
        // GROUND
        // =========================
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
        // CAMERA (UPGRADE)
        // =========================
        this.cameras.main.setLerp(0.08, 0.08);
        this.cameras.main.setDeadzone(0, 150);

        // =========================
        // PERSPECTIVE SYSTEM
        // =========================
        this.horizonY = height * 0.35;
        this.nearHalfWidth = width * 0.42;
        this.farHalfWidth = width * 0.02;

        this.SPAWN_Z = 60;
        this.HIT_Z = 4;
        this.CLEANUP_Z = -6;

        this.laneGraphics = this.add.graphics();
        this.laneGraphics.setDepth(2);
        this.laneGraphics.lineStyle(2, 0xffffff, 0.2);

        const nearY = this.groundY;

        [-0.5, 0.5, 1.5, 2.5].forEach((b) => {
            const nearX = this.laneXAtDepth(b, 0);
            const farX = this.laneXAtDepth(b, 1);

            this.laneGraphics.beginPath();
            this.laneGraphics.moveTo(nearX, nearY);
            this.laneGraphics.lineTo(farX, this.horizonY);
            this.laneGraphics.strokePath();
        });

        // =========================
        // PLAYER
        // =========================
        this.currentLane = 1;

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

        const targetH = height * 0.16;
        const aspect = hasAnim ? (160 / 320) : (this.player.width / this.player.height);

        this.player.setDisplaySize(targetH * aspect, targetH);
        this.player.setDepth(50);

        this.baseY = this.groundY - this.player.displayHeight / 2;
        this.player.y = this.baseY;

        this.hasAnim = hasAnim;

        if (this.hasAnim) this.player.play("run");

        this.isJumping = false;
        this.isDucking = false;
        this.invincible = false;
        this.gameOver = false;

        // =========================
        // GAME SYSTEM
        // =========================
        this.entities = [];

        this.zBaseSpeed = 16;
        this.zMaxSpeed = 60;
        this.elapsedTime = 0;
        this.zSpeed = this.zBaseSpeed;

        // =========================
        // FX
        // =========================
        this.hitFX = (x, y) => {
            const c = this.add.circle(x, y, 12, 0xff0000);
            this.tweens.add({
                targets: c,
                alpha: 0,
                scale: 3,
                duration: 300,
                onComplete: () => c.destroy()
            });
        };

        this.coinFX = (x, y) => {
            const c = this.add.circle(x, y, 8, 0xffd54f);
            this.tweens.add({
                targets: c,
                alpha: 0,
                scale: 2,
                duration: 200,
                onComplete: () => c.destroy()
            });
        };

        // =========================
        // HUD
        // =========================
        this.score = 0;
        this.coinsCollected = 0;
        this.lives = 3;

        this.scoreText = this.add.text(20, 20, "Score : 0", {
            fontSize: "26px",
            color: "#fff"
        }).setDepth(100);

        this.coinsText = this.add.text(20, 55, "Coins : 0", {
            fontSize: "22px",
            color: "#ffd54f"
        }).setDepth(100);

        this.lifeText = this.add.text(20, 90, "Lives : 3", {
            fontSize: "22px",
            color: "#ff6666"
        }).setDepth(100);

        // =========================
        // INPUT
        // =========================
        this.cursors = this.input.keyboard.createCursorKeys();

        this.input.on("pointerdown", (p) => {
            this.startX = p.x;
            this.startY = p.y;
            this.startTime = this.time.now;
        });

        this.input.on("pointerup", (p) => {

            const dx = p.x - this.startX;
            const dy = p.y - this.startY;
            const dt = this.time.now - this.startTime;

            if (dt < 600) {

                if (Math.abs(dx) > Math.abs(dy)) {
                    if (dx > 30) this.changeLane(1);
                    else if (dx < -30) this.changeLane(-1);
                } else {
                    if (dy < -30) this.tryJump();
                    else if (dy > 30) this.beginDuck();
                }
            }
        });

        this.spawnTimer = 0;
        this.nextSpawnIn = 1400;
    }

    // =========================
    // CORE MATH
    // =========================
    laneXAtDepth(lane, t) {
        const cx = this.scale.width / 2;
        const w = this.nearHalfWidth + (this.farHalfWidth - this.nearHalfWidth) * t;
        return cx + (lane - 1) * w;
    }

    depthT(z) {
        return Phaser.Math.Clamp(z / this.SPAWN_Z, 0, 1);
    }

    screenY(t) {
        return this.baseY + (this.horizonY - this.baseY) * Math.pow(t, 1.6);
    }

    scaleFor(t) {
        return 0.6 + (1 - t) * 0.6;
    }

    updateEntity(ent) {
        const t = this.depthT(ent.z);

        ent.sprite.x = this.laneXAtDepth(ent.lane, t);
        ent.sprite.y = this.screenY(t);

        const s = this.scaleFor(t);
        ent.sprite.setScale(s);

        ent.sprite.setDepth(10 + (1 - t) * 20);
    }

    // =========================
    // PLAYER
    // =========================
    changeLane(dir) {

        const nl = this.currentLane + dir;
        if (nl < 0 || nl > 2) return;

        this.currentLane = nl;

        this.tweens.add({
            targets: this.player,
            x: this.laneXAtDepth(this.currentLane, 0),
            duration: 120,
            ease: "Sine.easeOut"
        });
    }

    tryJump() {

        if (this.isJumping) return;

        this.isJumping = true;

        const h = this.player.displayHeight * 1.5;

        this.tweens.add({
            targets: this.player,
            y: this.baseY - h,
            duration: 250,
            yoyo: true,
            ease: "Sine.easeOut",
            onComplete: () => {
                this.isJumping = false;
                this.player.y = this.baseY;
            }
        });
    }

    beginDuck() {

        if (this.isDucking) return;

        this.isDucking = true;

        this.tweens.add({
            targets: this.player,
            scaleY: 0.5,
            duration: 120
        });
    }

    endDuck() {

        this.isDucking = false;

        this.tweens.add({
            targets: this.player,
            scaleY: 1,
            duration: 120
        });
    }

    // =========================
    // UPDATE LOOP
    // =========================
    update(time, delta) {

    if (this.gameOver) return;

    const dt = delta / 1000;

    // =========================
    // SPEED
    // =========================
    this.elapsedTime += dt;
    this.zSpeed = Math.min(this.zMaxSpeed, this.zBaseSpeed + this.elapsedTime * 0.6);

    // =========================
    // WORLD MOTION (FIXED - NO FALLING FEEL)
    // =========================
    this.background.tilePositionY -= this.zSpeed * 0.08;
    this.groundStrip.tilePositionY -= this.zSpeed * 0.12;

    // =========================
    // CAMERA STABILITY (FIX IMPORTANT)
    // =========================
    this.cameras.main.setZoom(this.zSpeed > 45 ? 1.06 : 1.04);

    // ❌ IMPORTANT FIX: REMOVE BOBBING THAT BREAKS JUMP
    
    // =========================
    // SCORE
    // =========================
    this.score += dt * 12;
    this.scoreText.setText("Score : " + Math.floor(this.score));

    // =========================
    // ENTITIES
    // =========================
    for (let i = this.entities.length - 1; i >= 0; i--) {

        const e = this.entities[i];

        e.z -= this.zSpeed * dt;

        this.updateEntity(e);

        if (e.lane === this.currentLane && e.z <= this.HIT_Z) {
            this.resolveEntity(e, i);
        }

        if (e.z <= this.CLEANUP_Z) {
            e.sprite.destroy();
            this.entities.splice(i, 1);
        }
    }

    // =========================
    // SPAWN
    // =========================
    this.spawnTimer += delta;

    if (this.spawnTimer > this.nextSpawnIn) {
        this.spawnTimer = 0;
        this.nextSpawnIn = Phaser.Math.Between(1200, 1700);
        this.spawnWave();
    }
}

    // =========================
    // SPAWN SYSTEM
    // =========================
    spawnEntity(type, lane, zOff = 0) {

        const key =
            type === "coin" ? "coin" :
            type === "bar" ? "barTexture" :
            "slime";

        const sprite = this.add.image(0, 0, key);

        const ent = {
            type,
            lane,
            z: this.SPAWN_Z + zOff,
            sprite
        };

        this.updateEntity(ent);
        this.entities.push(ent);
    }

    spawnWave() {

        const lane = Phaser.Math.Between(0, 2);
        const r = Math.random();

        if (r < 0.4) this.spawnEntity("bar", lane);
        else if (r < 0.7) this.spawnEntity("slime", lane);
        else this.spawnEntity("coin", lane);
    }

    // =========================
    // COLLISION
    // =========================
    resolveEntity(ent, index) {

        if (ent.type === "coin") {

            this.coinFX(ent.sprite.x, ent.sprite.y);

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

        this.hitFX(this.player.x, this.player.y);
        this.cameras.main.shake(200, 0.01);

        this.time.delayedCall(500, () => {
            this.player.clearTint();
            this.invincible = false;
        });

        if (this.lives <= 0) {
            this.gameOver = true;
            this.scene.restart();
        }
    }
}