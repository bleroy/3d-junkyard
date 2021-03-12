$fa = 1;
$fs = 0.4;

// Part
part = "top"; // [top, bottom, all]

// Row offsets
row_offsets = [0, 5, -4];

// Number of columns
cols = 5;

// Box height
box_height = 14;

// Margin around keyboard
margin = 6;

// Margin between keys
margin_inner = 5;

// Top thickness
top_thickness = 1.7;

// Key side
key_side = 13.95;

// rounded corner radius
rounded_corner = 1;

// nut size
nut_size = 6.25;

// nut thickness
nut_thickness = 2.25;

// screw diameter
screw_diameter = 2.75;

// screw head diameter
screw_head_diameter = 5.5;

// screw head height
screw_head_height = 2;

function maximum(a, i = 0) = (i < len(a)) ? max(a[i], maximum(a, i + 1)) : 0;
function minimum(a, i = 0) = (i < len(a)) ? min(a[i], minimum(a, i + 1)) : 9999;

module keyhole() {
  cube([key_side, key_side, top_thickness + 0.4], center = true);
}

module half_box(width, depth, height, wall) {
  difference()
  {
    // Outer shell is a rounded cube
    minkowski()
    {
      cube([width - 2 * rounded_corner, depth - 2 * rounded_corner, (height - rounded_corner) * 2], center = true);
      sphere(r = rounded_corner);
    }
    // Remove the bottom half of the box
    translate([0, 0, -height])
      cube([width + 5, depth + 5, height * 2], center = true);
  }
}

module pyramid(bottom_width, bottom_length, top_width, top_length, height) {
  linear_extrude(height = height, scale = [top_width / bottom_width, top_length / bottom_length], slices = 2, convexity = 2, center = true)
    square([bottom_width, bottom_length], center = true);
}

module nut_hole(size, height) {
  cylinder($fn = 6, r = size / sqrt(3), h = height, center = true);
  translate([size * sqrt(3) / 4, 0, 0])
    cube([size * sqrt(3) / 4, size, height], center=true);
}

module screw_receiver(screw_diameter, screw_depth, nut_thickness, nut_size, nut_z) {
  translate([0, 0, nut_z])
    nut_hole(nut_size, nut_thickness);
  translate([0, 0, screw_depth / 2 - 1])
    cylinder(r = screw_diameter / 2, h = screw_depth + 1, center = true);
}

module screw_hole(screw_diameter, screw_depth, screw_head_diameter, screw_head_height) {
  translate([0, 0, screw_depth / 2 - 1])
    cylinder(r = screw_diameter / 2, h = screw_depth + 1, center = true);
  translate([0, 0, screw_head_height / 2 - 1])
    cylinder(r = screw_head_diameter / 2, h = screw_head_height + 1, center = true);
}

usbc_height = 3.5;
usbc_width = 9;

module usbc_port(depth) {
  hull() {
    cube([depth, usbc_width - usbc_height, usbc_height], center = true);
    rotate([0, 90, 0]) {
      translate([0, usbc_width - usbc_height, 0])
        cylinder(r = usbc_height / 2, h = depth, center = true);
      translate([0, usbc_height - usbc_width, 0])
        cylinder(r = usbc_height / 2, h = depth, center = true);
    }
  }
}

// Box dimensions
bottom_height = 7;
top_height = box_height - bottom_height;
box_width = cols * (key_side + margin_inner) - margin_inner + 2 * margin + 2 / sqrt(3) * nut_size + maximum(row_offsets) - minimum(row_offsets);
box_depth = len(row_offsets) * (key_side + margin_inner) - margin_inner + 2 * margin;

// Screw hole positions
function left_hole_x(row) = row_offsets[row] - (cols - 1) / 2 * (key_side + margin_inner) - key_side / 2 - nut_size / sqrt(3) - margin / 4;
function right_hole_x(row) = row_offsets[row] + (cols - 1) / 2 * (key_side + margin_inner) + key_side / 2 + nut_size / sqrt(3) + margin / 4;
top_row_hole_y = ((len(row_offsets) - 1) / 2) * (key_side + margin_inner) + (key_side - nut_size) / 2;
bottom_row_hole_y = -((len(row_offsets) - 1) / 2) * (key_side + margin_inner) - (key_side - nut_size) / 2;
nut_z = top_height - top_thickness - nut_thickness / 2;

// Raspberry Pi Pico dimensions (cf. https://datasheets.raspberrypi.org/pico/pico-datasheet.pdf)
pi_depth = 21;
pi_width = 51;
pi_distance_from_wall = 1.3;
pi_hole_horizontal_distance = 2;
pi_hole_vertical_distance = 4.8;
pi_hole_radius = 1.05;
pi_pillar_radius = 1.9;
pi_board_thickness = 1;
pi_thickness = 4;
pi_margin = 5;
pi_nut_size = 3.8;
pi_nut_thickness = 1.9;

pi_center_x = box_width / 2 - pi_distance_from_wall - (pi_width) / 2;
pi_pillar_horizontal = pi_width / 2 - pi_hole_horizontal_distance;
pi_pillar_vertical = pi_depth / 2 - pi_hole_vertical_distance;

module pi_support_screw_hole(hole_radius, height, nut_size, nut_thickness) {
  cylinder(r = hole_radius, h = height + 1, center = true);
  translate([0, 0, -height / 2 + nut_thickness - 1])
    cylinder($fn = 6, r = nut_size / sqrt(3), h = nut_thickness + 1, center = true);
}

