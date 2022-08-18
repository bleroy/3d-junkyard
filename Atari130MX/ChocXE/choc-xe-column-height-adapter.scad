// Adapter to raise a Choc XE keyboard from the two columns in Atari XE
// computers and bring the keyboard to be flush with the case top.
// (c) Bertrand Le Roy
// Licensed under MIT

$fa = 1;
$fs = 0.2;

height_offset = 1.75;
column_diameter = 6.2;
keyboard_angle = 9.8; // degrees. back height: 43.45 front height: 24.21 hypothenuse: 112.22
wall_thickness = 1.5;
height = 5;

total_diameter = column_diameter + wall_thickness * 2;

    difference() {
        union() {
            translate([0, 0, height / 2])
                difference() {
                    cylinder(r = total_diameter / 2, h = height, center = true);
                    cylinder(r = column_diameter / 2, h = height + 1, center = true);
                }
            translate([0, 0, height - height_offset / 2 - total_diameter * sin(keyboard_angle) / 2])
                rotate([keyboard_angle, 0, 0])
                    cylinder(
                        r = (total_diameter + column_diameter) / 4,
                        h = height_offset,
                        center = true);
        }
        translate([
            0,
            - total_diameter * tan(keyboard_angle) / 2,
            height + 4.9 - total_diameter * sin(keyboard_angle) / 2])
            rotate([keyboard_angle, 0, 0])
                cube([
                    total_diameter / cos(keyboard_angle),
                    total_diameter + 0.5,
                    10], center = true);
    }
