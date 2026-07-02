import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    create() {

        const w = this.scale.width;
        const h = this.scale.height;

        // ================= BACKGROUND =================
        this.add.image(w / 2, h / 2, "background")
            .setDisplaySize(w, h)
            .setDepth(0);

        // ================= GROUND =================
        this.groundY = h - 110;

        this.groundStrip = this.add.tileSprite(
            w / 2,
            this.groundY + 55,
            w,
            110,
            "ground"
        ).setDepth(1);

        // ================= CAMERA FIX =================
        this.cameras.main.setScroll(0, 0);
        this.cameras.main.roundPixels = true;

        // ================= LANES =================
        this.nearHalfWidth = w * 0.30;
        this.farHalfWidth = w * 0.05;

        this.horizonY = h * 0.22;

        this.SPAWN_Z = 60;
        this.HIT_Z = 4;
        this.CLEANUP_Z = -6;

        this.currentLane = 1;

        // ================= PLAYER =================
        this.player = this.add.sprite(w / 2, 0, "playerRun");

        const size = h * 0.16;
        const aspect = this.player.width / this.player.height;

        this.player.setDisplaySize(size * aspect, size);
        this.player.setDepth(50);

        this.standHeight = this.player.displayHeight;
        this.baseY = this.groundY - (this.standHeight / 2);

        this.player.y = this.baseY;

        // ================= ANIMATIONS =================
        this.anims.create({
            key: "run",
            frames: this.anims.generateFrameNumbers("playerRun", {
                start: 0,
                end: 5
            }),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: "jump",
            frames: this.anims.generateFrameNumbers("playerJump", {
                start: 0,
                end: 1
            }),
            frameRate: 10,
            repeat: 0
        });

        this.anims.create({
            key: "slide",
            frames: this.anims.generateFrameNumbers("playerSlide", {
                start: 0,
                end: 3
            }),
            frameRate: 14,
            repeat: 0
        });

        this.player.play("run");

        // ================= STATE =================
        this.isJumping = false;
        this.isDucking = false;

        this.entities = [];

        this.zSpeed = 20; // 🔥 faster for forward feel
        this.score = 0;

        // ================= INPUT =================
        this.cursors = this.input.keyboard.createCursorKeys();

        // ================= UI =================
        this.scoreText = this.add.text(20, 20, "Score: 0", {
            fontSize: "24px",
            color: "#fff"
        }).setDepth(100);

        // ================= SPAWN =================
        this.spawnTimer = 0;
        this.nextSpawnIn = 1500;
    }

    // ================= LANES =================
    laneX(lane, t) {
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

    // ================= ENTITY =================
    updateEntity(e) {

        const t = this.depthT(e.z);

        e.sprite.x = this.laneX(e.lane, t);
        e.sprite.y = this.yFromDepth(t);

        if (e.type === "bar") {
            e.sprite.setDisplaySize(e.w, e.h);
            e.sprite.setAngle(0);
        }

        if (e.type === "coin") {
            e.sprite.setDisplaySize(e.size, e.size);
        }
    }

    // ================= CONTROLS =================
    changeLane(dir) {

        const next = this.currentLane + dir;

        if (next < 0 || next > 2) return;

        this.currentLane = next;

        this.tweens.add({
            targets: this.player,
            x: this.laneX(this.currentLane, 0),
            duration: 150,
            ease: "Sine.easeOut"
        });
    }

    tryJump() {

        if (this.isJumping || this.isDucking) return;

        this.isJumping = true;

        this.player.play("jump");

        this.tweens.add({
            targets: this.player,
            y: this.baseY - 140,
            duration: 280,
            yoyo: true,
            ease: "Sine.easeOut",
            onComplete: () => {
                this.isJumping = false;
                this.player.y = this.baseY;
                this.player.play("run");
            }
        });
    }

    beginDuck() {

        if (this.isJumping) return;

        this.isDucking = true;

        this.player.play("slide");

        this.player.setScale(1, 0.6);
        this.player.y = this.baseY + 25;
    }

    endDuck() {

        this.isDucking = false;

        this.player.setScale(1, 1);
        this.player.y = this.baseY;

        this.player.play("run");
    }

    // ================= SPAWN =================
    spawnEntity(type, lane, zOffset = 0) {

        let sprite;

        if (type === "coin") sprite = this.add.image(0, 0, "coin");
        if (type === "bar") sprite = this.add.image(0, 0, "barTexture");
        if (type === "ground") sprite = this.add.image(0, 0, "slime");

        const e = {
            type,
            lane,
            z: this.SPAWN_Z + zOffset,
            sprite,
            size: 60,
            w: 120,
            h: 80
        };

        this.updateEntity(e);
        this.entities.push(e);
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

    // ================= UPDATE =================
    update(time, delta) {

        const dt = delta / 1000;

        // INPUT
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) this.changeLane(-1);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) this.changeLane(1);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.tryJump();

        if (this.cursors.down.isDown) this.beginDuck();
        else this.endDuck();

        // SCORE
        this.score += dt * 10;
        this.scoreText.setText("Score: " + Math.floor(this.score));

        // FORWARD FEEL (important 🔥)
        this.groundStrip.tilePositionX += this.zSpeed * dt * 2;
        this.zSpeed = Math.min(60, this.zSpeed + dt * 0.8);

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