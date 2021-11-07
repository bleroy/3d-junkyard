$fa = 1;
$fs = 0.2;

// Cap type
cap_type = "Atari XE ◎"; // [Atari XE ■, Atari XE ◎]

rod_diameter = 1.7;
rod_diameter_tolerance = 0.6;
tolerance = 0.1;
rod_entry_point_offset = 0.6;
rod_entry_point_depth = cap_type == "Atari XE ◎" ? 0.5 : 2;
rod_entry_point_cut = cap_type == "Atari XE ◎" ? 0.8 : 3.2;

total_length = 15.3;
base_width = 5.3;
hole_width = 3;
hole_length = 13.65;
inner_length = 6;
from_outer_edge_to_inner = 3.2;
plate_thickness = 1.5;
plate_tolerance = 0.5;
under_plate = 1.5;
height_above_plate = 6;
total_height = height_above_plate + plate_thickness + under_plate;
bar_side_height = 7 - plate_thickness - under_plate;
rod_hole_offset = cap_type == "Atari XE ◎" ? 4.0 : 6.5;

sqrt2 = sqrt(2);

difference() {
  translate([0, 0, total_height / 2 - plate_thickness - under_plate])
    union() {
      cube([hole_width - tolerance, total_length, total_height], center = true);

      translate([0, 0, (total_height - height_above_plate) / 2])
          cube([base_width, total_length, height_above_plate], center = true);
    }

  translate([0, (inner_length - total_length) / 2 + from_outer_edge_to_inner, height_above_plate / 2 + 0.99])
    cube([base_width * 2, inner_length, height_above_plate + 2], center = true);
  translate([0, -hole_length * .852, 5])
    rotate([77, 0, 0])
      cube([base_width * 2, 10, 10], center = true);
  translate([0, 5, 5 + bar_side_height])
    cube([base_width * 2, 10, 10], center = true);
  translate([0, -total_length / 2 + tolerance, -(plate_thickness + plate_tolerance) / 2])
    cube([base_width * 2, total_length - hole_length, plate_thickness + plate_tolerance], center = true);
  translate([0, total_length / 2 - tolerance, -(plate_thickness + plate_tolerance) / 2])
    cube([base_width * 2, total_length - hole_length, plate_thickness + plate_tolerance], center = true);
  translate([0, 4.8,-under_plate - plate_thickness])
    cube([base_width * 2, 1.4, (under_plate + plate_thickness) * 2], center = true);
  translate([0, rod_hole_offset, bar_side_height / 2])
    rotate([0, 90, 0])
      cylinder(r = (rod_diameter + rod_diameter_tolerance) / 2, h = base_width * 2, center = true);
  translate([0, total_length / 2 + 1.3, -plate_thickness - plate_tolerance - under_plate / 2])
    rotate([-30, 0, 0])
      cube([base_width * 2, 3, 3], center = true);
  translate([0, total_length / 2 + rod_entry_point_cut, 8])
    union() {
      translate([0, 2.1, -1.4])
        cube([base_width * 2, 10, 10], center = true);
      rotate([20, 0, 0])
        cube([base_width * 2, 10, 10], center = true);
    }
  translate([0, total_length / 2 + rod_entry_point_depth, bar_side_height / 2])
    cube([base_width * 2, 7, rod_diameter + rod_diameter_tolerance - rod_entry_point_offset], center = true);
}