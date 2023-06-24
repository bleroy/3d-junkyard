// Some simple hooks to hold a tablet or phone vertically on a surface with rectangular holes
// (c) Bertrand Le Roy under MIT license

$fa = 1;
$fs = 0.2;

// Width of the support hole
hole_width = 9;

// Depth of the support hole
hole_depth = 12.5;

// Back and front holder depth
holder_depth = 5;

// Back and front holder height
holder_height = 23;

// Height of the top part of the hook
top_height = 10;

// Top or bottom gutter
gutter_position = "Top"; // [Top, Bottom]

// Gutter depth
gutter_depth = 14;

// Gutter height
gutter_height = 5;

// Top dam depth
top_dam_depth = 24;

// Top dam height
top_dam_extra_height = 8;

// Round the model
rounded = false;

// Rounding radius
rounding = 1;

module round_box(x, y, z, width, depth, height, rounding) {
    translate([x, y, z])
        cube([width - rounding * 2, depth, height], center = true);
}

module gutter(x, y, z, width, depth, dam_radius, rounding) {
    translate([x - width / 2, y, z - rounding])
        rotate([0, 90, 0])
            union() {
                intersection() {
                    translate([0, 0, width / 2])
                        cylinder(r = depth - rounding * 2, h = width - rounding * 2, center = true);
                    cube([depth, depth, width]);
                }
                translate([0, depth - dam_radius - rounding, width / 2])
                    cylinder(r = dam_radius - rounding, h = width - rounding * 2, center = true);
                translate([depth / 2 - rounding, 0, width / 2])
                    cube([depth - rounding * 2, rounding * 2, width - rounding * 2], center = true);
            }
}

module gutter_top(x, y, z, width, depth, dam_radius, dam_extra_height, rounding) {
    rotate([0, 180, 0])
        translate([x - width / 2, y, z - rounding])
            rotate([0, 90, 0])
                difference() {
                    union() {
                        intersection() {
                            translate([0, depth / 2 - dam_radius, width / 2])
                                cylinder(r = depth / 2 + dam_radius - 2 * rounding, h = width - rounding * 2, center = true);
                            translate([0, rounding * 3 - depth, 0])
                                cube([depth, depth * 2, width]);
                        }
                        translate([-dam_extra_height / 2, depth - dam_radius - rounding, width / 2])
                            cube([dam_extra_height * 2 - 7 * rounding, (dam_radius - rounding) * 2, width - rounding * 2], center = true);
                        translate([-dam_extra_height, depth - dam_radius - rounding, width / 2])
                            cylinder(r = dam_radius - rounding, h = width - rounding * 2, center = true);
                    }
                    translate([0, depth / 2 - dam_radius, width / 2])
                        cylinder(r = depth / 2 - dam_radius, h = width - rounding, center = true);
                }
}

module unrounded_hook() {
    union() {
        // Back of the hook
        round_box(
            0, -holder_depth / 2, (top_height - holder_height) / 2,
            hole_width, holder_depth, holder_height + top_height,
            rounding);

        // Top of the hook
        round_box(
            0, hole_depth / 2, top_height / 2,
            hole_width, hole_depth + 2 * holder_depth, top_height,
            rounding);

        // Front of the hook
        round_box(
            0, hole_depth + holder_depth / 2, (top_height - holder_height) / 2,
            hole_width, holder_depth, holder_height + top_height,
            rounding);

        // gutter
        if (gutter_position == "Top") {
            gutter_top(
                0, hole_depth + holder_depth, 0,
                hole_width,
                top_dam_depth + 2 * gutter_height,
                gutter_height,
                top_dam_extra_height,
                rounding);
        }
        else {
            gutter(
                0, hole_depth + holder_depth, 0,
                hole_width, gutter_depth + 2 * gutter_height,
                gutter_height, rounding);
        }
    }
}

if (rounded) {
    minkowski() {
        unrounded_hook();
        sphere(r = rounding);
    }
}
else {
    unrounded_hook();
}