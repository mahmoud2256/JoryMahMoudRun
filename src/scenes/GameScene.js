import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }

    create() {
        // ======================
        // Responsive Scale Fix
        // ======================
        const width = this.scale.width;
        const height = this.scale.height;

        // ======================
        // Background (Fixed full screen)
        // ======================
        this.background = this.add.image(width / 2, height / 2, "background");
        this.background.setDisplaySize(width, height);
        this.background.setScrollFactor(0);
        this.background.setDepth(0);

        // ======================
        // Ground
        // ======================
        this.groundY = height - 120;

        // ======================
        // Player
        // ======================
        this.player = this.physics.add.sprite(100, this.groundY, "player");
        this.player.setCollideWorldBounds(true);
        this.player.setScale(1);

        // ======================
        // Obstacles Group
        // ======================
        this.obstacles = this.physics.add.group();

        // Spawn obstacle example
        this.time.addEvent({
            delay: 2000,
            loop: true,
            callback: () => {
                const obstacle = this.obstacles.create(
                    width + 50,
                    this.groundY,
                    "obstacle"
                );

                obstacle.setVelocityX(-250);
                obstacle.setImmovable(true);
            }
        });

        // ======================
        // Collision (Player vs Obstacle)
        // ======================
        this.physics.add.overlap(
            this.player,
            this.obstacles,
            (player, obstacle) => {
                obstacle.destroy(); // الحاجز يختفي عند التصادم
            }
        );

        // ======================
        // Mobile Controls Fix (basic jump example)
        // ======================
        this.input.on("pointerdown", () => {
            if (this.player.body.touching.down || this.player.body.blocked.down) {
                this.player.setVelocityY(-600);
            }
        });

        // ======================
        // Resize handling (important for mobile rotate)
        // ======================
        this.scale.on("resize", (gameSize) => {
            const w = gameSize.width;
            const h = gameSize.height;

            this.background.setPosition(w / 2, h / 2);
            this.background.setDisplaySize(w, h);

            this.groundY = h - 120;
        });
    }

    update() {
        // ممكن تضيف هنا أنيميشن أو حركة
    }
}