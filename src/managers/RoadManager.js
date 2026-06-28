export default class RoadManager {

    constructor(scene){

        this.scene = scene;

        this.speed = 8;

        this.lines = [];

        for(let i=0;i<20;i++){

            const line = scene.add.rectangle(
                360,
                i*80,
                8,
                40,
                0xffffff
            );

            this.lines.push(line);

        }

    }

    update(){

        this.lines.forEach(line=>{

            line.y += this.speed;

            if(line.y > 1300){

                line.y = -40;

            }

        });

    }

}