$fa = 1;
$fs = 0.5;

eye = "right"; // [right, left]
eye_interior_shape = "tubular"; // [tubular, spherical]
eye_outer_width = 96;
eye_outer_height = 86;
cup_depth_left = 12;
cup_depth_right = 10;
pupil_width = 65;
pupil_height = 73;
pupil_x_offset = 2.5;
pupil_y_offset = 1;
wall_thickness = 3.5;
floor_thickness = 3;
boudin = 5;
magnet_diameter = 9;
magnet_thickness = 0;
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
    if (eye_interior_shape == "tubular") {
      scale([1, eye_outer_height / eye_outer_width, 1]) {
        translate([0, 0, -(cup_total_height + floor_thickness)])
          minkowski() {
            cylinder(h = cup_total_height - floor_thickness, r = eye_outer_width / 2 - wall_thickness - boudin);
            sphere(r = boudin);
          }
      }
    }
    if (eye_interior_shape == "spherical") {
        translate([0, 0, floor_thickness - cup_total_height])
          scale([
            eye_outer_width / 2 - wall_thickness,
            eye_outer_height / 2 - wall_thickness,
            cup_total_height + wall_thickness]) {
            sphere(r = 1);
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