// Part rendering
difference() {
  union() {
    difference() {
      union() {
        if (part == "top" || part == "all") {
          // Build the top part of the box
          difference() {
            half_box(width = box_width, depth = box_depth, height = top_height);
            // Remove key holes
            for(i = [0 : len(row_offsets) - 1]) {
              for (j = [0 : cols - 1]) {
                translate([
                  row_offsets[i] + (j - (cols - 1) / 2) * (key_side + margin_inner),
                  ((len(row_offsets) - 1) / 2 - i) * (key_side + margin_inner),
                  0
                ])
                {
                  translate([0, 0, top_height - top_thickness / 2])
                    keyhole();
                  pyramid(key_side + margin / 2, key_side +  margin / 2, key_side + 3, key_side + 3, (top_height - top_thickness) * 2);
                }
              }
            }
          }
        }
        if (part == "bottom" || part == "all") {
          // Build the bottom part of the box
          rotate([180, 0, 0])
            half_box(width = box_width, depth = box_depth, height = bottom_height);
        }
      }
      // Carve nut holes
      translate([left_hole_x(0), top_row_hole_y, 0])
        screw_receiver(screw_diameter, top_height - top_thickness, nut_thickness, nut_size, nut_z);
      translate([left_hole_x(len(row_offsets) - 1), bottom_row_hole_y, 0])
        screw_receiver(screw_diameter, top_height - top_thickness, nut_thickness, nut_size, nut_z);
      translate([right_hole_x(0), top_row_hole_y, 0])
        rotate([0, 0, 180])
          screw_receiver(screw_diameter, top_height - top_thickness, nut_thickness, nut_size, nut_z);
      translate([right_hole_x(len(row_offsets) - 1), bottom_row_hole_y, 0])
        rotate([0, 0, 180])
          screw_receiver(screw_diameter, top_height - top_thickness, nut_thickness, nut_size, nut_z);
      // Carve screw holes
      translate([left_hole_x(0), top_row_hole_y, -bottom_height])
        screw_hole(screw_diameter, bottom_height + 1, screw_head_diameter, screw_head_height);
      translate([left_hole_x(len(row_offsets) - 1), bottom_row_hole_y, -bottom_height])
        screw_hole(screw_diameter, bottom_height + 1, screw_head_diameter, screw_head_height);
      translate([right_hole_x(0), top_row_hole_y, -bottom_height])
        screw_hole(screw_diameter, bottom_height + 1, screw_head_diameter, screw_head_height);
      translate([right_hole_x(len(row_offsets) - 1), bottom_row_hole_y, -bottom_height])
        screw_hole(screw_diameter, bottom_height + 1, screw_head_diameter, screw_head_height);
      // Carve wire ducts
      for(i = [0 : len(row_offsets) - 1]) {
        translate([row_offsets[i], ((len(row_offsets) - 1) / 2 - i) * (key_side + margin_inner), 0])
          rotate([0, 90, 0])
            cylinder(r = 2, h = (cols - 1) * (margin + key_side), center = true);
      }
      translate([box_width / 2 - pi_distance_from_wall - (pi_width + pi_margin) / 2, 0, 0])
        rotate([90, 0, 0])
          cylinder(r = 2, h = (len(row_offsets) - 1) * (margin + key_side) - 2, center = true);
      // Carve out the Pi's space
      translate([box_width / 2 - pi_distance_from_wall - (pi_width + pi_margin) / 2, 0, 1 - pi_thickness / 2])
        cube([pi_width + pi_margin, pi_depth + 2 * pi_margin, pi_thickness + 1], center = true);
      // Carve the USB-C port
      translate([(box_width - pi_distance_from_wall) / 2, 0, 0])
        usbc_port(pi_distance_from_wall + 1);
    }
    if (part == "bottom" || part == "all") {
      // Add pi pillars
      translate([pi_center_x, 0, -pi_thickness / 2 - pi_board_thickness - 1]) {
        translate([pi_pillar_horizontal, pi_pillar_vertical, 0])
          cylinder(r = pi_pillar_radius, h = pi_thickness / 2 - pi_board_thickness + 1, center = true);
        translate([-pi_pillar_horizontal, pi_pillar_vertical, 0])
          cylinder(r = pi_pillar_radius, h = pi_thickness / 2 - pi_board_thickness + 1, center = true);
        translate([pi_pillar_horizontal, -pi_pillar_vertical, 0])
          cylinder(r = pi_pillar_radius, h = pi_thickness / 2 - pi_board_thickness + 1, center = true);
        translate([-pi_pillar_horizontal, -pi_pillar_vertical, 0])
          cylinder(r = pi_pillar_radius, h = pi_thickness / 2 - pi_board_thickness + 1, center = true);
      }
    }
  }
  // Remove pi pillar screw holes
  if (part == "bottom" || part == "all") {
    // Add pi pillars
    translate([pi_center_x, 0, -bottom_height / 2]) {
      translate([pi_pillar_horizontal, pi_pillar_vertical, 0])
        rotate([0, 0, 90])
          pi_support_screw_hole(pi_hole_radius, bottom_height, pi_nut_size, pi_nut_thickness);
      translate([-pi_pillar_horizontal, pi_pillar_vertical, 0])
        rotate([0, 0, 90])
          pi_support_screw_hole(pi_hole_radius, bottom_height, pi_nut_size, pi_nut_thickness);
      translate([pi_pillar_horizontal, -pi_pillar_vertical, 0])
        rotate([0, 0, 90])
          pi_support_screw_hole(pi_hole_radius, bottom_height, pi_nut_size, pi_nut_thickness);
      translate([-pi_pillar_horizontal, -pi_pillar_vertical, 0])
        rotate([0, 0, 90])
          pi_support_screw_hole(pi_hole_radius, bottom_height, pi_nut_size, pi_nut_thickness);
    }
  }
}