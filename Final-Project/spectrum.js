import {defs, tiny} from './examples/common.js';
// Pull these names into this module's scope for convenience:
const {vec3, vec4, color, hex_color, Mat4, Light, Shape, Material, Shader, Texture, Scene} = tiny;
const {Triangle, Square, Tetrahedron, Windmill, Cube, Subdivision_Sphere, Line} = defs;



export class Spectrum {
    constructor() {
        Object.assign(this, {rows: 20, columns: 35});

        this.shapes = {
            cube: new defs.Line(),
            background: new defs.Subdivision_Sphere(4),
        };
        const shader = new defs.Fake_Bump_Map();
        this.brick = new Material(shader, {
            color: color(1, 1, 1, 1),
            ambient: .05, diffusivity: .5, specularity: .5, smoothness: 10,
            texture: new Texture("assets/lines5.png")
        })

        this.background = new Material(shader, {
            ambient: 1.0,
            texture: new Texture("assets/galaxy.jpg")
        })

        this.box_positions = [];
        this.row_lights = {};
        this.column_lights = {};
        // Make initial grid of boxes at random heights:
        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                const x = row;
                const period = 4; // Period of the sine wave
                const y = -2 + 2 * Math.sin((column / this.columns) * (2 * Math.PI / period)); // Adjusted sine function
                const z = -column;
                this.box_positions.push(vec3(x, y, z));
            }
        }


        // The lights lists will function as a lookup table for the light in a current row and column:
        // Make initial light positions.  One light per row, and one light per column:
        for (let c = 0; c < this.columns; c++)
            this.row_lights    [~~(-c)] = vec3(2 * Math.random() * this.rows, -Math.random(), -c);
        for (let r = 0; r < this.rows; r++)
            this.column_lights [~~(r)] = vec3(r, -Math.random(), -2 * Math.random() * this.columns);
    }

    draw(context, program_state) {
        // here: camera
        program_state.set_camera(Mat4.look_at(vec3(this.rows / 2, 4, 4), vec3(this.rows / 2, 0, -4), vec3(0, 1, 1) ));
        let model_transform = Mat4.identity()
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, 1, 500);
        model_transform = model_transform.times(Mat4.scale(0.05, 0.5, 2))
            .times(Mat4.translation(1, -0.5, -0.8))
            .times(Mat4.rotation((Math.PI/2), 1, 0, 0))

        // To draw each individual box, select the two lights sharing
        // a row and column with it, and draw using those.
        this.box_positions.forEach((p, i, a) => {
            program_state.lights = [
                new Light(this.row_lights[~~p[2]].to4(1), getColorFromXPosition(p[0]), 50000),
                new Light(this.column_lights[~~p[0]].to4(1), getColorFromXPosition(p[0]), 50000),
                new Light(model_transform, getColorFromXPosition(p[0]), 100000),
            ];

            if (i % 5 === 0 && i > 50 && i < 650) {
                // y is up and down, z is forward and back, left is left and right
                // this.shapes.cube.draw(context, program_state,  Mat4.translation(p[0], 0, p[1] * 2).times(model_transform), this.brick);
                this.shapes.cube.draw(context, program_state,  Mat4.translation(p[0], 1.3, -(Math.floor(Math.random() * 45) - 5)).times(model_transform)
                    .times(Mat4.translation(5, 0, 3)), this.brick);
                this.shapes.cube.draw(context, program_state,  Mat4.translation(p[0], 1.3, -(Math.floor(Math.random() * 45) - 5)).times(model_transform)
                    .times(Mat4.translation(7, 0, 3)), this.brick);
                this.shapes.cube.draw(context, program_state,  Mat4.translation(p[0], 1.3, -(Math.floor(Math.random() * 45) - 5)).times(model_transform)
                    .times(Mat4.translation(8, 0, 3)), this.brick);
                this.shapes.cube.draw(context, program_state,  Mat4.translation(p[0], 1.3, -(Math.floor(Math.random() * 45) - 5)).times(model_transform)
                    .times(Mat4.translation(10, 0, 3)), this.brick);
                this.shapes.cube.draw(context, program_state,  Mat4.translation(p[0], 1.3, -(Math.floor(Math.random() * 45) - 5)).times(model_transform)
                    .times(Mat4.translation(13, 0, 3)), this.brick);
                this.shapes.cube.draw(context, program_state,  Mat4.translation(p[0], 1.31, -(Math.floor(Math.random() * 45) - 5)).times(model_transform)
                    .times(Mat4.translation(15, 0, 3)), this.brick);
                this.shapes.cube.draw(context, program_state,  Mat4.translation(p[0], 1.31, -(Math.floor(Math.random() * 45) - 5)).times(model_transform)
                    .times(Mat4.translation(17, 0, 3)), this.brick);
                this.shapes.cube.draw(context, program_state,  Mat4.translation(p[0], 1.3, -(Math.floor(Math.random() * 45) - 5)).times(model_transform)
                    .times(Mat4.translation(20, 0, 3)), this.brick);

                this.shapes.cube.draw(context, program_state,  Mat4.translation(p[0], 1.31, -(Math.floor(Math.random() * 8) - 7)).times(model_transform)
                    .times(Mat4.translation(16, 0, 3)), this.brick);
                this.shapes.cube.draw(context, program_state,  Mat4.translation(p[0], 1.31, -(Math.floor(Math.random() * 8) - 10)).times(model_transform)
                    .times(Mat4.translation(9, 0, 3)), this.brick);
                this.shapes.cube.draw(context, program_state,  Mat4.translation(p[0], 1.31, -(Math.floor(Math.random() * 10) - 8)).times(model_transform)
                    .times(Mat4.translation(12, 0, 3)), this.brick);
                this.shapes.cube.draw(context, program_state,  Mat4.translation(p[0], 1.31, -(Math.floor(Math.random() * 12) - 8)).times(model_transform)
                    .times(Mat4.translation(10.5, 0, 3)), this.brick);
                this.shapes.cube.draw(context, program_state,  Mat4.translation(p[0], 1.31, -(Math.floor(Math.random() * 12) - 8)).times(model_transform)
                    .times(Mat4.translation(14, 0, 3)), this.brick);

            }

            this.box_positions.forEach((p, i, a) => {
                a[i] = p.plus(vec3(0, 0, program_state.animation_delta_time / 1000));
                if (a[i][2] > 1) a[i][2] = -this.columns + .001;
            });

            // Set galaxy as background
            if (i == 0) {
                const bg_radius = 300
                const bg_transformation = Mat4.scale(bg_radius, bg_radius, bg_radius)
                    .times(Mat4.rotation(0.05 * program_state.animation_time / 1000, 0, 1, 0));
                this.shapes.background.draw(context, program_state, bg_transformation, this.background);
            }
        });

        if (!program_state.animate || program_state.animation_delta_time > 500)
            return;
        // Move some lights forward along columns, then bound them to a range.
        for (const [key, val] of Object.entries(this.column_lights)) {
            this.column_lights[key][2] -= program_state.animation_delta_time / 30;
            this.column_lights[key][2] %= this.columns * 2;
        }
        // Move other lights forward along rows, then bound them to a range.
        // for (const [key, val] of Object.entries(this.row_lights)) {
        //     this.row_lights[key][0] += program_state.animation_delta_time / 500;
        //     this.row_lights[key][0] %= this.rows * 5;
        // }
        // Move the boxes backwards, then bound them to a range.

    }
}

