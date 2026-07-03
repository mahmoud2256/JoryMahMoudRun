import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }

    create() {

        // ===== المقاسات =====
        this.width = this.scale.width;
        this.height = this.scale.height;

        // ===== كاميرا Runner =====
        this.cameras.main.setBounds(0, 0, 999999, this.height);
        this.physics.world.setBounds(0, 0, 999999, this.height);

        // ===== خلفية ثابتة (مش بتتحرك) =====
        this.background = this.add.image(
            this.width / 2,
            this.height / 2,
            "background"
        );

        this.background.setDisplaySize(this.width, this.height);
        this.background.setScrollFactor(0);

        // ===== أرض =====
        this.groundY = this.height - 120;

        // ===== اللاعب =====
        this.player = this.physics.add.sprite(150, this.groundY, "player");
        this.player.setCollideWorldBounds(true);
        this.player.setGravityY(1000);

        // الكاميرا تتبع اللاعب
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1);

        // ===== الحواجز =====
        this.obstacles = this.physics.add.group();

        // spawn
        this.time.addEvent({
            delay: 1400,
            loop: true,
            callback: this.spawnObstacle,
            callbackScope: this
        });

        // ===== تصادم =====
        this.physics.add.collider(
            this.player,
            this.obstacles,
            this.hitObstacle,
            null,
            this
        );

        // ===== تحكم =====
        this.input.on("pointerdown", () => {
            this.jump();
        });

        this.cursors = this.input.keyboard.createCursorKeys();

        this.gameSpeed = 350;
        this.distance = 0;
    }

    update() {

        // قفز
        if (this.cursors.space.isDown || this.cursors.up.isDown) {
            this.jump();
        }

        // مسافة (اختياري للـ score بعدين)
        this.distance += 1;

        // تنظيف الحواجز
        this.obstacles.getChildren().forEach((obstacle) => {
            if (obstacle.x < this.player.x - 800) {
                obstacle.destroy();
            }
        });
    }

    jump() {
        if (this.player.body.blocked.down) {
            this.player.setVelocityY(-520);
        }
    }

    spawnObstacle() {

        const spawnX = this.player.x + 900;

        const obstacle = this.obstacles.create(
            spawnX,
            this.groundY,
            "obstacle"
        );

        obstacle.setVelocityX(-this.gameSpeed);
        obstacle.setImmovable(true);
        obstacle.setGravityY(0);
    }

    hitObstacle() {

        this.physics.pause();
        this.player.setTint(0xff0000);

        this.time.delayedCall(800, () => {
            this.scene.restart();
        });
    }
}