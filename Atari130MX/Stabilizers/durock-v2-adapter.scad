// Durock v2 stabilizer adapters for vintage Atari XE space bar caps
// (c) Bertrand Le Roy
// Licensed under MIT

$fa = 1;
$fs = 0.2;

// Cap type
cap_type = "Atari XE ■ Space bar"; // [Atari XE ◎ Space bar, Atari XE ■ Space bar]

duroc_thickness = 1.8 + 0;
duroc_size = 4.2 + 0;
wiggle_room = 0.5; // Extra wiggle room so the stabilizers can stand vertical despite small variations in position

if (cap_type == "Atari XE ■ Space bar") {
    adapter_width = 30;
    adapter_depth = 14;
    adapter_height = 4;
    adapter_thickness = 1.6;
    adapter_x_offset = 19.5;

    difference() {
        cube([adapter_width, adapter_depth, adapter_height]);

        translate([7, adapter_depth / 2, adapter_height / 2]) {
            union() {
                cube([duroc_thickness + wiggle_room, duroc_size, adapter_height * 1.1], center = true);
                cube([duroc_size + wiggle_room, duroc_thickness, adapter_height * 1.1], center = true);
            }
        }
        translate([adapter_x_offset, 3.5 + adapter_thickness / 2, adapter_height / 2])
            cube([7, adapter_thickness, adapter_height * 1.1], center = true);
        translate([adapter_x_offset + (7 - adapter_thickness) / 2, 4.25 + adapter_thickness / 2, adapter_height / 2])
            cube([adapter_thickness, 2.5, adapter_height * 1.1], center = true);
        translate([adapter_x_offset - (7 - adapter_thickness) / 2, 4.25 + adapter_thickness / 2, adapter_height / 2])
            cube([adapter_thickness, 2.5, adapter_height * 1.1], center = true);
    }
}
else {
    adapter_width = 56;
    adapter_depth = 12;
    adapter_height = 6.5;
    adapter_thickness = 1.8;
    adapter_x_offset = adapter_width;

    difference() {
        cube([adapter_width, adapter_depth, adapter_height]);

        translate([31, adapter_depth / 2, adapter_height / 2]) {
            union() {
                cube([duroc_thickness+ wiggle_room, duroc_size, adapter_height * 1.1], center = true);
                cube([duroc_size + wiggle_room, duroc_thickness, adapter_height * 1.1], center = true);
            }
        }
        translate([0, adapter_depth / 2, adapter_height / 2])
            cube([3.5 * 2, 1.5, adapter_height * 1.1], center = true);
        translate([adapter_x_offset, adapter_depth / 2, adapter_height / 2])
            cube([2.5 * 2, adapter_thickness, adapter_height * 1.1], center = true);
    }
}
