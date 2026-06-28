import Phaser from "phaser";

import BootScene from "./scenes/BootScene.js";
import MenuScene from "./scenes/MenuScene.js";
import GameScene from "./scenes/GameScene.js";

const config = {
    type: Phaser.AUTO,

    parent: "game",

    backgroundColor: "#151933",

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 480,
        height: 854
    },

    physics: {
        default: "arcade",
        arcade: {
            gravity: {
                y: 0
            },
            debug: false
        }
    },

    scene: [
        BootScene,
        MenuScene,
        GameScene
    ]
};

new Phaser.Game(config);