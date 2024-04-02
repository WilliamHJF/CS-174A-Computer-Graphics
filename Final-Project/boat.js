import {defs, tiny} from './examples/common.js';
const {Triangle, Square, Tetrahedron, Windmill, Cube, Subdivision_Sphere} = defs;
const {vec3, vec4, vec, color, Mat4, Light, Shape, Material, Shader, Texture, Scene, hex_color} = tiny;


export class Shape_From_File extends Shape {
    constructor(filename) {
        super("position", "normal", "texture_coord");
        // Begin downloading the mesh. Once that completes, return
        // control to our parse_into_mesh function.
        this.load_file(filename);
    }

    load_file(filename) {                             // Request the external file and wait for it to load.
        // Failure mode:  Loads an empty shape.
        return fetch(filename)
            .then(response => {
                if (response.ok) return Promise.resolve(response.text())
                else return Promise.reject(response.status)
            })
            .then(obj_file_contents => this.parse_into_mesh(obj_file_contents))
            .catch(error => {
                this.copy_onto_graphics_card(this.gl);
            })
    }

    parse_into_mesh(data) {                           // Adapted from the "webgl-obj-loader.js" library found online:
        var verts = [], vertNormals = [], textures = [], unpacked = {};

        unpacked.verts = [];
        unpacked.norms = [];
        unpacked.textures = [];
        unpacked.hashindices = {};
        unpacked.indices = [];
        unpacked.index = 0;

        var lines = data.split('\n');

        var VERTEX_RE = /^v\s/;
        var NORMAL_RE = /^vn\s/;
        var TEXTURE_RE = /^vt\s/;
        var FACE_RE = /^f\s/;
        var WHITESPACE_RE = /\s+/;

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            var elements = line.split(WHITESPACE_RE);
            elements.shift();

            if (VERTEX_RE.test(line)) verts.push.apply(verts, elements);
            else if (NORMAL_RE.test(line)) vertNormals.push.apply(vertNormals, elements);
            else if (TEXTURE_RE.test(line)) textures.push.apply(textures, elements);
            else if (FACE_RE.test(line)) {
                var quad = false;
                for (var j = 0, eleLen = elements.length; j < eleLen; j++) {
                    if (j === 3 && !quad) {
                        j = 2;
                        quad = true;
                    }
                    if (elements[j] in unpacked.hashindices)
                        unpacked.indices.push(unpacked.hashindices[elements[j]]);
                    else {
                        var vertex = elements[j].split('/');

                        unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 0]);
                        unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 1]);
                        unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 2]);

                        if (textures.length) {
                            unpacked.textures.push(+textures[((vertex[1] - 1) || vertex[0]) * 2 + 0]);
                            unpacked.textures.push(+textures[((vertex[1] - 1) || vertex[0]) * 2 + 1]);
                        }

                        unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 0]);
                        unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 1]);
                        unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 2]);

                        unpacked.hashindices[elements[j]] = unpacked.index;
                        unpacked.indices.push(unpacked.index);
                        unpacked.index += 1;
                    }
                    if (j === 3 && quad) unpacked.indices.push(unpacked.hashindices[elements[0]]);
                }
            }
        }
        {
            const {verts, norms, textures} = unpacked;
            for (var j = 0; j < verts.length / 3; j++) {
                this.arrays.position.push(vec3(verts[3 * j], verts[3 * j + 1], verts[3 * j + 2]));
                this.arrays.normal.push(vec3(norms[3 * j], norms[3 * j + 1], norms[3 * j + 2]));
                this.arrays.texture_coord.push(vec(textures[2 * j], textures[2 * j + 1]));
            }
            this.indices = unpacked.indices;
        }
        this.normalize_positions(false);
        this.ready = true;
    }

    draw(context, program_state, model_transform, material) {               // draw(): Same as always for shapes, but cancel all
        // attempts to draw the shape before it loads:
        if (this.ready)
            super.draw(context, program_state, model_transform, material);
    }
}

