// Stems and adapters to connect vintage key caps to modern switches
// (c) Bertrand Le Roy
// Licensed under MIT

$fa = 1;
$fs = 0.2;

// Cap type
cap_type = "Atari XE ◎"; // [Atari XE ◎, Atari XE ■, Atari XE Console Key, Atari XE Console Set, Atari XE F1-4 Set, Atari XL ✚, Atari XL Alps ▬, Atari XL ⧇, Atari XL Console Key, KailhBox]

// Stem type
stem_type = "Low-pro adapter"; // [Low-pro adapter, Kailh Choc v1, Kailh Box Pink, MX Adapter]

// Legend
legend = ""; // ["", Start, Option, Select, Help, Reset, F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12]

// Repeat rows
rows = 1; // [1:1:10]

// Repeat columns
columns = 1; // [1:1:10]

// Link models from the sides
link_models = false;

// Support from under
support = true;

// Rotate switch 90 degrees
rotate_switch = false;

// Accurate production
accurate = true;

row_count = rows;
column_count = cap_type == "Atari XE Console Set" ? 5 : cap_type == "Atari XE F1-4 Set" ? 4 : columns;

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
extra_floor = 1;
support_diameter = 1.5;
support_height = 2;
support_plate_height = 1.5;

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
atari_box_height = 4;
atari_square_width = accurate ? 3.05 : 3.2;
atari_square_depth = 2.8;
atari_square_circle_radius = atari_square_width * sqrt(2) / 2;
//atari_box_bottom_thickness = 0.7;
atari_box_bottom_outer_offset = 0.05;

module atarixe_square() {
  union() {
    difference() {
      cube([atari_box_width, atari_box_width, atari_box_height], center = true);
      cube([atari_square_width, atari_square_width, atari_box_height + 0.1], center = true);
      translate([0, 0, (atari_square_depth - 1) / 2])
        cylinder(r = atari_square_circle_radius, h = atari_box_height - atari_square_depth + 0.1);
      // Add a recess at the bottom so if resin residues cling in the angles, they do so without preventing the cap from going in completely.
      rotate([0, 0, 45])
        translate([0, 0, 1 - atari_square_depth - 0.1])
          cylinder(h = 1, d1 = atari_square_circle_radius * 2 + 1, d2 = atari_square_circle_radius * 2, $fn = 4);
    }
  }
}

atari_circle_inner_diameter = accurate ? 4.40 : 4.25;
atari_circle_wing_thickness = accurate ? 1.45 : 1.40;
atari_circle_depth = accurate ? 4.8 : 4.0;

module atarixe_circle() {
  union() {
    cylinder(r = atari_circle_inner_diameter / 2, h = atari_circle_depth + extra_floor);
    translate([0, 0, (atari_circle_depth + extra_floor) / 2])
      cube([atari_circle_wing_thickness, atari_box_width - 0.2, atari_circle_depth + extra_floor], center = true);
  }
}

atari_alps_width = 4.6;
atari_alps_depth = 2.3;
atari_alps_height = box_height - 2;
atari_alps_offset = 0;
atari_alps_teeth_width = 0.4;
atari_alps_teeth_depth = 0.2;

module atarixl_alps() {
  union() {
    difference() {
      cube([box_width, box_width, box_height], center = true);
      translate([0, atari_alps_offset + atari_alps_teeth_depth, (box_height - atari_alps_height) / 2 + 0.1])
        difference() {
          cube([atari_alps_width, atari_alps_depth + atari_alps_teeth_depth, atari_alps_height + 0.1], center = true);
          translate([atari_alps_width / 4, atari_alps_depth / 2 + 0.05, 0])
            cube([atari_alps_teeth_width, atari_alps_teeth_depth + 0.05, atari_alps_height], center = true);
          translate([-atari_alps_width / 4, atari_alps_depth / 2 + 0.05, 0])
            cube([atari_alps_teeth_width, atari_alps_teeth_depth + 0.05, atari_alps_height], center = true);
        }
    };
    translate([0, 0, (box_bottom_thickness - box_height) / 2])
      cube([box_width, box_width, box_bottom_thickness], center = true);
  }
}

atarixl_cross_thickness = 1.3;
atarixl_cross_size = 4.4;
atarixl_cross_height = 3.5;
atarixl_cross_teeth_width = 0.4;
atarixl_cross_teeth_depth = 0.05;