function getColorFromXPosition(x) {
    // Randomly choose between the color above and below with a 20% chance each
    const randomChance = Math.random();
    const chanceToChooseAbove = 0.3;
    const chanceToChooseBelow = 0.3;

    if (randomChance < chanceToChooseAbove) {
        // Choose the color above
        if (x < 4) {
            return color(1, 0, 0, 1); // Red
        } else if (x <= 6) {
            return color(1.5, 1, 0, 1); // Orange
        } else if (x <= 8) {
            return color(1, 1, 0, 1); // Yellow
        } else if (x <= 9) {
            return color(0, 1, 0, 1); // Green
        } else if (x <= 10) {
            return color(0, 1, 0.67, 1); // Light Green
        } else if (x <= 14) {
            return color(0, 1, 0.67, 1)
        }
        else {
            return color(0, 0, 1, 1); // Purple
        }
    } else if (randomChance < chanceToChooseAbove + chanceToChooseBelow) {
        // Choose the color below
        if (x <= 4) {
            return color(2, 0, 0, 1); // Red
        } else if (x <= 6) {
            return color(2, 1.5, 0, 1); // Orange
        } else if (x <= 8) {
            return color(2, 2, 0, 1); // Yellow
        } else if (x <= 9) {
            return color(0, 2, 0, 1); // Green
        } else if (x <= 10) {
            return color(0, 2, 1.5, 1); // Light Green
        } else if (x <= 14) {
            return color(0, 0, 2, 1); // Blue
        } else if (x <= 16) {
            return color(1, 1, 2, 1); // Blue
        } else {
            return color(2, 0, 2, 1); // Purple
        }
    } else {
        // Default behavior (choose the original color)
        if (x < 4) {
            return color(1, 0, 0, 1); // Red
        } else if (x <= 5) {
            return color(1, 0.5, 0, 1); // Orange
        } else if (x <= 6) {
            return color(1, 1, 0, 1); // Yellow
        } else if (x <= 8) {
            return color(0, 1, 0, 1); // Green
        } else if (x <= 10) {
            return color(0, 1, 0.67, 1); // Light Green
        } else if (x <= 14) {
            return color(0, 0, 1, 1); // Blue
        }  else {
            return color(1, 0, 1, 1); // Purple
        }
    }
}
