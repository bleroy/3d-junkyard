// Adapter to raise a Choc XE keyboard from the sides in Atari XE
// computers and bring the keyboard to be flush with the case top.
// (c) Bertrand Le Roy
// Licensed under MIT

$fa = 1;
$fs = 0.2;

height_offset = 1.75;
pcb_thickness = 1.6;
keyboard_angle = 9.8; // degrees. back height: 43.45 front height: 24.21 hypothenuse: 112.22
width = 10;
height = 5;
wall_thickness = 2;

inclined_height_offset = height_offset * cos(keyboard_angle);
total_thickness = wall_thickness + pcb_thickness + inclined_height_offset;

difference() {
    translate([0, 0, total_thickness / 2])
        cube([width, height, total_thickness], center = true);
    translate([0, -height / 2, total_thickness / 2])
        cylinder(r = wall_thickness, h = total_thickness + 0.1, center = true);
    translate([
        0,
        (height - wall_thickness) / 2 - (height / 2 - wall_thickness) + 0.1,
        pcb_thickness / 2 + inclined_height_offset])
        cube([width + 0.1, height - wall_thickness + 0.2, pcb_thickness], center = true);
    translate([0, 0, total_thickness])
        cylinder(r = wall_thickness, h = 0.2, center = true); // mark to distinguish the top of the model
}