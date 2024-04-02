import {defs, tiny} from './examples/common.js';
import {Spectrum} from "./spectrum.js"
import {Rewards} from "./rewards.js";
import {Boat} from "./boat.js";
import {Game} from "./game.js"

const {vec3, vec4, color, hex_color, Mat4, Light, Shape, Material, Shader, Texture, Scene} = tiny;
const {Triangle, Square, Tetrahedron, Windmill, Cube, Subdivision_Sphere} = defs;

export class Sailing_The_Spectrum_Base extends Scene {
    constructor() {
        super();
        this.spectrum = new Spectrum();
        this.rewards = new Rewards();
        this.boat = new Boat();
        this.game = new Game(this.boat, this.rewards);

        this.bg_music = new Audio("assets/bgm.mp3");
        this.bg_music.loop = true;
        this.music = true;
    }

    make_control_panel() {
        this.key_triggered_button("Left", ["ArrowLeft"], () => {
            this.boat.update_boat_position(vec3(1,0,0));
        }, "blue");
        this.key_triggered_button("Right", ["ArrowRight"], () => {
            this.boat.update_boat_position(vec3(-1,0,0));
        }, "blue");
        this.new_line();

        this.key_triggered_button("Speed Up", ['ArrowUp'], () => {
            if (this.rewards.speed + 0.05 <= 0.2) {
                this.rewards.speed += 0.05;
            }
            console.log(this.rewards.speed);
        }, "green");
        this.key_triggered_button("Speed Down", ['ArrowDown'], () => {
            if (this.rewards.speed - 0.05 >= 0.05) {
                this.rewards.speed -= 0.05;
            }
            console.log(this.rewards.speed);
        }, "green");
        this.new_line();

        this.key_triggered_button("Play/Pause Music", ["m"], () => {
            this.music = !this.music;
        }, "black");

        this.key_triggered_button("Restart", ["r"], () => {
            location.reload();
        }, "red");
    }

    display(context, program_state) {

        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());

            program_state.set_camera(Mat4.look_at(vec3(20 / 2, 5, 5), vec3(20 / 2, 0, -4), vec3(0, 1, 0)));
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        if(this.music) {
            // this.bg_music.play();
        } else {
            this.bg_music.pause();
        }
    }
}


export class Sailing_The_Spectrum extends Sailing_The_Spectrum_Base {

    display(context, program_state) {

        super.display(context, program_state);

        this.spectrum.draw(context, program_state);
        this.rewards.draw(context, program_state);
        this.boat.draw(context, program_state);
        this.game.update(context, program_state);
    }
}