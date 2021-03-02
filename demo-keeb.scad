$fa = 1;
$fs = 0.4;

// Row offsets
row_offsets = [0, 5, -4];

// Number of columns
cols = 5;

// Box height
box_height = 10;

// Margin around keyboard
margin = 5;

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

// nut depth
nut_depth = 5;

// screw diameter
screw_diameter = 2.75;

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
    {
      cube([width + 5, depth + 5, height * 2], center = true);
    }
  }
}

module pyramid(bottom_width, bottom_length, top_width, top_length, height) {
  linear_extrude(height = height, scale = [top_width / bottom_width, top_length / bottom_length], slices = 2, convexity = 2, center = true)
  {
    square([bottom_width, bottom_length], center = true);
  }
}

module nut_hole(size, height) {
  cylinder($fn = 6, r = size / sqrt(3), h = height, center = true);
  translate([size * sqrt(3) / 4, 0, 0])
    cube([size * sqrt(3) / 4, size, height], center=true);
}

// Build the box
difference() {
  half_box(
    width = cols * (key_side + margin_inner) - margin_inner + 2 * margin + maximum(row_offsets) - minimum(row_offsets),
    depth = len(row_offsets) * (key_side + margin_inner) - margin_inner + 2 * margin,
    height = box_height);
  // Remove key holes
  for(i = [0 : len(row_offsets) - 1])
  {
    for (j = [0 : cols - 1])
    {
      translate([
        row_offsets[i] + (j - (cols - 1) / 2) * (key_side + margin_inner),
        ((len(row_offsets) - 1) / 2 - i) * (key_side + margin_inner),
        0
      ])
      {
        translate([0, 0, box_height - top_thickness / 2])
          keyhole();
        pyramid(key_side + margin / 2, key_side +  margin / 2, key_side + 3, key_side + 3, (box_height - top_thickness) * 2);
      }
    }
  }
  // Remove nut holes
  translate([
    row_offsets[0] - (cols - 1) / 2 * (key_side + margin_inner) - key_side / 2 - nut_size / sqrt(3) - margin / 4,
    ((len(row_offsets) - 1) / 2) * (key_side + margin_inner), 0
  ]) {
    translate([0, 0, nut_depth])
      nut_hole(nut_size, nut_thickness);
    translate([0, 0, (box_height - top_thickness) / 2 - 1])
    cylinder(r = screw_diameter / 2, h = box_height - top_thickness + 1, center = true);
  }
}