class Boat_Base {
    constructor() {
        this.model_transform = Mat4.identity()
            .times(Mat4.translation(10,0,-0.8))
            .times(Mat4.scale(.5,.5,.5))
            .times(Mat4.rotation(Math.PI/2, 0, 0, 1))
            .times(Mat4.rotation(Math.PI/2, 0, 1, 0));

        this.shapes = new Shape_From_File("assets/sailboat.obj");

        const phong = new defs.Phong_Shader();
        // const tex_phong = new defs.Textured_Phong(1);
        this.materials = {
            plastic: new Material(phong,
                {ambient: .2, diffusivity: .8, specularity: .5, color: color(.9, .5, .9, 1)}),
            metal: new Material(phong, {
                color: hex_color("#00d2ff"),
                ambient: 0.3, diffusivity: 0.8, specularity: 0.5,
            }),
            hit: new Material(phong, {
                color: hex_color("#f94449"),
                ambient: 0.3, diffusivity: 0.8, specularity: 0.5,
            }),
        };

        this.is_reward_hit = false;
        this.hit_timer = 0;

        this.light_position = vec4(10, 1.79, 5.37, 1);
        this.boat_x = 10;
    }
}

export class Boat extends Boat_Base{
    constructor() {
        super();
        this.currentAngle = 0; // Current tilt angle (radians)
        this.targetAngle = 0; // Target tilt angle for interpolation (radians)
        this.angleVelocity = 0; // Angular velocity for smooth interpolation
        this.position = vec3(0, 0, 0); // Current position
        this.velocity = vec3(0, 0, 0); // Current velocity
        this.turning = false;
    }

    update_boat_position(v) {
        this.velocity = this.velocity.plus(v);
        // this.turning = ;
        this.targetAngle = v[0] * Math.PI / 6; // Adjust divisor for sensitivity
        this.angleVelocity = (this.targetAngle - this.currentAngle) * 0.1;
        this.light_position = this.light_position.plus(vec4(v[0], v[1], v[2], 0));
    }

    draw(context, program_state) {

        // Angular Interpolation for tilting
        this.currentAngle += this.angleVelocity * program_state.animation_delta_time;
        if (!this.turning) {
            // Gradually return to zero tilt when not turning
            this.angleVelocity = this.angleVelocity * 0.95;
            this.currentAngle = this.currentAngle * 0.05; // Adjust for smoothing
        }

        // Apply Verlet Integration for position
        let acceleration = vec3(0, 0, 0); // Define acceleration if any
        let newPosition = this.position.plus(this.velocity.times(program_state.animation_delta_time)).plus(acceleration.times(Math.pow(program_state.animation_delta_time, 2) / 2));
        // this.position = newPosition;

        this.position[1] = this.position[1] + this.currentAngle;
        this.boat_x = 10 - this.position[1];
        //console.log(this.boat_x)
        // Update model transform for position and rotation
        //console.log(this.model_transform.times(Mat4.translation(this.position[0], this.position[1], this.position[2])))

        let transform = this.model_transform
            .times(Mat4.translation(this.position[0], this.position[1], this.position[2]))
            .times(Mat4.rotation(this.currentAngle, 1, 0, 0)); // Rotate around the Z-axis

        //console.log(this.hit_timer);
        // Update the hit timer
        if (this.is_reward_hit && this.hit_timer > 0) {
            this.hit_timer -= program_state.animation_delta_time / 1000;
            if (this.hit_timer <= 0) {
                this.is_reward_hit = false;
                this.hit_timer = 0;
            }
        }
        let boat_material = this.materials.metal;
        if (this.is_reward_hit) {
            boat_material = this.materials.hit;
        }

        //Reset the light source for the boat
        program_state.lights = [new Light(this.light_position, color(1, 1, 1, 1), 50)];
        this.shapes.draw(context, program_state, transform, boat_material);
    }
}