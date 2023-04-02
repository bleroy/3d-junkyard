// A simple parametric horizontal dock for a phone
// (c) Bertrand Le Roy under MIT license

$fa = 1;
$fs = 0.2;

// Width of the phone
phone_width = 76;

// Height of the phone
phone_height = 150;

// Radius of the phone's rounded corners
phone_rounded_corners = 5;

// Thickness of the phone
phone_thickness = 8.5;

// Size of the border around the phone
border = 3;

// Front height
front_height = 10;

// Back height
back_height = 30;

// Phone hold width
phone_hold_width = 10;

// Back arch clearance
arch_clearance = 10;

incline = asin((back_height - front_height) / (phone_width + 2 * border));
projected_phone_width = cos(incline) * phone_width;
projected_hold_width = cos(incline) * phone_hold_width;

module squircle(width, length, height, corner_radius) {
    hull() {
        translate([corner_radius, corner_radius, height / 2])
            cylinder(r = corner_radius, h = height, center = true);
        translate([width - corner_radius, corner_radius, height / 2])
            cylinder(r = corner_radius, h = height, center = true);
        translate([corner_radius, length - corner_radius, height / 2])
            cylinder(r = corner_radius, h = height, center = true);
        translate([width - corner_radius, length - corner_radius, height / 2])
            cylinder(r = corner_radius, h = height, center = true);
    }
}

difference() {
    // Outer shell
    squircle(phone_height + 2 * border, projected_phone_width + 2 * border, back_height, phone_rounded_corners + border);
    // Cut at the right slope
    translate([-0.05, -0.05, front_height])
        rotate([incline, 0, 0])
            cube([phone_height + 2 * border + 0.1, phone_width + 2 * border + 0.1, phone_height + 2 * border + 0.1 ]);
    // Remove the phone's footprint
    rotate([incline, 0, 0])
        translate([border, border + front_height * sin(incline), front_height - phone_thickness])
            squircle(phone_height, phone_width, phone_thickness, phone_rounded_corners);
    // Inner hole
    translate([border + phone_hold_width, border + projected_hold_width, -0.1])
        squircle(phone_height - 2 * phone_hold_width, projected_phone_width - 2 * projected_hold_width, back_height + 0.1, phone_rounded_corners);
    // Back arch
    back_arch_radius = back_height - phone_thickness - arch_clearance;
    translate([back_arch_radius + border + phone_hold_width, projected_phone_width / 2 + border * 2, 0])
        rotate([-90, 0, 0])
            hull() {
                cylinder(r = back_arch_radius, h = projected_phone_width / 2 + 0.1);
                translate([phone_height - phone_hold_width * 2 - back_arch_radius * 2, 0, 0])
                    cylinder(r = back_arch_radius, h = projected_phone_width / 2 + 0.1);
            }
    // Side access
    translate([phone_rounded_corners + border + phone_thickness, phone_width + border + phone_thickness * sin(incline), back_height + front_height * sin(incline)])
        rotate([incline + 90, 0, 0])
            hull() {
                cylinder(r = phone_thickness, h = phone_width + 2 * border + 2 * phone_thickness * sin(incline) + 0.1);
                translate([phone_height - 2 * phone_rounded_corners - 2 * phone_thickness, 0, 0])
                    cylinder(r = phone_thickness, h = phone_width + 2 * border + 2 * phone_thickness * sin(incline) + 0.1);
            }
    // Top & bottom access
    translate([-0.1, phone_thickness + (phone_rounded_corners + border) * cos(incline), front_height + (phone_rounded_corners + border + front_height) * sin(incline)])
        rotate([90, -incline, 90])
            hull() {
                cylinder(r = phone_thickness, h = phone_height + border + 2 * phone_thickness * sin(incline) + 0.1);
                translate([phone_width - 2 * phone_rounded_corners - 2 * phone_thickness, 0, 0])
                    cylinder(r = phone_thickness, h = phone_height + border + 2 * phone_thickness * sin(incline) + 0.1);
            }
}
