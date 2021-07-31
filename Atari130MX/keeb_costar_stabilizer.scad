$fa = 1;
$fs = 0.2;

rod_diameter = 1.6;
tolerance = 0.1;

total_length = 15.3;
base_width = 5.3;
hole_width = 3;
hole_length = 13.65;
inner_length = 8;
from_outer_edge_to_inner = 2.2;
plate_thickness = 1.5;
under_plate = 1.5;
height_above_plate = 6;
total_height = height_above_plate + plate_thickness + under_plate;

sqrt2 = sqrt(2);

difference() {
  translate([0, 0, total_height / 2 - plate_thickness - under_plate])
    union() {
      cube([hole_width, total_length, total_height], center = true);

      translate([0, 0, (total_height - height_above_plate) / 2])
        scale([1, total_length / base_width, 1])
          rotate([0, 0, 45])
            cylinder(height_above_plate, base_width / sqrt2, hole_width / sqrt2, $fn = 4, center = true);
    }

  translate([0, (inner_length - total_length) / 2 + from_outer_edge_to_inner, height_above_plate / 2 + 0.99])
    cube([base_width * 2, inner_length, height_above_plate + 2], center = true);
}