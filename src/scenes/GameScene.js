import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }

    create() {
        // ====== المقاسات ======
        this.w = this.scale.width;
        this.h = this.scale.height;

        // ====== الخلفية (تمتد طول الشاشة) ======
        this.bg = this.add.tileSprite(0, 0, this.w, this.h, "background")
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(0);

        // ====== الأرض ======
        this.groundY = this.h - 120;

        this.ground = this.add.rectangle(
            this.w / 2,
            this.groundY + 60,
            this.w,
            120,
            0x222222
        );
        this.physics.add.existing(this.ground, true);

        // ====== اللاعب ======
        this.player = this.physics.add.sprite(120, this.groundY - 40, "player");
        this.player.setCollideWorldBounds(true);
        this.player.setGravityY(1200);
        this.player.setDepth(2);

        // ====== كوينز ======
        this.coins = this.physics.add.group();

        // ====== حواجز ======
        this.obstacles = this.physics.add.group();

        // ====== تصادمات ======
        this.physics.add.collider(this.player, this.ground);
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
        this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, null, this);

        // ====== Score ======
        this.score = 0;
        this.scoreText = this.add.text(20, 20, "Score: 0", {
            fontSize: "28px",
            fill: "#fff"
        }).setDepth(10);

        // ====== Coins Text ======
        this.coinCount = 0;
        this.coinText = this.add.text(20, 60, "Coins: 0", {
            fontSize: "28px",
            fill: "#ffd700"
        }).setDepth(10);

        // ====== حركة النط ======
        this.input.on("pointerdown", () => {
            if (this.player.body.touching.down) {
                this.player.setVelocityY(-600);
            }
        });

        // ====== توليد الكوينز ======
        this.time.addEvent({
            delay: 1200,
            loop: true,
            callback: () => {
                let coin = this.coins.create(this.w + 50, this.groundY - 150, "coin");
                coin.setVelocityX(-220);
                coin.setGravityY(-1200);
                coin.setDepth(2);
            }
        });

        // ====== توليد الحواجز ======
        this.time.addEvent({
            delay: 1800,
            loop: true,
            callback: () => {
                let obs = this.obstacles.create(this.w + 50, this.groundY - 40, "obstacle");
                obs.setVelocityX(-260);
                obs.setImmovable(true);
                obs.setDepth(2);
            }
        });
    }

    update() {
        // تحريك الخلفية
        this.bg.tilePositionX += 2;

        // حذف العناصر اللي خرجت
        this.coins.children.iterate(c => {
            if (c && c.x < -50) c.destroy();
        });

        this.obstacles.children.iterate(o => {
            if (o && o.x < -50) o.destroy();
        });
    }

    collectCoin(player, coin) {
        coin.destroy();
        this.coinCount += 1;
        this.score += 10;

        this.coinText.setText("Coins: " + this.coinCount);
        this.scoreText.setText("Score: " + this.score);
    }

    hitObstacle() {
        this.physics.pause();
        this.player.setTint(0xff0000);

        this.time.delayedCall(1000, () => {
            this.scene.restart();
        });
    }
}