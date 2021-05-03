$fa = 1;
$fs = 0.2;

eye = "right"; // [right, left]
eye_outer_width = 90;
eye_outer_height = 80;
cup_depth_left = 19;
cup_depth_right = 16;
pupil_width = 54;
pupil_height = 58;
pupil_x_offset = 2.5;
pupil_y_offset = 2;
wall_thickness = 3.5;
floor_thickness = 2;
boudin = 2;
magnet_diameter = 8.5;
magnet_thickness = 2.5;
magnet_depth_offset = -9;

cup_total_height = cup_depth_left + wall_thickness;

scale([eye == "right" ? 1 : -1, 1, 1]) {
  difference() {
    union() {
      // Outer eye cup cylinder
      scale([1, eye_outer_height / eye_outer_width, 1]) {
        translate([0, 0, -cup_total_height / 2])
          cylinder(h = cup_total_height, r = eye_outer_width / 2, center = true);
      }
    }

    // Remove slanted plane on top
    angle = atan((cup_depth_left - cup_depth_right) / eye_outer_width);
    translate([0, 0, (cup_depth_left - cup_depth_right) / 2 - 50 - cup_total_height] )
      rotate([0, angle, 0])
        cube([eye_outer_width + 100, eye_outer_height + 100, 100], center = true);

    // Remove pupil space
    translate([pupil_x_offset, pupil_y_offset, 0])
      scale([1, pupil_height / pupil_width, 1]) {
        cylinder(h = 100, r = pupil_width / 2, center = true);
      }

    // Dig cup cavity
    scale([1, eye_outer_height / eye_outer_width, 1]) {
      translate([0, 0, -(cup_total_height + floor_thickness)])
        minkowski() {
          cylinder(h = cup_total_height - floor_thickness, r = eye_outer_width / 2 - wall_thickness - boudin);
          sphere(r = boudin);
        }
    }

    // Remove magnet holes
    translate([-eye_outer_width / 2, 0, magnet_depth_offset])
      rotate([0, 90, 0])
        cylinder(r = magnet_diameter / 2, h = magnet_thickness * 2, center = true);
    translate([eye_outer_width / 2, 0, magnet_depth_offset])
      rotate([0, 90, 0])
        cylinder(r = magnet_diameter / 2, h = magnet_thickness * 2, center = true);
    translate([0, eye_outer_height / 2, magnet_depth_offset])
      rotate([90, 0, 0])
        cylinder(r = magnet_diameter / 2, h = magnet_thickness * 2, center = true);
  }
}