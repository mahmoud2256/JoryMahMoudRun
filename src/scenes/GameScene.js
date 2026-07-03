import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }

    create() {
        // ===== المقاسات =====
        this.width = this.scale.width;
        this.height = this.scale.height;

        // ===== الخلفية (ثابتة وتغطي الشاشة) =====
        this.background = this.add.image(
            this.width / 2,
            this.height / 2,
            "background"
        );

        this.background.setDisplaySize(this.width, this.height);
        this.background.setDepth(0);

        // ===== الأرض =====
        this.groundY = this.height - 120;

        // ===== اللاعب =====
        this.player = this.physics.add.sprite(120, this.groundY, "player");
        this.player.setCollideWorldBounds(true);
        this.player.setGravityY(900);
        this.player.setScale(1);

        // ===== الحواجز =====
        this.obstacles = this.physics.add.group();

        this.spawnTimer = this.time.addEvent({
            delay: 1500,
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

        // ===== التحكم باللمس =====
        this.input.on("pointerdown", () => {
            this.jump();
        });

        // ===== كيبورد =====
        this.cursors = this.input.keyboard.createCursorKeys();

        // ===== سرعة اللعبة =====
        this.gameSpeed = 260;
    }

    update() {
        // قفز بالكيبورد
        if (this.cursors.space.isDown || this.cursors.up.isDown) {
            this.jump();
        }

        // حذف الحواجز اللي خرجت برا الشاشة
        this.obstacles.getChildren().forEach((obstacle) => {
            if (obstacle.x < -50) {
                obstacle.destroy();
            }
        });
    }

    jump() {
        if (this.player.body.touching.down) {
            this.player.setVelocityY(-520);
        }
    }

    spawnObstacle() {
        const obstacle = this.obstacles.create(
            this.width + 50,
            this.groundY,
            "obstacle"
        );

        obstacle.setVelocityX(-this.gameSpeed);
        obstacle.setImmovable(true);
        obstacle.setGravityY(0);
        obstacle.setScale(1);

        // ارتفاع بسيط لو عايز تنويع
        obstacle.y = this.groundY;
    }

    hitObstacle() {
        // إعادة تشغيل بسيطة عند الاصطدام
        this.physics.pause();
        this.player.setTint(0xff0000);

        this.time.delayedCall(800, () => {
            this.scene.restart();
        });
    }
}