module atarixl_cross() {
  translate([0, 0, -0.05])
    union() {
      cube([atarixl_cross_thickness, atarixl_cross_size, atarixl_cross_height + 0.1], center = true);
      cube([atarixl_cross_size, atarixl_cross_thickness, atarixl_cross_height + 0.1], center = true);
      // Teeth:
      translate([3 * atarixl_cross_size / 8, 0, 0])
        cube([atarixl_cross_teeth_width, atarixl_cross_thickness + atarixl_cross_teeth_depth * 2, atarixl_cross_height], center = true);
      translate([-3 * atarixl_cross_size / 8, 0, 0])
        cube([atarixl_cross_teeth_width, atarixl_cross_thickness + atarixl_cross_teeth_depth * 2, atarixl_cross_height], center = true);
      translate([0, 3 * atarixl_cross_size / 8, 0])
        cube([atarixl_cross_thickness + atarixl_cross_teeth_depth * 2, atarixl_cross_teeth_width, atarixl_cross_height], center = true);
      translate([0, -3 * atarixl_cross_size / 8, 0])
        cube([atarixl_cross_thickness + atarixl_cross_teeth_depth * 2, atarixl_cross_teeth_width, atarixl_cross_height], center = true);
    }
}

atarixl_square_size = 4.7;
atarixl_square_height = 4;
atarixl_square_teeth_width = 0.4;
atarixl_square_teeth_depth = 0.05;

module atarixl_square() {
  union() {
    cube([atarixl_square_size, atarixl_square_size, atarixl_square_height], center = true);
    cube([atarixl_square_size + atarixl_square_teeth_depth * 2, atarixl_square_teeth_width, atarixl_square_height], center = true);
    cube([atarixl_square_teeth_width, atarixl_square_size + atarixl_square_teeth_depth * 2, atarixl_square_height], center = true);
  }
}

kailh_stem_horizontal_offset = 0.47;
kailh_stem_spring_column_height = 6.3;
kailh_stem_spring_column_bottom_diameter = 1.40;
kailh_stem_spring_column_upper_diameter = 1;
kailh_stem_spring_column_top_height = 0.3;
kailh_stem_spring_column_cone_height = 1.5;
kailh_stem_spring_column_offset = -0.60;
kailh_stem_main_height = 5;
kailh_stem_main_width = box_width;
kailh_stem_main_depth_left = 4.0;
kailh_stem_main_depth_middle = 4.65;
kailh_stem_main_depth_right = 3.25;
kailh_stem_main_extension_width = 1.8;
kailh_stem_main_hole_diameter = 3.8;
kailh_stem_main_hole_width = 5.1;
kailh_stem_main_hole_depth = 2;
kailh_stem_main_hole_corner_radius = 0.5;
kailh_stem_rail_thickness = 0.6;
kailh_stem_rail_width = 0.35;
kailh_stem_rail3_width = 4.70;
kailh_stem_left_rail1_x = 0.8;
kailh_stem_left_rail2_x = 3.2;
kailh_stem_left_rail3_y = 2.9;
kailh_stem_right_rail1_x = 0.8;
kailh_stem_right_rail2_x = 3.0;
kailh_stem_right_rail3_y = 2.9;
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

