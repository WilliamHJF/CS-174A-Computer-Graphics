import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Cube, Axis_Arrows, Textured_Phong} = defs

export class Assignment4 extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.rotated = false;

        // TODO:  Create two cubes, including one with the default texture coordinates (from 0 to 1), and one with the modified
        //        texture coordinates as required for cube #2.  You can either do this by modifying the cube code or by modifying
        //        a cube instance's texture_coords after it is already created.
        this.shapes = {
            box_1: new Cube(),
            box_2: new Cube(),
            axis: new Axis_Arrows()
        }
        console.log(this.shapes.box_1.arrays.texture_coord);

        // The second texture image is applied to each face but is zoomed out by 50%
        // (the image should shrink; the whole image will appear four times, once in each corner)
        this.shapes.box_2.arrays.texture_coord = this.shapes.box_2.arrays.texture_coord.map(x => x.times(2));
        console.log(this.shapes.box_2.arrays.texture_coord);


        // TODO:  Create the materials required to texture both cubes with the correct images and settings.
        //        Make each Material from the correct shader.  Phong_Shader will work initially, but when
        //        you get to requirements 6 and 7 you will need different ones.
        this.materials = {
            phong: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
            }),

            // stars: new Material(new Textured_Phong(), {
            //     color: hex_color("#000000"),
            //     ambient: 1, diffusivity: 0.1, specularity: 0.1,
            //     texture: new Texture("assets/stars.png", "NEAREST"),
            // }),
            // earth: new Material(new Textured_Phong(), {
            //     color: hex_color("#000000"),
            //     ambient: 1, diffusivity: 0.1, specularity: 0.1,
            //     texture: new Texture("assets/earth.gif", "LINEAR_MIPMAP_LINEAR"),
            // }),

            // Make your image match its original colors this time, by setting the ambient color
            // to opaque black (#000000) and adjusting the ambient
            stars: new Material(new Texture_Rotate(), {
                color: hex_color("#000000"),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/stars.png", "NEAREST"),
            }),
            earth: new Material(new Texture_Scroll_X(), {
                color: hex_color("#000000"),
                ambient: 1, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/earth.gif", "LINEAR_MIPMAP_LINEAR"),
            }),
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));

        // Make the transforms global so that the cubes should not jump to a different angle when they start and stop
        // Place the center of cube #1 at (-2,0,0) and the center of cube #2 at (2,0,0).
        this.cube1_transform = Mat4.identity().times(Mat4.translation(-2, 0, 0, 0));
        this.cube2_transform = Mat4.identity().times(Mat4.translation(2, 0, 0, 0));
    }

    make_control_panel() {
        // TODO:  Implement requirement #5 using a key_triggered_button that responds to the 'c' key.
        this.key_triggered_button("Start/Stop rotating both cubes", ["c"], () => {
            this.rotated = !this.rotated;
        });
    }

    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.

            // Place the camera 8 units back from the origin.
            program_state.set_camera(Mat4.translation(0, 0, -8));
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        const light_position = vec4(10, 10, 10, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        let t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        let model_transform = Mat4.identity();

        // Cube #1 should rotate around its own X-axis at a rate of 20 rpm.
        // Cube #2 should rotate around its own Y-axis at a rate of 30 rpm.
        if(this.rotated) {
            // 1 RPM = 2*PI/60 rad/s
            this.cube1_transform = this.cube1_transform.times(Mat4.rotation(20 * (2 * Math.PI / 60) * dt, 1, 0, 0));
            this.cube2_transform = this.cube2_transform.times(Mat4.rotation(30 * (2 * Math.PI / 60) * dt, 0, 1, 0));
        }

        // TODO:  Draw the required boxes. Also update their stored matrices.
        // You can remove the following line.
        this.shapes.box_1.draw(context, program_state, this.cube1_transform, this.materials.stars);
        this.shapes.box_2.draw(context, program_state, this.cube2_transform, this.materials.earth);
    }
}


