$fa = 1;
$fs = 0.2;

// Cap type
cap_type = "Atari130XE"; // [KailhBox, Atari130XE]

// Stem type
stem_type = "KailhBoxPink"; // [KailhBoxPink]

// Revision
rev = "6a";

// Carve revision
carve_rev = false;

module nil() {}

box_width = 6.40;
box_height = 4.7;
box_inner_width = 6;
box_inner_corner_radius = 2;
box_cross_x_thickness = 1.3;
box_cross_y_thickness = 1.1;
box_cross_width = 4;
box_bottom_thickness = 0.7;
box_bottom_outer_offset = 0.02;

module kailh_box() {
  union() {
    difference() {
      cube([box_width, box_width, box_height], center = true);
      minkowski() {
        cube([
          box_inner_width - box_inner_corner_radius * 2,
          box_inner_width - box_inner_corner_radius * 2,
          box_height + 0.1], center = true);
        cylinder(r = box_inner_corner_radius);
      }
    };
    cube([box_cross_width, box_cross_x_thickness, box_height], center = true);
    cube([box_cross_y_thickness, box_cross_width, box_height], center = true);
    translate([0, 0, (box_bottom_thickness - box_height) / 2])
      cube([box_width, box_width, box_bottom_thickness], center = true);
  }
}

atari_box_width = 6.40;
atari_box_height = 4.7;
atari_square_width = 3.15;
atari_square_depth = 2.8;
atari_box_bottom_thickness = 0.7;
atari_box_bottom_outer_offset = 0.05;

module atari130xe_box() {
  union() {
    difference() {
      cube([atari_box_width, atari_box_width, atari_box_height], center = true);
      cube([atari_square_width, atari_square_width, atari_box_height + 0.1], center = true);
      translate([0, 0, (atari_square_depth - 1) / 2])
        cylinder(r = atari_square_width * sqrt(2) / 2, h = atari_box_height - atari_square_depth + 0.1);
    }
    translate([0, 0, (atari_box_bottom_thickness - atari_box_height) / 2])
      cube([atari_box_width, atari_box_width, atari_box_bottom_thickness], center = true);
  }
}

kailh_stem_horizontal_offset = 0.47;
kailh_stem_spring_column_height = 6.3;
kailh_stem_spring_column_bottom_diameter = 1.5;
kailh_stem_spring_column_upper_diameter = 1;
kailh_stem_spring_column_top_height = 0.3;
kailh_stem_spring_column_cone_height = 1.5;
kailh_stem_spring_column_offset = -0.50;
kailh_stem_main_height = 5;
kailh_stem_main_width = box_width;
kailh_stem_main_depth_left = 4.0;
kailh_stem_main_depth_middle = 4.7;
kailh_stem_main_depth_right = 3.45;
kailh_stem_main_extension_width = 1.8;
kailh_stem_main_hole_diameter = 3.8;
kailh_stem_main_hole_width = 5.1;
kailh_stem_main_hole_depth = 2;
kailh_stem_main_hole_corner_radius = 0.5;
kailh_stem_rail_thickness = 0.6;
kailh_stem_rail_width = 0.35;
kailh_stem_rail1_x = 1.0;
kailh_stem_rail2_x = 3.1;
kailh_stem_rail3_y = 2.9;
kailh_clicker_top_height = 1.3;
kailh_clicker_top_length = 0.3;
kailh_clicker_rail_height = 0.3;
kailh_clicker_gentle_slope_length = 1.75;
kailh_clicker_steep_slope_length = 0.35;
kailh_clicker_flat_length = 2;
kailh_clicker_rail_width = 0.6;
kailh_breaker_width = 1.6;
kailh_breaker_flat_length = 1.5;
kailh_breaker_slope_length = 1.9;
kailh_breaker_top = 0.8;
kailh_breaker_outcrop = 0.8;
kailh_breaker_bottom = -0.4;

kailh_stem_height = kailh_stem_spring_column_height;

module kailh_rails() {
  translate([0, kailh_stem_rail1_x, (kailh_stem_spring_column_height - kailh_stem_main_height) / 2])
    cube([kailh_stem_rail_thickness, kailh_stem_rail_width, kailh_stem_main_height], center = true);
  translate([0, kailh_stem_rail2_x, (kailh_stem_spring_column_height - kailh_stem_main_height) / 2])
    cube([kailh_stem_rail_thickness, kailh_stem_rail_width, kailh_stem_main_height], center = true);
  translate([0, (kailh_stem_rail2_x + kailh_stem_rail1_x) / 2, kailh_stem_rail3_y])
    cube([kailh_stem_rail_thickness, kailh_stem_rail2_x - kailh_stem_rail1_x - kailh_stem_rail_width, kailh_stem_rail_width], center = true);
}

