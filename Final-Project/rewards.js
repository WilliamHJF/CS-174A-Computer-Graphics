import {defs, tiny} from './examples/common.js';
const {vec3, vec4, color, Mat4, Light, Shape, Material, Shader, Texture, Scene, hex_color} = tiny;
const {Triangle, Square, Tetrahedron, Windmill, Cube, Subdivision_Sphere} = defs;
import { Shape_From_File } from "./examples/obj-file-demo.js";

export class Texture_Data {
    // **Test_Data** pre-loads some Shapes and Textures that other Scenes can borrow.
    constructor() {
        this.textures = {
            rgb: new Texture("assets/rgb.jpg"),
            earth: new Texture("assets/earth.gif"),
            grid: new Texture("assets/grid.png"),
            stars: new Texture("assets/stars.png"),
            text: new Texture("assets/text.png"),
        }
        this.shapes = {
            donut: new defs.Torus(15, 15, [[0, 2], [0, 1]]),
            cone: new defs.Closed_Cone(4, 10, [[0, 2], [0, 1]]),
            capped: new defs.Capped_Cylinder(4, 12, [[0, 2], [0, 1]]),
            ball: new defs.Subdivision_Sphere(3, [[0, 1], [0, 1]]),
            spiky: new Shape_From_File("./assets/spiky.obj"),
            coin: new Shape_From_File("./assets/tinker.obj"),
            diamond: new Shape_From_File("./assets/diamond.obj")
        };
        const shader = new defs.Fake_Bump_Map(1);
        this.materials = {
            coin: new Material(new defs.Phong_Shader(),
                {ambient: 0.5, diffusivity: 0.3, color: hex_color("#ffff00"), specularity: 1}),
            diamond:  new Material(new defs.Phong_Shader(),
                {ambient: 0.7, diffusivity: 0.5, color: hex_color("#ADD8E6"), specularity: 1}),
            rand: new Material(shader, {
                color: color(.4, .8, .4, 1),
                ambient: 0.4, diffusivity: 0, specularity: 0, texture: this.textures.stars
            }),
            spiky: new Material(new defs.Phong_Shader(),
                {ambient: 0.6, diffusivity: 0.5, color: hex_color("#EE4B2B"), specularity: 1}),
        }
    }

    random_shape(shape_list = this.shapes) {
        // random_shape():  Extract a random shape from this.shapes.

        // const shape_names = Object.keys(shape_list);
        // return shape_list[shape_names[~~(shape_names.length * Math.random())]]
        const choice = Math.floor(Math.random() * 8);
        if (choice === 0 || choice === 1 ) {
            return [this.shapes.coin, this.materials.coin]
        } else if (choice === 2) {
            return [this.shapes.diamond, this.materials.diamond]
        } else if (choice === 4 || choice === 5 ) {
            return [this.shapes.ball, this.materials.rand.override(color(.6, .6 * Math.random(), .6 * Math.random(), 1))]
        } else if (choice === 7 || choice === 6 ) {
            return [this.shapes.spiky, this.materials.spiky]
        } else if (choice === 3) {
            return [this.shapes.donut, this.materials.rand.override(color(.6, .6 * Math.random(), .6 * Math.random(), 1))]
        }
    }
}

export class Rewards {
    constructor() {
        Object.assign(this, {time_accumulator: 0, time_scale: 1, t: 0, dt: 1 / 2, steps_taken: 0});
        this.objects = [];
        this.data = new Texture_Data();
        this.shapes = Object.assign({}, this.data.shapes);
        this.speed = 0.05
    }

    draw(context, program_state) {
        while (this.objects.length < 2) {
            const shape_obj = this.data.random_shape();
            const shape = shape_obj[0]
            const material = shape_obj[1]
            //console.log("shape", shape)
            const size = vec3(0.3, 0.3*(1 + Math.random()), 0.3);
            const center = vec3(10, 5, -33).randomized(6);
            const linear_velocity = vec3(0, -1, 5).randomized(2).normalized().times(3);
            const angular_velocity = Math.random();
            this.objects.push({shape, material, size, center, linear_velocity, angular_velocity});
        }

        for (let obj of this.objects) {
            obj.linear_velocity[0] = 0;
            // Apply gravity:
            obj.linear_velocity[1] += this.dt * -9.8 * 0.1;
            obj.linear_velocity[2] += 0.8;
            // Reverse y velocity if about to fall through floor:
            if (obj.center[1] < 0 && obj.linear_velocity[1] < 0) {
                obj.linear_velocity[1] *= -.5;
            }

            // Advance the object:
            obj.center = obj.center.plus(obj.linear_velocity.times(this.dt * this.speed));
        }

        // Draw the objects:
        for (let obj of this.objects) {
            let model_transform = Mat4.identity();
            if (obj.shape === this.shapes.donut || obj.shape === this.shapes.spiky) {
                model_transform = Mat4.translation(...obj.center).times(Mat4.scale(...obj.size));
            } else {
                model_transform = Mat4.translation(...obj.center).times(Mat4.scale(...obj.size)).times(Mat4.rotation(-Math.PI/2, 1, 0, 0));
            }
            obj.shape.draw(context, program_state, model_transform, obj.material);
        }

        // Filter out objects that stop or stray too far away:
        this.objects = this.objects.filter(obj => obj.center[2] < 2 && obj.linear_velocity.norm() > 2);
    }
}