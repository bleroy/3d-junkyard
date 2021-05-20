$fa = 1;
$fs = 0.2;

side = "both"; // [right, left, both]
what = "both"; // [stabilizer, rod holder, both]
key_type = "space"; // [space, other]

small_hole_diameter = 2.5;
hole_offset_x = 4.5;
hole_offset_y = 10.7;
under_pcb_thickness = 1;
pcb_thickness = 1.6;
key_stabilizer_hole_height = 2.7;
key_stabilizer_depth = 5.85;
key_stabilizer_rod_window_width = 3;
rod_holder_diameter = 3.5;
rod_offset = 0;
rod_lip = 0.1;
rod_turn_radius = 5;
key_inner_angle = 5;
key_edge_offset = 0;
peg_diameter = 1.5;
peg_diameter_tolerance = 0.2;
rounding = 0.1;

large_hole_diameter = key_type == "space" ? 7.5 : 5.5;
rod_diameter = key_type == "space" ? 2 : 1.2;
rod_holder_depth = key_type == "space" ? 2.3 : 2;

key_stabilizer_hole_width = large_hole_diameter + 1;
large_hole_diameter_over_sqrt2 = large_hole_diameter / sqrt(2);
peg_hole_diameter = peg_diameter + peg_diameter_tolerance;

// Under PCB hole base
module hole_base(hole_diameter) {
  translate([0, 0, -under_pcb_thickness / 2])
    cylinder(h = under_pcb_thickness, r1 = hole_diameter / 2, r2 = hole_diameter / 2 + under_pcb_thickness, center = true);
}

// Stabilizer unit
module stabilizer() {
  difference() {
    union() {
      if (what == "stabilizer" || what == "both") {
        // Under PCB base
        hull() {
          hole_base(large_hole_diameter);
          translate([hole_offset_x, hole_offset_y, 0])
            hole_base(small_hole_diameter);
        }

        // In-hole filling
        translate([0, 0, pcb_thickness / 2 - under_pcb_thickness / 4]) {
          cylinder(h = pcb_thickness + under_pcb_thickness / 2, r = large_hole_diameter / 2, center = true);
          translate([hole_offset_x, hole_offset_y, 0])
            cylinder(h = pcb_thickness + under_pcb_thickness / 2, r = small_hole_diameter / 2, center = true);
        }

        // Key stabilizer guides
        minkowski() {
          difference() {
            translate([0, 0, key_stabilizer_depth / 2 + pcb_thickness]) {
              difference() {
                cylinder(h = key_stabilizer_depth, r = large_hole_diameter / 2 - rounding, center = true);
                translate([0, 0, key_stabilizer_depth - large_hole_diameter_over_sqrt2 / 2])
                  rotate([45, 0, 0])
                    cube([large_hole_diameter, large_hole_diameter_over_sqrt2, large_hole_diameter_over_sqrt2], center = true);
              }
            }

            // Space for the key stabilizer and rod to travel
            translate([0, 0, key_stabilizer_depth / 2 + pcb_thickness + 0.5]) {
              cube([key_stabilizer_hole_width, key_stabilizer_hole_height, key_stabilizer_depth + 1], center = true);
              cube([key_stabilizer_rod_window_width, key_stabilizer_hole_width, key_stabilizer_depth + 1], center = true);
            }
          }
          sphere(r = rounding);
        }
      }

      // Rod holder
      if (what == "rod holder" || what == "both") {
        union() {
          translate([0, what == "rod holder" ? 0: hole_offset_y, rod_holder_depth / 2 + pcb_thickness]) {
            difference() {
              cylinder(r = rod_holder_diameter / 2, h = rod_holder_depth, center = true);
              translate([0, rod_offset, rod_diameter / 2 - rod_holder_depth / 2]) {
                rotate([0, 90, 0])
                  cylinder(r = rod_diameter / 2, h = rod_holder_diameter, center = true);
                translate([0, rod_turn_radius, 0])
                  rotate_extrude(convexity = 4)
                    translate([rod_turn_radius, 0, 0])
                      circle(r = rod_diameter / 2);
              }
              if (key_edge_offset > 0)
              {
                translate([0, (small_hole_diameter - small_hole_diameter / 2 + rod_offset) / 2,  (rod_diameter - rod_lip - rod_holder_depth) / 2])
                  cube([small_hole_diameter, small_hole_diameter / 2 - rod_offset, rod_diameter - rod_lip], center = true);
                translate([0, small_hole_diameter / 2 + key_edge_offset, 0])
                  rotate([key_inner_angle, 0, 0])
                    cube([small_hole_diameter, small_hole_diameter, rod_holder_depth * 2], center = true);
              }
            }
            translate([0, 0, -(rod_holder_depth + pcb_thickness) / 2])
              cylinder(h = pcb_thickness, r1 = peg_diameter / 2, r2 = small_hole_diameter / 2, center = true);
            translate([0, 0, -(rod_holder_depth + under_pcb_thickness) / 2 - pcb_thickness])
              cylinder(h = under_pcb_thickness, r = peg_diameter / 2, center = true);
          }
        }
      }
    }
    translate([hole_offset_x, hole_offset_y, pcb_thickness / 2 - under_pcb_thickness / 4]) {
      translate([0, 0, under_pcb_thickness / 4 + 0.02])
        cylinder(h = pcb_thickness + 0.04, r1 = peg_hole_diameter / 2, r2 = small_hole_diameter / 2, center = true);
      translate([0, 0, -under_pcb_thickness / 4 - pcb_thickness / 2 + 0.02])
        cylinder(h = under_pcb_thickness + 0.08, r = peg_hole_diameter / 2, center = true);
    }
  }
}

if (side == "left" || side == "both") {
  stabilizer();
}
if (side == "right" || side == "both") {
  translate([side == "both" ? large_hole_diameter * 2 : 0, side == "both" ? hole_offset_y : 0, 0])
    rotate([0, 0, 180])
      scale([-1, 1, 1])
        stabilizer();
}
