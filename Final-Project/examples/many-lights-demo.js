import {defs, tiny} from './common.js';
// Pull these names into this module's scope for convenience:
const {vec3, vec4, color, Mat4, Light, Shape, Material, Shader, Texture, Scene, hex_color} = tiny;

export class Test_Data {
    // **Test_Data** pre-loads some Shapes and Textures that other Scenes can borrow.
    constructor() {
        this.textures = {
            rgb: new Texture("assets/water.jpg"),
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
            cube: new defs.Cube(),
            prism: new (defs.Capped_Cylinder.prototype.make_flat_shaded_version())(10, 10, [[0, 2], [0, 1]]),
            gem: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
            donut2: new (defs.Torus.prototype.make_flat_shaded_version())(20, 20, [[0, 2], [0, 1]]),
        };
    }

    random_shape(shape_list = this.shapes) {
        // random_shape():  Extract a random shape from this.shapes.
        const shape_names = Object.keys(shape_list);
        return shape_list[shape_names[~~(shape_names.length * Math.random())]]
    }
}

export class Many_Lights_Demo extends Scene {
    constructor() {
        super();
        Object.assign(this, {rows: 20, columns: 35});

        this.shapes = {cube: new defs.Cube()};
        let shader = new defs.Fake_Bump_Map();
        this.brick = new Material(shader, {
            color: color(1, 1, 1, 0.99),
            ambient: .05, diffusivity: .5, specularity: .5, smoothness: 10,
            texture: new Texture("assets/water.jpg")
        });

        // Don't create any DOM elements to control this scene:
        // this.widget_options = {make_controls: false};

        this.boat_positions = [];
        this.row_lights = {};
        this.column_lights = {};

        // Make initial grid of boxes at random heights:
        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                const x = row;
                const period = 4; // Period of the sine wave
                const y = -5 + 1 * Math.sin((column / this.columns) * (2 * Math.PI / period)); // Adjusted sine function
                const z = -column;
                // this.boat_positions.push(vec3(row, -2 - 2 * Math.random(), -column).randomized(1));
                this.boat_positions.push(vec3(x, y ,z, -column).randomized(1));
                this.boat_positions.push(vec3(x, y ,z, -column).randomized(1));
            }
        }

        // The lights lists will function as a lookup table for the light in a current row and column:
        // Make initial light positions.  One light per row, and one light per column:
        for (let c = 0; c < this.columns; c++)
            this.row_lights    [~~(-c)] = vec3(2 * Math.random() * this.rows, -Math.random(), -c);
        for (let r = 0; r < this.rows; r++)
            this.column_lights [~~(r)] = vec3(r, -Math.random(), -2 * Math.random() * this.columns);

        const phong = new defs.Phong_Shader();
        this.materials = {
            plastic: new Material(phong,
                {ambient: .2, diffusivity: .8, specularity: .5, color: color(.9, .5, .9, 1)}),
            metal: new Material(phong,
                {ambient: .2, diffusivity: .8, specularity: .8, color: color(.9, .5, .9, 1)})
        };


        this.box_rotation = 0; // Rotation angle in radians for sail boat
        this.boat_speed = 0;
        Object.assign(this, {time_accumulator: 0, time_scale: 1, t: 0, dt: 1 / 2, steps_taken: 0});
        this.objects = [];
        this.data = new Test_Data();
        this.shapes = Object.assign({}, this.data.shapes);
        this.shapes.square = new defs.Square();
        shader = new defs.Fake_Bump_Map(1);
        this.material = new Material(shader, {
            color: color(.4, .8, .4, 1),
            ambient: .4, texture: this.data.textures.stars
        })

        this.hit_timer = 0;
        this.box_hit = false;

    }

    random_color() {
        return this.material.override(color(.6, .6 * Math.random(), .6 * Math.random(), 1));
    }

    make_control_panel() {
        // make_control_panel(): Sets up a panel of interactive HTML elements, including
        // buttons with key bindings for affecting this scene, and live info readouts.
        this.control_panel.innerHTML += "Dragonfly rotation angle: ";
        // The next line adds a live text readout of a data member of our Scene.
        this.live_string(box => {
            box.textContent = (this.hover ? 0 : (this.t % (2 * Math.PI)).toFixed(2)) + " radians"
        });
        this.new_line();
        this.new_line();

        this.key_triggered_button("Left", ["ArrowLeft"], () => {
            this.box_rotation -= 0.5;
        }, "blue");

        this.key_triggered_button("Right", ["ArrowRight"], () => {
            this.box_rotation += 0.5;
        }, "blue");
        this.new_line();
        this.key_triggered_button("Speed Up", ['ArrowUp'], () => {
            this.boat_speed += 0.1;
        }, "green");
        this.key_triggered_button("Speed Down", ['ArrowDown'], () => {
            this.boat_speed -= 0.1;
        }, "green");
    }


    display(context, program_state) {                                         // display():  Draw each frame to animate the scene.
        // program_state.set_camera(Mat4.look_at(vec3(20 , 20, 20), vec3(this.rows / 2, 0, -4), vec3(0, 1, 0)));
        program_state.set_camera(Mat4.look_at(vec3(this.rows / 2, 5, 5), vec3(this.rows / 2, 0, -4), vec3(0, 1, 0)));

        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, 1, 500);



        // To draw each individual box, select the two lights sharing
        // a row and column with it, and draw using those.
        this.boat_positions.forEach((p, i, a) => {
            // console.log(p[1])
            program_state.lights = [new Light(this.row_lights   [~~p[2]].to4(1), getColorFromXPosition(p[0]), 9),
                new Light(this.column_lights[~~p[0]].to4(1), color(1, 1, p[0] % 1, 1), 9)];
            // Draw the box:
            this.shapes.cube.draw(context, program_state, Mat4.translation(p[0], p[1], p[2]).times(Mat4.scale(.3, 1, .3)), this.brick)
        });


        if (!program_state.animate || program_state.animation_delta_time > 500)
            return;
        // Move some lights forward along columns, then bound them to a range.
        for (const [key, val] of Object.entries(this.column_lights)) {
            this.column_lights[key][2] -= program_state.animation_delta_time / 50;
            this.column_lights[key][2] %= this.columns * 2;
        }
        // Move other lights forward along rows, then bound them to a range.
        for (const [key, val] of Object.entries(this.row_lights)) {
            this.row_lights[key][0] += program_state.animation_delta_time / 50;
            this.row_lights[key][0] %= this.rows * 2;
        }
        // Move the boxes backwards, then bound them to a range.
        this.boat_positions.forEach((p, i, a) => {
            a[i] = p.plus(vec3(0, 0, this.boat_speed + 3 * program_state.animation_delta_time / 1000));
            if (a[i][2] > 1) a[i][2] = -this.columns + .001;
        });


        const blue = hex_color("#1a9ffa"), yellow = hex_color("#fdc03a")

        let model_transform = Mat4.identity();
        model_transform = model_transform.times(Mat4.translation(10+this.box_rotation, 0, 0));

        model_transform = model_transform.times(Mat4.scale(.2,.2,.2));


        while (this.objects.length < 1) {
            const shape = this.data.random_shape();
            const material = this.random_color();
            const size = vec3(0.3, 0.3*(1 + Math.random()), 0.3);
            const center = vec3(10, 5, -20).randomized(10);
            const linear_velocity = vec3(0, -1, 5).randomized(2).normalized().times(3);
            const angular_velocity = Math.random();

            this.objects.push({shape, material, size, center, linear_velocity, angular_velocity});
        }

        for (let obj of this.objects) {
            obj.linear_velocity[0] = 0;
            obj.linear_velocity[2] += this.boat_speed;
            // Apply gravity:
            obj.linear_velocity[1] += this.dt * -9.8 * 0.1;

            // Reverse y velocity if about to fall through floor:
            if (obj.center[1] < 0 && obj.linear_velocity[1] < 0) {
                obj.linear_velocity[1] *= -.8;
            }

            // Advance the object:
            obj.center = obj.center.plus(obj.linear_velocity.times(this.dt * 0.05));
            if (obj.center[2] > -0.5 && obj.center[0] >= 10 + this.box_rotation - 1 && 10 + this.box_rotation + 1 >= obj.center[0]) {
                this.box_hit = true;
                this.hit_timer = 0.2;
            }
        }

        // Draw the objects:
        for (let obj of this.objects) {
            const model_transform = Mat4.translation(...obj.center).times(Mat4.scale(...obj.size));
            obj.shape.draw(context, program_state, model_transform, obj.material);
        }


        // Update the hit timer
        if (this.box_hit && this.hit_timer > 0) {
            this.hit_timer -= program_state.animation_delta_time / 1000; // Subtract the elapsed time
            if (this.hit_timer <= 0) {
                this.box_hit = false; // Reset the hit status when the timer reaches 0
                this.hit_timer = 0; // Ensure the timer doesn't go negative
            }
        }

        let box_material = this.materials.plastic;
        if (this.box_hit) {
            box_material = this.material.override(color(
                0.3 + Math.random() * 0.7,
                0.3 + Math.random() * 0.7,
                0.3 + Math.random() * 0.7,
                1.0
            ));  // Change color to red if hit
        }
        this.shapes.cube.draw(context, program_state, model_transform, box_material);


        // Filter out objects that stop or stray too far away:
        this.objects = this.objects.filter(obj => obj.center[2] < 2 && obj.linear_velocity.norm() > 2);
        this.objects = this.objects.filter(obj => !(obj.center[2] > -0.5 && obj.center[0] >= 10+this.box_rotation -1 && 10+this.box_rotation + 1 >= obj.center[0]));
        // this.objects = this.objects.filter(obj => obj.center[2] < -2 &&
        //     (obj.center[0] <= 10+this.box_rotation -1 || 10+this.box_rotation + 1 <= obj.center[0]));

    }

    show_explanation(document_element) {
    //     document_element.innerHTML += `<p>This demo shows how to make the illusion that there are many lights, despite the shader only being aware of two. The shader used here (class Phong_Shader) is told to take only two lights into account when coloring in a shape. This has the benefit of fewer lights that have to be looped through in the fragment shader, which has to run hundreds of thousands of times.
    //
    // </p><p>You can get away with seemingly having more lights in your overall scene by having the lights only affect certain shapes, such that only two are influencing any given shape at a time.   We re-locate the lights in between individual shape draws. For this to look right, it helps for shapes to be aware of which lights are nearby versus which are too far away or too small for their effects to matter, so the best pair can be chosen.
    //
    // </p><p>In this scene, one light exists per row and one per column, and a box simply looks up the lights it is sharing a row or column with.</p>`;
        document_element.innerHTML += '<p>哈哈哈哈哈</p>'
    }
}

function getColorFromXPosition(x) {
    if (x < 4) {
        return color(3, 0, 0, 1); // Red
    } else if (x <= 8) {
        return color(3, 3, 0, 1); // Yellow
    } else if (x <= 10) {
        return color(0, 3, 0, 1); // Green
    } else if (x <= 15) {
        return color(0, 0, 3, 1); // Blue
    } else {
        return color(1.5, 0, 1.5, 1); // Purple
    }
}