module kailh_rails(rail1_x, rail2_x, rail3_y, rail_width, rail_thickness, rail3_width) {
  translate([0, rail1_x, (kailh_stem_spring_column_height - kailh_stem_main_height) / 2])
    cube([rail_thickness, rail_width, kailh_stem_main_height], center = true);
  translate([0, rail2_x, (kailh_stem_spring_column_height - kailh_stem_main_height) / 2])
    cube([rail_thickness, rail_width, kailh_stem_main_height], center = true);
  translate([0, (rail2_x + rail1_x) / 2, rail3_y - rail3_width / 2])
    cube([rail_thickness, rail2_x - rail1_x - rail_width, rail3_width], center = true);
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
            translate([0, 0, -extra_floor/2 - 0.5])
              cylinder(r = kailh_stem_main_hole_diameter / 2, h = kailh_stem_height - extra_floor + 1, center = true);
            hull() {
              translate([kailh_stem_main_hole_corner_radius - kailh_stem_main_hole_width / 2, -kailh_stem_main_hole_corner_radius, -extra_floor])
                cylinder(r = kailh_stem_main_hole_corner_radius, h = kailh_stem_height - extra_floor + 1, center = true);
              translate([kailh_stem_main_hole_width / 2 - kailh_stem_main_hole_corner_radius, -kailh_stem_main_hole_corner_radius, -extra_floor])
                cylinder(r = kailh_stem_main_hole_corner_radius, h = kailh_stem_height - extra_floor + 1, center = true);
              translate([kailh_stem_main_hole_corner_radius - kailh_stem_main_hole_width / 2, kailh_stem_main_hole_corner_radius - kailh_stem_main_hole_depth, -extra_floor])
                cylinder(r = kailh_stem_main_hole_corner_radius, h = kailh_stem_height - extra_floor + 1, center = true);
              translate([kailh_stem_main_hole_width / 2 - kailh_stem_main_hole_corner_radius, kailh_stem_main_hole_corner_radius - kailh_stem_main_hole_depth, -extra_floor])
                cylinder(r = kailh_stem_main_hole_corner_radius, h = kailh_stem_height - extra_floor + 1, center = true);
            }
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
      kailh_rails(kailh_stem_left_rail1_x, kailh_stem_left_rail2_x, kailh_stem_left_rail3_y, kailh_stem_rail_width, kailh_stem_rail_thickness, kailh_stem_rail3_width);
    translate([(kailh_stem_main_width + kailh_stem_rail_thickness) / 2, -kailh_stem_main_width / 2, 0])
      kailh_rails(kailh_stem_right_rail1_x, kailh_stem_right_rail2_x, kailh_stem_right_rail3_y, kailh_stem_rail_width, kailh_stem_rail_thickness, kailh_stem_rail3_width);
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

kailh_choc_height = 3.0 * 2;
kailh_choc_base_dimensions = [9.0, 3.95, 1.0];
kailh_choc_insert_distance = 5.7;
kailh_choc_insert_dimensions = accurate ? [1.15, 2.9, 4.0] : [0.90, 2.6, 3.6];
kailh_choc_insert_teeth_width = 0.4;
kailh_choc_insert_teeth_depth = 0.05;

module kailh_choc() {
  translate([0, 0, kailh_choc_height / 2])
    cube(kailh_choc_base_dimensions, center = true);
  translate([kailh_choc_insert_distance / 2, 0, kailh_choc_height / 4])
    union() {
      cube(kailh_choc_insert_dimensions, center = true);
      // Tooth
      cube([kailh_choc_insert_dimensions[0] + kailh_choc_insert_teeth_depth * 2, kailh_choc_insert_teeth_width, kailh_choc_insert_dimensions[2]], center = true);
    }
  translate([-kailh_choc_insert_distance / 2, 0, kailh_choc_height / 4])
    union() {
      cube(kailh_choc_insert_dimensions, center = true);
      cube([kailh_choc_insert_dimensions[0] + kailh_choc_insert_teeth_depth * 2, kailh_choc_insert_teeth_width, kailh_choc_insert_dimensions[2]], center = true);
    }
}

low_pro_adapter_height = 3.0;
mxadapter_stem_height = stem_type == "Low-pro adapter" ? low_pro_adapter_height : 3;
mxadapter_stem_diameter = 5.55;
mxadapter_cross_thickness = accurate ? 1.1 : 1.35;
mxadapter_cross_size = accurate ? 4 : 4.2;
mxadapter_floor_thickness = 0.;
mxadapter_resin_drain_diameter = mxadapter_cross_thickness;

module mx_adapter() {
  difference() {
    cylinder(r = mxadapter_stem_diameter / 2, h = mxadapter_stem_height, center = true);
    // The cross itself
    translate([0, 0, -mxadapter_floor_thickness * 1.5]) {
      cube([mxadapter_cross_thickness, mxadapter_cross_size, mxadapter_stem_height + mxadapter_floor_thickness + 0.2], center = true);
      cube([mxadapter_cross_size, mxadapter_cross_thickness, mxadapter_stem_height + mxadapter_floor_thickness + 0.2], center = true);
    }
    if (!accurate) {
      // Some resin drainage pipes
      translate([0, 0, -mxadapter_floor_thickness * 1.5 + mxadapter_stem_height / 2 - mxadapter_resin_drain_diameter / 2 - 0.1]) {
        rotate([90, 0, 0])
          cylinder(r = mxadapter_resin_drain_diameter / 2, h = mxadapter_stem_diameter, center = true);
        rotate([0, 90, 0])
          cylinder(r = mxadapter_resin_drain_diameter / 2, h = mxadapter_stem_diameter, center = true);
      }
    }
  }
}

fn_side = 26.4;
fn_depth = fn_side * cos(45) - 0.5;
fn_height = 9;
fn_fillet = 5;
fn_top_thickness = stem_type == "MX Adapter" ? fn_height - 6.5 : fn_height;
fn_hole_diameter = 16 * sqrt(2);
fn_stabilizer_diameter = 3.9;
fn_stabilizer_distance = 12;
fn_stabilizer_length = 5;
fn_legend_distance = 5;
fn_legend_depth = accurate ? 0.5 : 0.4;
fn_legend_size = 2.5;
fn_distance = 28.575;
fn_z_offset = stem_type == "Kailh Choc v1" ? -0.5 : 0;

module atari_fn(legend) {
  translate([-(fn_depth + fn_side) / 2, -fn_depth / 2, fn_z_offset - (fn_height - fn_top_thickness)])
    difference() {
      union() {
        difference() {
          union() {
            difference() {
              // Start with a big block
              cube([fn_depth + fn_side, fn_depth, fn_height]);
              // Remove an edge where the fillet will go
              translate([0, 0, fn_height - fn_fillet])
                rotate([45, 0, 0])
                  cube([fn_side * 1.5, fn_fillet / cos(45), fn_fillet / cos(45)]);
            }
            // Add the stabilizers
            translate([(fn_depth + fn_side) / 2 + fn_stabilizer_distance * cos(22.5), fn_depth / 2 + fn_stabilizer_distance * sin(22.5), -fn_stabilizer_length])
              cylinder(r = fn_stabilizer_diameter / 2, h = fn_stabilizer_length + 0.1);
            translate([(fn_depth + fn_side) / 2 - fn_stabilizer_distance * cos(22.5), fn_depth / 2 - fn_stabilizer_distance * sin(22.5), -fn_stabilizer_length])
              cylinder(r = fn_stabilizer_diameter / 2, h = fn_stabilizer_length + 0.1);
            // Support
            if (support) {
              translate([0, 0,  -fn_stabilizer_length - support_height + 0.05]) {
                translate([(fn_depth + fn_side) / 2 + fn_stabilizer_distance * cos(22.5), fn_depth / 2 + fn_stabilizer_distance * sin(22.5), 0])
                  cylinder(r = support_diameter / 2, h = support_height + 0.1);
                translate([(fn_depth + fn_side) / 2 - fn_stabilizer_distance * cos(22.5), fn_depth / 2 - fn_stabilizer_distance * sin(22.5), 0])
                  cylinder(r = support_diameter / 2, h = support_height + 0.1);
              }
            }
          }
          // Carve the legend
          translate([fn_depth, fn_depth - fn_legend_distance, fn_height - fn_legend_depth])
            linear_extrude(height = fn_legend_depth + 0.1)
              text(legend, size = fn_legend_size, font = "Arial:style=Bold", valign = "baseline");
        }
        // Add the fillet (which is a quarter-cylinder)
        translate([0, fn_fillet, fn_height - fn_fillet])
          rotate([0, 90, 0])
            difference() {
              cylinder(r = fn_fillet, h = fn_side * 1.3);
              // Remove the unused half of the cylinder
              translate([fn_fillet * 0.5, -fn_fillet * 1.2, -fn_side * 0.1])
                rotate([0, 0, 45])
                  cube([fn_fillet *2.2, fn_fillet * 6, fn_side * 1.5]);
            }
      }
      // Remove the angled part on the left
      translate([0, 0, -0.5])
        rotate([0, 0, 45])
          cube([fn_side, fn_side, fn_height + 1]);
      // And the angled part on the right
      translate([fn_side, 0, -0.5])
        rotate([0, 0, -45])
          cube([fn_side, fn_side, fn_height + 1]);
      // Dig a pyramid in the underside to make room for the switch,
      // plus two others on either side to make room for the adjacent switches
      translate([(fn_depth + fn_side) / 2, fn_depth / 2, -0.1])
        rotate([0, 0, 45])
          cylinder(r1 = fn_hole_diameter / 2, r2 = fn_hole_diameter / 2 - 1.5 * sqrt(2), h = fn_height - fn_top_thickness + 0.1, $fn = 4);
      translate([(fn_depth + fn_side) / 2 + fn_distance, fn_depth / 2, -0.1])
        rotate([0, 0, 45])
          cylinder(r1 = fn_hole_diameter / 2, r2 = fn_hole_diameter / 2 - 1.5 * sqrt(2), h = fn_height - fn_top_thickness + 0.1, $fn = 4);
      translate([(fn_depth + fn_side) / 2 - fn_distance, fn_depth / 2, -0.1])
        rotate([0, 0, 45])
          cylinder(r1 = fn_hole_diameter / 2, r2 = fn_hole_diameter / 2 - 1.5 * sqrt(2), h = fn_height - fn_top_thickness + 0.1, $fn = 4);
    }
}

xl_console_size = 18.1;
xl_console_height = 6.15;
xl_console_wall = 2;
xl_console_hole_depth = stem_type == "Kailh Choc v1" ? 0 : 4.9;
xl_console_fillet = 0.5;

module xl_console() {
  translate([0, 0, xl_console_height / 2 - xl_console_hole_depth])
    difference() {
      minkowski() {
        cube([xl_console_size - xl_console_fillet * 2, xl_console_size - xl_console_fillet * 2, xl_console_height - xl_console_fillet * 2], center = true);
        sphere(r = xl_console_fillet);
      }
      translate([0, 0, (xl_console_hole_depth - xl_console_height) / 2 - 0.1])
        cube([xl_console_size - 2 * xl_console_wall, xl_console_size - 2 * xl_console_wall, xl_console_hole_depth + 0.2], center = true);
  }
  if (support) {
    support_pillar_distance = xl_console_size / 2 - xl_console_wall / 2;
    support_pillar_height = support_height - support_plate_height + (stem_type == "Kailh Choc v1" ? kailh_choc_insert_dimensions[2] : 0) + 0.1;
    translate([0, 0, 0.05 - support_pillar_height]) {
      translate([support_pillar_distance, support_pillar_distance, 0])
        cylinder(r = support_diameter / 2, h = support_pillar_height);
      translate([-support_pillar_distance, -support_pillar_distance, 0])
        cylinder(r = support_diameter / 2, h = support_pillar_height);
    }
  }
}

union() {
  // Model links and support are only defined for some combinations of switch footprint and stem
  horiz_conn_radius = cap_type == "Atari XE ◎" ? atari_circle_wing_thickness / 2  :
    cap_type == "Atari XL ✚" ? atarixl_cross_thickness / 2 :
    cap_type == "Atari XE ■" ? 0.75 :
    0.75;
  horiz_conn_altitude = cap_type == "Atari XE ◎" ? rotate_switch ? extra_floor - horiz_conn_radius : atari_circle_depth + extra_floor - horiz_conn_radius :
    cap_type == "Atari XL Console Key" ? -xl_console_hole_depth / 2 + horiz_conn_radius :
    cap_type == "Atari XE ■" || cap_type == "Atari XL ✚" ? horiz_conn_radius :
    cap_type == "Atari XE Console Set" || cap_type == "Atari XE F1-4 Set" || cap_type == "Atari XE Console Key" ? fn_top_thickness - fn_height + horiz_conn_radius :
    20;
  horiz_offset = cap_type == "Atari XE ◎" ? 8 :
    cap_type == "Atari XL ✚" ? 6 : 
    cap_type == "Atari XE ■" ? 10 :
    cap_type == "Atari XE Console Key" || cap_type == "Atari XE Console Set" || cap_type == "Atari XE F1-4 Set" ? fn_depth + 2 :
    20;
  horiz_conn_length = cap_type == "Atari XE ◎" ? (horiz_offset - atari_circle_wing_thickness - atari_circle_inner_diameter) * (rotate_switch ? 2 : 1) + 0.1 :
    cap_type == "Atari XE ■" ? horiz_offset - atari_box_width + 0.1 :
    cap_type == "Atari XE Console Key" || cap_type == "Atari XE Console Set" || cap_type == "Atari XE F1-4 Set" ? horiz_offset - fn_depth + 0.2 :
    cap_type == "Atari XL Console Key" ? 20.5 + xl_console_fillet * 2 - xl_console_size :
    horiz_offset;
  vert_conn_radius = stem_type == "MX Adapter" || stem_type == "Low-pro adapter" ? atari_circle_wing_thickness / 2 :
    stem_type == "Kailh Choc v1" ? max(kailh_choc_base_dimensions[2] / 2, 0.5) :
    0.75;
  vert_conn_altitude = cap_type == "Atari XE Console Set" || cap_type == "Atari XE F1-4 Set" || cap_type == "Atari XE Console Key" ? fn_top_thickness - fn_height + horiz_conn_radius :
    cap_type == "Atari XL Console Key" ? -xl_console_hole_depth / 2 + vert_conn_radius:
    stem_type == "MX Adapter" || stem_type == "Low-pro adapter" ? vert_conn_radius - mxadapter_stem_height :
    stem_type == "Kailh Choc v1" ? 0 :
    20;
  vert_offset = cap_type == "Atari XE Console Key" || cap_type == "Atari XE Console Set" || cap_type == "Atari XE F1-4 Set" ? fn_side + 2 :
    cap_type == "Atari XL Console Key" ? 20 :
    stem_type == "MX Adapter" || stem_type == "Low-pro adapter" ? 8 :
    stem_type == "Kailh Choc v1" ? 10 :
    20;
  vert_conn_length = cap_type == "Atari XE Console Key" || cap_type == "Atari XE Console Set" || cap_type == "Atari XE F1-4 Set" ? 2.1 :
    cap_type == "Atari XL Console Key" ? 20.5 + xl_console_fillet * 2 - xl_console_size :
    stem_type == "MX Adapter" || stem_type == "Low-pro adapter" ? vert_offset - mxadapter_stem_diameter + 0.3 :
    stem_type == "Kailh Choc v1" ? vert_offset - kailh_choc_base_dimensions[0] + 0.1 :
    20;

