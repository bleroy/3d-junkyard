// 1/6 PC case miniature
// (c) Bertrand Le Roy under MIT license

$fa = 1;
$fs = 0.2;

// Depth of the case
case_depth = 92;

// Height of the case
case_height = 92;

// Width of the case
case_width = 44;

// Case wall thickness
case_wall_thickness = 2;

// Feet height
feet_height = 2.5;

// Feet diameter
feet_diameter = 6.2;

// Lower block height
lower_block_height = 25;

// Front thickness
front_thickness = 6.7;

// Glass margin
glass_margin = 2.5;

// Grille hole diameter
grille_hole_diameter = 0.6;

// Grille hole depth
grille_hole_depth = 0.6;

// Grille hole distance
grille_hole_distance = 1.5;

// Motherboard width
motherboard_width = 55;

// Motherboard length
motherboard_length = 86;

// Motherboard back clearance
motherboard_back_clearance = 4;

// Motherboard thickness
motherboard_thickness = 1.5;

// Motherboard rail width
motherboard_rail_width = 2;

// Motherboard height offset
motherboard_height_offset = 10;

// First back window position
first_back_window_position = 18.3;

// First back window height
first_back_window_height = 14.7;

// First back window width (in front of the motherboard)
first_back_window_width = 16.5;

// Second back window position
second_back_window_position = 38;

// Second back window height
second_back_window_height = 16;

// Second back window width (in front of the motherboard)
second_back_window_width = 13.5;

// Outer walls
difference() {
    cube([case_width, case_depth, case_height], center=true);
    translate([-0, 0, lower_block_height / 2])
        cube([case_width - 2 * case_wall_thickness, case_depth - 2 * case_wall_thickness, case_height - 2 * case_wall_thickness - lower_block_height], center=true);
    // glass pane
    translate([-case_width / 2, (front_thickness - glass_margin) / 2, lower_block_height / 2])
        cube([case_wall_thickness * 2 + 0.1, case_depth - glass_margin - front_thickness, case_height - 2 * glass_margin - lower_block_height], center=true);
    // Front grille
    for (j = [0 : floor((case_height - lower_block_height) / cos(30) / grille_hole_distance)]) {
        y = cos(30) * grille_hole_distance * j;
        for (i = [1 : floor(case_width / grille_hole_distance) - 1]) {
            translate([(j % 2) * grille_hole_distance / 2 + i * grille_hole_distance - case_width / 2, -case_depth / 2, y + lower_block_height -case_height / 2])
                rotate([90, 0, 0])
                    cylinder(r = grille_hole_diameter, h = grille_hole_depth * 2, center=true, $fn=8);
        }
    }
    // Back windows
    translate([
        case_width / 2 - case_wall_thickness - first_back_window_width / 2 - motherboard_back_clearance - motherboard_thickness,
        case_depth / 2 - case_wall_thickness / 2,
        -case_height / 2 + lower_block_height + first_back_window_height / 2 + first_back_window_position])
        cube([first_back_window_width, case_wall_thickness + 0.1, first_back_window_height], center=true);
    translate([
        case_width / 2 - case_wall_thickness - second_back_window_width / 2 - motherboard_back_clearance - motherboard_thickness,
        case_depth / 2 - case_wall_thickness / 2,
        -case_height / 2 + lower_block_height + second_back_window_height / 2 + second_back_window_position])
        cube([second_back_window_width, case_wall_thickness + 0.1, second_back_window_height], center=true);
}

// Motherboard rails
rail_height = (case_height - case_wall_thickness - lower_block_height - motherboard_width) / 2 + motherboard_rail_width;
difference() {
    union() {
        translate([case_width / 2 - case_wall_thickness - motherboard_back_clearance / 2 - motherboard_thickness / 2, 0, case_height / 2 - rail_height / 2 - case_wall_thickness])
            cube([motherboard_back_clearance + motherboard_thickness, case_depth - case_wall_thickness, rail_height], center=true);
        translate([case_width / 2 - case_wall_thickness - motherboard_back_clearance / 2 - motherboard_thickness / 2, 0, -case_height / 2 + rail_height / 2 + lower_block_height + case_wall_thickness])
            cube([motherboard_back_clearance + motherboard_thickness, case_depth - case_wall_thickness, rail_height], center=true);
    }
    translate([case_width / 2 - case_wall_thickness - motherboard_back_clearance - motherboard_thickness / 2 - 0.05, 0, motherboard_width / 2 - case_height / 2 + lower_block_height + case_wall_thickness + rail_height / 2])
        cube([motherboard_thickness + 0.1, motherboard_length, motherboard_width], center=true);
}

// Feet
translate([(feet_diameter - case_width * 0.9) / 2, (feet_diameter - case_depth + case_width * 0.1) / 2, -case_height / 2 - feet_height * 0.5 + 0.1])
    cylinder(h = feet_height + 0.1, r = feet_diameter / 2, center=true);
translate([-(feet_diameter - case_width * 0.9) / 2, (feet_diameter - case_depth + case_width * 0.1) / 2, -case_height / 2 - feet_height * 0.5 + 0.1])
    cylinder(h = feet_height + 0.1, r = feet_diameter / 2, center=true);
translate([(feet_diameter - case_width * 0.9) / 2, -(feet_diameter - case_depth + case_width * 0.1) / 2, -case_height / 2 - feet_height * 0.5 + 0.1])
    cylinder(h = feet_height + 0.1, r = feet_diameter / 2, center=true);
translate([-(feet_diameter - case_width * 0.9) / 2, -(feet_diameter - case_depth + case_width * 0.1) / 2, -case_height / 2 - feet_height * 0.5 + 0.1])
    cylinder(h = feet_height + 0.1, r = feet_diameter / 2, center=true);