module kailh_stem() {
  union() {
    // Main part
    translate([0, 0, (kailh_stem_spring_column_height - kailh_stem_main_height) / 2])
      difference() {
        union() {
          linear_extrude(height = kailh_stem_main_height, center = true) {
            polygon(points = [
              [-kailh_stem_main_width / 2, -box_width / 2],
              [kailh_stem_main_width / 2, -box_width / 2],
              [kailh_stem_main_width / 2, kailh_stem_main_depth_right - box_width / 2],
              [kailh_stem_main_extension_width / 2 + (kailh_stem_main_depth_middle - kailh_stem_main_depth_right), kailh_stem_main_depth_right - box_width / 2],
              [kailh_stem_main_extension_width / 2, kailh_stem_main_depth_middle - box_width / 2],
              [-kailh_stem_main_extension_width / 2, kailh_stem_main_depth_middle - box_width / 2],
              [-kailh_stem_main_extension_width / 2 - (kailh_stem_main_depth_middle - kailh_stem_main_depth_left), kailh_stem_main_depth_left - box_width / 2],
              [-kailh_stem_main_width / 2, kailh_stem_main_depth_left - box_width / 2],
            ], convexity = 10);
          }
          // Contact breaker
          kailh_breaker_height = kailh_breaker_slope_length + kailh_breaker_flat_length;
          translate([kailh_stem_main_width / 2, 0, kailh_breaker_height - kailh_stem_main_height / 2 - kailh_breaker_outcrop])
            rotate([-90, 0, 90])
              linear_extrude(height = kailh_breaker_width) {
                polygon(points = [
                  [kailh_breaker_bottom, 0],
                  [0, 0],
                  [kailh_breaker_top, kailh_breaker_slope_length],
                  [kailh_breaker_top, kailh_breaker_height],
                  [kailh_breaker_bottom, kailh_breaker_height]
                ], convexity = 4);
              }
        }
        translate([0, kailh_stem_spring_column_offset, 0])
          union() {
            cylinder(r = kailh_stem_main_hole_diameter / 2, h = kailh_stem_height + 1, center = true);
            hull() {
              translate([kailh_stem_main_hole_corner_radius - kailh_stem_main_hole_width / 2, -kailh_stem_main_hole_corner_radius, 0])
                cylinder(r = kailh_stem_main_hole_corner_radius, h = kailh_stem_height + 1, center = true);
              translate([kailh_stem_main_hole_width / 2 - kailh_stem_main_hole_corner_radius, -kailh_stem_main_hole_corner_radius, 0])
                cylinder(r = kailh_stem_main_hole_corner_radius, h = kailh_stem_height + 1, center = true);
              translate([kailh_stem_main_hole_corner_radius - kailh_stem_main_hole_width / 2, kailh_stem_main_hole_corner_radius - kailh_stem_main_hole_depth, 0])
                cylinder(r = kailh_stem_main_hole_corner_radius, h = kailh_stem_height + 1, center = true);
              translate([kailh_stem_main_hole_width / 2 - kailh_stem_main_hole_corner_radius, kailh_stem_main_hole_corner_radius - kailh_stem_main_hole_depth, 0])
                cylinder(r = kailh_stem_main_hole_corner_radius, h = kailh_stem_height + 1, center = true);
            }
          }
        if (carve_rev) {
          translate([2.2, -box_width / 2 + 0.4, 2])
            rotate([90, 180, 0])
              linear_extrude(height = 0.5)
                text(rev, size = 3);
        }
      }
    // Spring cone
    translate([0, kailh_stem_spring_column_offset, kailh_stem_spring_column_height / 2])
      rotate([180, 0, 0])
        rotate_extrude()
          polygon(points = [
            [0, 0],
            [kailh_stem_spring_column_bottom_diameter / 2, 0],
            [kailh_stem_spring_column_bottom_diameter / 2, kailh_stem_spring_column_height - kailh_stem_spring_column_cone_height - kailh_stem_spring_column_top_height],
            [kailh_stem_spring_column_upper_diameter / 2, kailh_stem_spring_column_height - kailh_stem_spring_column_top_height],
            [kailh_stem_spring_column_upper_diameter / 2, kailh_stem_spring_column_height],
            [0, kailh_stem_spring_column_height]
          ], convexity = 4);
    // Rails
    translate([-(kailh_stem_main_width + kailh_stem_rail_thickness) / 2, -kailh_stem_main_width / 2, 0])
      kailh_rails();
    translate([(kailh_stem_main_width + kailh_stem_rail_thickness) / 2, -kailh_stem_main_width / 2, 0])
      kailh_rails();
    // Clicker
    kailh_clicker_height = kailh_clicker_flat_length + kailh_clicker_gentle_slope_length + kailh_clicker_top_length + kailh_clicker_steep_slope_length;
    translate([kailh_stem_main_width / 2, -box_width / 2, kailh_stem_height / 2])
      rotate([0, 90, 180])
        linear_extrude(height = kailh_clicker_rail_width) {
          polygon(points = [
            [0, 0],
            [0, kailh_clicker_rail_height],
            [kailh_clicker_flat_length, kailh_clicker_rail_height],
            [kailh_clicker_flat_length + kailh_clicker_gentle_slope_length, kailh_clicker_top_height],
            [kailh_clicker_flat_length + kailh_clicker_gentle_slope_length + kailh_clicker_top_length, kailh_clicker_top_height],
            [kailh_clicker_height, 0]
          ], convexity = 4);
      }
  }
}

union() {
  if (cap_type == "KailhBox") {
    translate([0, 0, box_height / 2])
      kailh_box();
  }
  if (cap_type == "Atari130XE") {
    translate([0, 0, atari_box_height / 2])
      atari130xe_box();
  }
  if (stem_type == "KailhBoxPink") {
    translate([0, kailh_stem_horizontal_offset, -kailh_stem_height / 2])
      kailh_stem();
  }
}