  support_plate_length = row_count * horiz_offset;
  support_plate_width = column_count * vert_offset;
  support_z_offset = -support_plate_height -
    (cap_type == "Atari XE Console Set" || cap_type == "Atari XE F1-4 Set" || cap_type == "Atari XE Console Key" ? fn_height  :
    stem_type == "Kailh Choc v1" ? kailh_choc_insert_dimensions[2] : 0);

  for (row = [1:row_count]) {
    for (col = [1:column_count]) {
      translate([(col - 1) * vert_offset, (row - 1) * horiz_offset, 0]) {
        union() {
          if (cap_type == "KailhBox") {
            translate([0, 0, box_height / 2])
              kailh_box();
          }
          if (cap_type == "Atari XE ■") {
            translate([0, 0, atari_box_height / 2])
              atarixe_square();
          }
          if (cap_type == "Atari XE ◎") {
            extra_floor = 1;
            rotate([0, 0, rotate_switch ? 90 : 0])
              atarixe_circle();
          }
          if (cap_type == "Atari XL Alps ▬") {
            translate([0, 0, box_height / 2])
              atarixl_alps(); 
          }
          if (cap_type == "Atari XL ✚") {
            translate([0, 0, atarixl_cross_height / 2])
              atarixl_cross();
          }
          if (cap_type == "Atari XL ⧇") {
            translate([0, 0, atarixl_square_height / 2])
              atarixl_square();
          }
          if (cap_type == "Atari XE Console Key") {
            atari_fn(legend);
          }
          if (cap_type == "Atari XE Console Set") {
            atari_fn(["Start", "Option", "Select", "Help", "Reset"][col - 1]);
          }
          if (cap_type == "Atari XE F1-4 Set") {
            atari_fn(["F1", "F2", "F3", "F4"][col - 1]);
          }
          if (cap_type == "Atari XL Console Key") {
            xl_console();
          }
          if (stem_type == "Kailh Box Pink") {
            translate([0, kailh_stem_horizontal_offset, -kailh_stem_height / 2])
              rotate([0, 0, rotate_switch ? 90 : 0])
                kailh_stem();
          }
          if (stem_type == "Kailh Choc v1") {
            translate([0, 0, -kailh_choc_height / 2])
              kailh_choc();
          }
          if (stem_type == "MX Adapter" || stem_type == "Low-pro adapter") {
            translate([0, 0, -mxadapter_stem_height / 2])
              mx_adapter();
          }
          if (link_models) {
            if (row > 1) {
              translate([0, -horiz_offset / 2 + 0.05, horiz_conn_altitude])
                rotate([90, 0, 0])
                  cylinder(r = horiz_conn_radius, h = horiz_conn_length, center = true);
            }
            if (col > 1) {
              translate([-vert_offset / 2, 0, vert_conn_altitude])
                rotate([0, 90, cap_type == "Atari XE Console Key" || cap_type == "Atari XE Console Set" || cap_type == "Atari XE F1-4 Set" ? -45 : 0])
                  cylinder(r = vert_conn_radius, h = vert_conn_length, center = true);
            }
          }
        }
      }
    }
  }
  if (support) {
    translate([-vert_offset / 2, -horiz_offset / 2, support_z_offset])
      cube([support_plate_width, support_plate_length, support_plate_height]);
  }
}