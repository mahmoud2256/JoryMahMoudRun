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
            .setDisplaySize(w, h);

        // ================= GROUND =================
        this.groundY = h - 110;

        this.groundStrip = this.add.tileSprite(
            w / 2,
            this.groundY + 55,
            w,
            110,
            "ground"
        );

        // ================= PLAYER =================
        this.player = this.add.image(w / 2, this.groundY - 80, "playerRun");

        this.player.setDisplaySize(120, 120);

        this.currentLane = 1;

        this.laneX = (lane) => {
            return (w / 2) + (lane - 1) * 180;
        };

        // ================= STATE =================
        this.isJumping = false;
        this.isDucking = false;

        this.zSpeed = 18;

        // ================= INPUT =================
        this.cursors = this.input.keyboard.createCursorKeys();

        // ================= ENTITIES =================
        this.entities = [];

        this.spawnTimer = 0;
        this.nextSpawn = 1500;

        // ================= SCORE =================
        this.score = 0;

        this.scoreText = this.add.text(20, 20, "Score: 0", {
            fontSize: "24px",
            color: "#fff"
        });
    }

    // ================= CONTROLS =================
    changeLane(dir) {

        const next = this.currentLane + dir;

        if (next < 0 || next > 2) return;

        this.currentLane = next;

        this.tweens.add({
            targets: this.player,
            x: this.laneX(this.currentLane),
            duration: 150
        });
    }

    tryJump() {

        if (this.isJumping) return;

        this.isJumping = true;

        this.tweens.add({
            targets: this.player,
            y: this.player.y - 140,
            duration: 300,
            yoyo: true,
            onComplete: () => {
                this.isJumping = false;
            }
        });
    }

    beginDuck() {
        this.isDucking = true;
        this.player.setScale(1, 0.6);
    }

    endDuck() {
        this.isDucking = false;
        this.player.setScale(1, 1);
    }

    // ================= SPAWN =================
    spawnEntity() {

        const lane = Phaser.Math.Between(0, 2);

        const types = ["coin", "barTexture", "slime"];
        const type = Phaser.Utils.Array.GetRandom(types);

        const obj = this.add.image(
            this.laneX(lane),
            -50,
            type
        );

        obj.setDisplaySize(60, 60);

        this.entities.push(obj);
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

        // FORWARD FEEL
        this.groundStrip.tilePositionX += this.zSpeed * dt * 2;

        this.score += dt * 10;
        this.scoreText.setText("Score: " + Math.floor(this.score));

        // MOVE ENTITIES
        for (let i = this.entities.length - 1; i >= 0; i--) {

            const e = this.entities[i];

            e.y += this.zSpeed * dt * 60;

            if (e.y > 1400) {
                e.destroy();
                this.entities.splice(i, 1);
            }
        }

        // SPAWN
        this.spawnTimer += delta;

        if (this.spawnTimer > this.nextSpawn) {
            this.spawnTimer = 0;
            this.nextSpawn = Phaser.Math.Between(1000, 1600);
            this.spawnEntity();
        }
    }
}