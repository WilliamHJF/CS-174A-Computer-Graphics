import {defs, tiny} from './examples/common.js';
import {Text_Line} from './examples/text-demo.js';
const {vec3, vec4, vec, color, Mat4, Light, Shape, Material, Shader, Texture, Scene} = tiny;
import {Spectrum} from "./spectrum.js"
import {Rewards} from "./rewards.js";
import {Boat} from "./boat.js";

class Game_Base {
    constructor(boat, rewards) {
        this.rewards = rewards;
        this.boat = boat;
        //this.boat_position = this.getPositionFromMatrix(this.boat.model_transform)

        this.shapes = new Text_Line(45);
        this.materials = new Material(new defs.Textured_Phong(1), {
            ambient: 1, diffusivity: 0, specularity: 0, texture: new Texture("assets/text.png"),
        });
        this.model_transform = Mat4.identity().times(Mat4.translation(15, 3, -5))
            .times(Mat4.scale(0.3, 0.3, 0.3))
            .times(Mat4.rotation(-Math.PI/24, 0, 0, 1))
            .times(Mat4.rotation(Math.PI/12, 0, 1, 0));
        this.score = 0;
    }
}

export class Game extends Game_Base {
    constructor(boat, rewards) {
        super(boat, rewards);
    }

    update(context, program_state) {
        this.shapes.set_string(this.score.toString(), context.context);
        this.checkCollision();
        this.shapes.draw(context, program_state, this.model_transform, this.materials);
    }

    checkCollision() {
        let toDelete = [];

        // Loop through the objects and store the indices of objects to be deleted
        for (let i = 0; i < this.rewards.objects.length; i++) {
            if ((this.rewards.objects[i].center[2] > -0.8
                && (this.boat.boat_x - 2 <= this.rewards.objects[i].center[0]
                    && this.rewards.objects[i].center[0]<= this.boat.boat_x + 2))) {
                //console.log("Hit A REWARD");
                this.boat.is_reward_hit = true;
                this.boat.hit_timer = 0.2;
                toDelete.push(i); // Add index to the toDelete array

                //Restart the game if the boat hits the cube
                if (this.rewards.objects[i].shape === this.rewards.shapes.spiky) {
                    gameover(this.score);
                } else if (this.rewards.objects[i].shape === this.rewards.shapes.ball){ //Score 2 points if the boat hits ball
                    this.score += 2;
                } else if (this.rewards.objects[i].shape === this.rewards.shapes.coin){ //Score 5 points if the boat hits coin
                    this.score += 5;
                } else if (this.rewards.objects[i].shape === this.rewards.shapes.diamond){ //Double the scores if the boat hits diamond
                    this.score += 10;
                }  else { //Otherwise, score 1 point (donut)
                    this.score += 1;
                }
            }
        }

        // Delete objects in reverse order to avoid shifting indices
        for (let i = toDelete.length - 1; i >= 0; i--) {
            this.rewards.objects.splice(toDelete[i], 1);
        }
    }
}