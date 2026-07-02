import Phaser from "phaser";

import BootScene from "./scenes/BootScene";
import MenuScene from "./scenes/MenuScene";
import GameScene from "./scenes/GameScene";

const config = {

    type: Phaser.AUTO,

    parent: "game",

    width: 1080,

    height: 1920,

    backgroundColor: "#000000",

    scale: {

        mode: Phaser.Scale.ENVELOP,

        autoCenter: Phaser.Scale.CENTER_BOTH,

    width: 1080,

    height: 1920,

    },

    physics: {

        default: "arcade",

        arcade: {

            gravity: {

                y: 1200

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

export default config;