class Texture_Scroll_X extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #6.
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord; //Stores the vec2 of pre-interpolated texture coordinates.
            uniform sampler2D texture;
            uniform float animation_time;
            
            void main(){
                //Sample the texture image in the correct place:
                // vec4 tex_color = texture2D( texture, f_tex_coord);
                // if( tex_color.w < .01 ) discard;
                //                                                          // Compute an initial (ambient) color:
                // gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                //                                                          // Compute the final color with contributions from lights:
                // gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
                
                // Translate the texture varying the s texture coordinate by 2 texture units per second, 
                // causing it to slide along the box faces.
                // Reset the texture coordinates so they do not continue to grow forever (use module)
                // t = 0, xTranslate = 0; t = 1, xTranslate = 2
                float xTranslate = mod(animation_time, 2.0) * 2.0; 
                
                // Make the texture coordinates shown as homogenous point
                vec4 f_tex_coord_h = vec4(f_tex_coord, 1.0, 1.0);
                
                // Translate the texture coordinates
                f_tex_coord_h = f_tex_coord_h + vec4(-xTranslate, 1.0, 1.0, 1.0); 

                // Set the color
                vec4 tex_color = texture2D(texture, f_tex_coord_h.xy);
                
                // Add the outline of a black square in the center of each texture that moves with the texture
                // Make sure the range of x and y is between 0 and 1 by using module
                // 2.0 mod 1.0 = 0
                float x = mod(f_tex_coord_h.x, 1.0);
                float y = mod(f_tex_coord_h.y, 1.0);

                if ((x >= 0.15 && x <= 0.85 && y >= 0.15 && y <= 0.25) || //Bottom outline
                    (x >= 0.15 && x <= 0.85 && y >= 0.75 && y <= 0.85) || //Top outline
                    (x >= 0.15 && x <= 0.25 && y >= 0.15 && y <= 0.85) || //Left outline
                    (x >= 0.75 && x <= 0.85 && y >= 0.15 && y <= 0.85)) { //Right outline
                    tex_color = vec4(0.0, 0.0, 0.0, 1.0);
                }

                if( tex_color.w < .01 ) discard;
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}


class Texture_Rotate extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #7.
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            void main(){
                // Sample the texture image in the correct place:
                // Rotate the texture map itself at a rate of 15 rpm
                // 1 RPM = 2*PI/60 rad/s
                float angle = 15.0 * (2.0 * 3.1415926535 / 60.0) * animation_time;

                // Make a 4x4 matrix of any form using the mat4() constructor
                // The first four entries are the first column
                mat4 transform = mat4(vec4(cos(-angle), sin(-angle), 0.0, 0.0), 
                                   vec4(-sin(-angle), cos(-angle), 0.0, 0.0), 
                                   vec4(0.0, 0.0, 1.0, 0.0), 
                                   vec4(0.0, 0.0, 0.0, 1.0)); 

                // Make the texture coordinates shown as homogenous point
                vec4 f_tex_coord_h = vec4(f_tex_coord, 1.0, 1.0);
                
                // To rotate the texture map itself around the center 
                // we need to make the center of the cube be the origin of the coordinate system 
                // by translating before rotation
                f_tex_coord_h += vec4(-0.5, -0.5, 0.0, 0.0);
                
                // After rotation, move back to the original origin
                f_tex_coord_h = transform * f_tex_coord_h + vec4(-0.5, -0.5, 0.0, 0.0);

                // Set the color
                vec4 tex_color = texture2D(texture, f_tex_coord_h.xy);
                
                // Add the outline of a black square in the center of each texture that moves with the texture
                // Make sure the range of x and y is between 0 and 1 by using module
                // 2.0 mod 1.0 = 0
                float x = mod(f_tex_coord_h.x, 1.0);
                float y = mod(f_tex_coord_h.y, 1.0);
                
                if ((x >= 0.15 && x <= 0.85 && y >= 0.15 && y <= 0.25) || //Bottom outline
                    (x >= 0.15 && x <= 0.85 && y >= 0.75 && y <= 0.85) || //Top outline
                    (x >= 0.15 && x <= 0.25 && y >= 0.15 && y <= 0.85) || //Left outline
                    (x >= 0.75 && x <= 0.85 && y >= 0.15 && y <= 0.85)) { //Right outline
                    tex_color = vec4(0.0, 0.0, 0.0, 1.0);
                }
                
                if( tex_color.w < .01 ) discard;
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}

