#version 3.7; // 3.6
global_settings { assumed_gamma 1.0 }
#default { finish { ambient 0.2 diffuse 0.9 } }
#default { pigment { rgb <0.447, 0.475, 0.502> } }

//------------------------------------------
#include "colors.inc"
#include "textures.inc"

#include "rad_def.inc"
global_settings {
	radiosity {
		Rad_Settings(Radiosity_IndoorHQ, off, off)
	}
}
#default { finish{ ambient 0 } }

//------------------------------------------
#include "povray_textures.inc"
#include "povray_meshes.inc"

//------------------------------------------
// Camera ----------------------------------
#declare CamUp = < 0, 0, 710.96>;
#declare CamRight = <947.95, 0, 0>;
#declare CamRotation = <13.60354566277671, -2.9395776129976228, 22.944068162610748>;
#declare CamPosition = <-108.3717041015625, -135.93936157226562, 112.352294921875>;
camera {
	orthographic
	location <0, 0, 0>
	direction <0, 1, 0>
	up CamUp
	right CamRight
	rotate CamRotation
	translate CamPosition
}

// FreeCAD Light -------------------------------------
light_source { CamPosition color rgb <0.5, 0.5, 0.5> }

// Background ------------------------------

polygon {
	5, <-473.9755859375, -355.481689453125>, <-473.9755859375, 355.481689453125>, <473.9755859375, 355.481689453125>, <473.9755859375, -355.481689453125>, <-473.9755859375, -355.481689453125>
	pigment {
		gradient y
		color_map {
			[ 0.00  color rgb<0.173, 0.173, 0.341> ]
			[ 0.05  color rgb<0.173, 0.173, 0.341> ]
			[ 0.95  color rgb<0.345, 0.345, 0.388> ]
			[ 1.00  color rgb<0.345, 0.345, 0.388> ]
		}
		scale <1,710.96337890625,1>
		translate <0,-355.481689453125,0>
	}
	finish { ambient 1 diffuse 0 }
	rotate <103.60354566277671, -2.9395776129976228, 22.944068162610748>
	translate <-108.3717041015625, -135.93936157226562, 112.352294921875>
	translate <-39000.37407875061, 89034.96265411377, 23489.277064800262>
}
sky_sphere {
	pigment {
		gradient z
		color_map {
			[ 0.00  color rgb<0.173, 0.173, 0.341> ]
			[ 0.30  color rgb<0.173, 0.173, 0.341> ]
			[ 0.70  color rgb<0.345, 0.345, 0.388> ]
			[ 1.00  color rgb<0.345, 0.345, 0.388> ]
		}
		scale 2
		translate -1
		rotate<13.60354566277671, -2.9395776129976228, 22.944068162610748>
	}
}

//------------------------------------------

#include "povray_user.inc"

// Objects in Scene ------------------------

//----- X_axis -----
//----- Y_axis -----
//----- Z_axis -----
//----- XY_plane -----
//----- XZ_plane -----
//----- YZ_plane -----
//----- X_axis001 -----
//----- Y_axis001 -----
//----- Z_axis001 -----
//----- XY_plane001 -----
//----- XZ_plane001 -----
//----- YZ_plane001 -----
//----- Vertical_Exhaust_Assembly -----
//----- X_axis003 -----
//----- Y_axis003 -----
//----- Z_axis003 -----
//----- XY_plane003 -----
//----- XZ_plane003 -----
//----- YZ_plane003 -----
//----- Joints -----
//----- Back_of_printer001 -----
object { Back_of_printer001_mesh
	finish {
	ambient rgb<0.333, 0.333, 0.333>
	emission rgb<0.000, 0.000, 0.000>
	phong 0.53 phong_size 44.999998807907104 
}

}

//----- GroundedJoint -----
//----- Duct_adapter001 -----
object { Duct_adapter001_mesh
	finish {
	ambient rgb<0.333, 0.333, 0.333>
	emission rgb<0.000, 0.000, 0.000>
	phong 0.53 phong_size 44.999998807907104 
}

}

//----- SpotLight -----
light_source { <0, 0, 0>
	color rgb<1.0, 1.0, 1.0>
	spotlight
	point_at <0, -1, 0>
	radius 30.0
	falloff 45.0
	tightness 0
	rotate <45.00000000000001, -3.1805546814635168e-15, 135.0>
	translate <-420.677886167608, -390.5721138323921, 568.1602986833909>
}

//----- AreaLight -----
light_source { <0, 0, 0>
	color rgb<1.0, 1.0, 1.0>
	area_light
	<50.0, 0, 0>, <0, 50.0, 0>
	5, 5
	adaptive 1
	jitter
	translate <318.75, -427.0, 877.75>
}
