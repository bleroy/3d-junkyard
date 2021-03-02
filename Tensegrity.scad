use <scad-utils/transformations.scad>
use <scad-utils/trajectory_path.scad>
use <scad-utils/trajectory.scad>
use <scad-utils/shapes.scad>

use <skin.scad>
use <sweep.scad>

$fa = 1;
$fs = 0.4;

/*[Base]*/
// Radius of base
base_radius = 65;

// Height of base
base_height = 3;

// Number of holes
number_of_holes = 10;

pi = 3.14159265359;

module hole(inner_radius, outer_radius, depth, outer_depth) {
    cylinder(h = depth, r = inner_radius, center = true);
    translate([0, 0, (outer_depth - depth) / 2])
        cylinder(h = outer_depth, r = outer_radius, center = true);
}

module gallows(height) {
    path_definition = [
        trajectory(forward = height, roll  =  0),
        trajectory(forward =  height*pi/2, pitch = 180),
        trajectory(forward = height, roll  =  0)
    ];
    path = quantize_trajectories(path_definition, steps=100);
    trans = [ for (i=[0:len(path)-1]) transform(path[i], circle(60)) ];

    translate([0,10,30])
        skin(trans);
}

module base(
    radius = 65,
    height = 3,
    number_of_holes = 6,
    hole_circle_radius = 63,
    hole_inner_radius = 1,
    hole_outer_radius = 2,
    hole_depth = 2) {
    
    angle = 360 / number_of_holes;
    difference() {    
        hull()
            rotate_extrude()
                translate([radius, 0, 0])
                    circle(height / 2);
        for (a = [0 : angle : 359.9]) {
            translate([
                hole_circle_radius * cos(a),
                hole_circle_radius * sin(a),
                0])
                hole(hole_inner_radius, hole_outer_radius, height + 0.1, hole_depth);
        }
    }
}

translate([0, 0, base_height / 2])
    base(base_radius, base_height, number_of_holes);
gallows(80);
