import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    create() {

        const width = this.scale.width;
        const height = this.scale.height;

    // =========================
    // BACKGROUND (STATIC)
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
    // GROUND (MOVING ONLY)
    // =========================
        this.groundY = height - 110;

        this.ground = this.add.tileSprite(
            width / 2,
            this.groundY + 55,
            width,
            110,
            "ground"
        );
        this.ground.setDepth(1);

    // =========================
    // CAMERA EFFECTS
    // =========================
        this.cameraShakePower = 0;

    // =========================
    // LANES SYSTEM
    // =========================
        this.currentLane = 1;
        this.lanesX = [0, 1, 2];

        this.horizonY = height * 0.35;
        this.nearWidth = width * 0.42;
        this.farWidth = width * 0.02;

    // =========================
    // PLAYER
    // =========================
        this.player = this.add.image(
            this.laneX(1),
            this.groundY - 80,
            "playerRun"
        );

        this.player.setDepth(50);

        this.playerBaseY = this.player.y;

        this.isJumping = false;
        this.isDucking = false;

        // Lean effect
        this.playerLean = 0;

    // =========================
    // GAME STATE
    // =========================
        this.entities = [];

        this.speed = 18;
        this.maxSpeed = 60;
        this.speedIncrease = 0.02;

    // =========================
    // INPUT
    // =========================
        this.cursors = this.input.keyboard.createCursorKeys();

        this.input.on("pointerdown", (p) => {
            this.startX = p.x;
            this.startY = p.y;
        });

        this.input.on("pointerup", (p) => {
            let dx = p.x - this.startX;
            let dy = p.y - this.startY;

            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 40) this.changeLane(1);
                else if (dx < -40) this.changeLane(-1);
            } else {
                if (dy < -40) this.jump();
                else if (dy > 40) this.duck();
            }
        });

    // =========================
    // SPAWN TIMER
    // =========================
        this.spawnTimer = 0;
        this.spawnRate = 1200;
    }

    // =========================
    // LANE POSITION
    // =========================
    laneX(lane) {
        const center = this.scale.width / 2;
        const spacing = 140;
        return center + (lane - 1) * spacing;
    }
}
    update(time, delta) {

        const dt = delta / 1000;

    // =========================
    // SPEED INCREASE (SUBWAY FEEL)
    // =========================
        this.speed = Math.min(this.maxSpeed, this.speed + this.speedIncrease);

    // =========================
    // GROUND MOVEMENT ONLY
    // =========================
        this.ground.tilePositionY -= this.speed * 6 * dt;

    // =========================
    // PLAYER LEAN EFFECT RESET
    // =========================
        this.playerLean *= 0.85;
        this.player.x = Phaser.Math.Linear(
            this.player.x,
            this.laneX(this.currentLane) + this.playerLean,
            0.15
        );

    // =========================
    // JUMP UPDATE
    // =========================
        if (this.isJumping) {
            this.player.y -= 8;
            if (this.player.y <= this.playerBaseY - 120) {
                this.isJumping = false;
            }
        } else {
            this.player.y = Phaser.Math.Linear(this.player.y, this.playerBaseY, 0.2);
        }

    // =========================
    // CAMERA SHAKE
    // =========================
        if (this.cameraShakePower > 0) {
            this.cameras.main.shake(50, this.cameraShakePower);
            this.cameraShakePower *= 0.9;
        }

    // =========================
    // SPAWN TIMER
    // =========================
        this.spawnTimer += delta;

        if (this.spawnTimer > this.spawnRate) {
            this.spawnTimer = 0;
            this.spawnObstacle();
        }

    // =========================
    // UPDATE ENTITIES
    // =========================
        for (let i = this.entities.length - 1; i >= 0; i--) {
            let e = this.entities[i];
            e.z -= this.speed * dt;

            this.updateEntity(e);

            if (e.z < -10) {
                e.sprite.destroy();
                this.entities.splice(i, 1);
            }
        }
    }

    // =========================
    // LANE CHANGE
    // =========================
    changeLane(dir) {
        this.currentLane += dir;
        this.currentLane = Phaser.Math.Clamp(this.currentLane, 0, 2);

        this.playerLean = dir * 30;
    }

    // =========================
    // JUMP
    // =========================
    jump() {
        if (this.isJumping) return;
        this.isJumping = true;
        this.player.y = this.playerBaseY;
    }

    // =========================
    // DUCK
    // =========================
    duck() {
        if (this.isDucking) return;
        this.isDucking = true;

        this.tweens.add({
            targets: this.player,
            scaleY: 0.6,
            duration: 150,
            yoyo: true,
            onComplete: () => {
                this.isDucking = false;
                this.player.scaleY = 1;
            }
        });
    }    
    
    // =========================
    // SPAWN OBSTACLE / COINS
    // =========================
    spawnObstacle() {

        const lane = Phaser.Math.Between(0, 2);
        const typeRoll = Math.random();

        let type = "bar";

        if (typeRoll < 0.5) type = "bar";
        else type = "coin";

        const spriteKey = type === "coin" ? "coin" : "barTexture";

        const sprite = this.add.image(
            this.laneX(lane),
            this.horizonY,
            spriteKey
        );

        sprite.setDepth(10);

        const entity = {
            sprite: sprite,
            lane: lane,
            type: type,

            z: 100,

            baseSize: type === "coin" ? 30 : 80
        };

        this.entities.push(entity);
    }

    // =========================
    // UPDATE ENTITY (3D FEEL)
    // =========================
    updateEntity(e) {

        const t = e.z / 100;

        const scale = Phaser.Math.Linear(0.1, 1.2, 1 - t);

        const x = this.laneX(e.lane);
        const y = Phaser.Math.Linear(this.horizonY, this.groundY, 1 - t);

        e.sprite.x = x;
        e.sprite.y = y;

        e.sprite.setScale(scale);

        e.sprite.setDepth(10 + (1 - t) * 50);

        // collision check
        if (t < 0.15 && e.lane === this.currentLane) {

            this.hit(e);

        }
    }

    // =========================
    // COLLISION
    // =========================
    hit(e) {

        if (e.type === "coin") {
            e.sprite.destroy();
            e.type = "taken";
            return;
        }

        // obstacle hit
        this.cameraShakePower = 0.02;

        this.player.setTint(0xff0000);

        this.time.delayedCall(200, () => {
            this.player.clearTint();
        });

        // reset player position slightly
        this.player.x -= 20;
    }

    // =========================
    // SCORE UPDATE
    // =========================
    updateScore() {

        if (!this.score) this.score = 0;

        this.score += 0.1;

        if (!this.scoreText) {
            this.scoreText = this.add.text(20, 20, "Score: 0", {
                fontSize: "22px",
                color: "#ffffff"
            });
            this.scoreText.setDepth(100);
        }

        this.scoreText.setText("Score: " + Math.floor(this.score));
    }

    // =========================
    // GAME OVER
    // =========================
    gameOver() {

        this.physics.pause();

        this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            0x000000,
            0.6
        ).setDepth(200);

        this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 - 80,
            "GAME OVER",
            {
                fontSize: "42px",
                color: "#ff3333",
                fontStyle: "bold"
            }
        ).setOrigin(0.5).setDepth(201);

        this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            "Tap to Restart",
            {
                fontSize: "22px",
                color: "#ffffff"
            }
        ).setOrigin(0.5).setDepth(201);

        this.input.once("pointerdown", () => {
            this.scene.restart();
        });
    }

    // =========================
    // FINAL UPDATE HOOK FIX
    // =========================
    lateUpdate() {

    // update score every frame
        this.updateScore();

    // clean missing entities
        for (let i = this.entities.length - 1; i >= 0; i--) {

            if (!this.entities[i].sprite || !this.entities[i].sprite.active) {
                this.entities.splice(i, 1);
                this.lateUpdate();
            }
        }
    }