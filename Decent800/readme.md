# Decent 800 mechanical keyboard replacement for Atari 800 computers

![The Decent800 keyboard](./Media/Decent800.jpg)

If you have an Atari 800 with a faulty keyboard or just want to upgrade, this is the project for you.

If you're looking to modify an XE computer, head over to [the DecentXE project](../Atari130MX/). For 600XL and 800XL keyboards, go to [the DecentXL project](../DecentXL/). For the 1200XL keyboard, go to [the Decent1200 project](../Decent1200/).

## Current version

The current revision of the Decent 800 keyboard is: rev. 2.

## Can I buy one?

The project is open-source, and I encourage everyone to build their own. I also sell kits and assembled keyboards for those who are not comfortable with ordering parts, PCBs or using a soldering iron.

How expensive is it? It depends on what you're ordering, but this is a made-to-order custom mechanical keyboard, so not cheap.

## Project history

This is a brand new design that uses a lot of lessons learned from building the [DecentXE](https://github.com/bleroy/3d-junkyard/tree/main/Atari130MX) and the [award-winning DecentXL](https://github.com/bleroy/3d-junkyard/tree/main/DecentXL), but adapts to the specificities of the 800.

## Options

### Switches

Switches are largely a matter of taste. The Decent 800 PCB can be mounted with any MX-compatible switch.

With any type of switch, there is a wide array of choices. If you're new to the world of mechanical keyboards, there are 3 main families of switch experiences:

* Linear (often red): the switch reacts with mostly constant resistance throughout the course of the key press until it hits the bottom.
* Tactile (often brown): there is a higher resistance at a specific point of the key's course, providing tactile feedback to pressing the key.
* Clicky (often white): an even more pronounced and localized resistance is accompanied with an audible and satisfying click.

## Design

![Decent 800 schematic](./Media/Decent800.svg)

The Decent 800 project is made of the following parts (this is not a BOM but a list of custom parts created for this project; see below for the actual BOM):

* A PCB with adjustable blue backlighting.
* An aluminum plate to hold the switches firmly aligned and rigidify the assembly.
* A custom set of MX-compatible modern key caps.
* Four 3D-printed small brackets.
* Cables.

## Bill of materials

This project is meant to be reproduced. You'll need a few things that are more or less easy to source, so I've made sure to give multiple roads to success and alternatives for most parts.

It's also an approach that can be easily adapted to other vintage computer keyboards, Atari or not.

### Atari 800 computer

The project is designed around the conservation of the vintage look of the Atari 800 computer and the integration of the keyboard in its original case. As such, you'll need a host 800 computer to receive the end product.

### Key caps

You'll need a set of caps that you can order from me or from [WASD](https://www.wasdkeyboards.com/decentx-by-xl-freak-85-key-custom-cherry-mx-keycap-set.html).

![The Decent 800 modern layout](./Media/decent_atari_800_charcoalmakerpreview.png)

### Switches

You'll need 57 MX compatible switches.

### Stabilizers and adapters

The Decent 800 keyboard uses three 2U Durock v2 stabilizers for the shift and backspace keys, and one 6.25U Durock v2 stabilizer for the space bar.

### PCB

Use [the Gerber](./Keyboard/production/Decent800-Rev-2.zip), [BOM](./Keyboard/production/Decent800-Rev-2-BOM.csv) and [position](./Keyboard/production/Decent800-Rev-2-Positions.csv) files to order a PCB with all the SMD parts assembled.

![The Decent800 PCB](./Media/Decent800-keyboard-front.png)

### Plate

The plate is just an aluminum PCB. Download [the Gerber](./Plate/production/Decent800-plate-gerber.zip) and have it produced in 1.6mm aluminum. I recommend having this done in black.

![Decent 800 aluminum plate](./Media/Decent800-plate.png)

### Connectors

The connector to the motherboard is a pair of cables with female Dupont connectors on both ends. LED power comes through a pair of wires that get soldered onto the power board on one end, and should have female Dupont connectors on the other side. We need 22 pins spaced 2.54mm (0.1") on a single line for the main keyboard signals and two for LED power. The cables should be at least 10cm long, but 15cm or 20cm will be more comfortable.

You'll also need a 24 pin 2.54mm angled header.

## Assembly

Once you've gathered all the parts, you can assemble them in the following order:

### Mount the stabilizers

The stabilizers consist of a larger part that has the threaded part, a smaller part that slides into the previous one, a metal bar linking two assemblies of the two previous parts, and some hardware. The stabilizers are best assembled in this order: slide the smaller part into the larger one (make sure you orient it properly), then insert one end of the metal rod into that assembly and push it into place so it clicks and is properly secured. Once you've done that with both ends of the stabilizer, you should be able to verify both ends lift together and with no friction (some people like to lube their stabilizers by the way).

Once the stabilizers are assembled, you can put them in their respective places on the top side of the PCB. Insert the bottom, non-threaded part first, try to lay the stabilizer's surface flat on the PCB, and push the top threaded part into place. This usually moves the other end a bit, so make sure both ends are properly inserted all the way into the holes in the PCB.

Turn the PCB over. Position one of the small washers around each of the screw holes for the stabilizers and secure it with a screw.

### Solder the connector

The 24-pin angled header needs to be soldered before assembling the switches because the solder points will be between the PCB and the plate. That will make some switch solder points a little more difficult as they will be partially under the pins.

Solder the 24-pin angled header under the PCB (solder on the top of the PCB, header under). Make sure to leave enough space between the PCB and the pins.

### Mount the switches onto the plate

Insert switches into the aluminum plate with the LED window to the back and the pins to the front.

### Get the plate and PCB together

After making sure all the switch pins are vertical and none are bent out of place, carefully align the plate and switches with the stabilizers and the PCB. Slowly and carefully complete that assembly, making sure no pins get bent. Once that is done, the plate and PCB should be a few millimeters apart, evenly spaced across the whole surface.

You can secure the boards together with tape or clothespins until you've soldered enough switches.

### Solder the switches onto the PCBs

Solder each switch onto the PCBs.

Note the console keys need to be soldered separately after being carefully aligned by hand. I usually solder one leg first, then adjust the alignment and solder the second one to secure it in place.

### Plug the cables

Plug one end of your cables onto those headers.

### Add the key caps

Assemble the key caps onto the switches starting with the stabilized keys. Don't add the caps to the console keys as that will make it difficult to get the keyboard through the tight console key holes.

Your keyboard is now assembled. Let's mount it into the computer.

### Removing the old keyboard

Opening the Atari 800 can be tricky if you haven't done it before. There are some great tutorials and videos showing how to do that. You only need to remove the top of the case, no need to fully disassemble the computer.

Once the top of the case is free, carefully lift it and unplug the keyboard cable from the connector on the motherboard.

Carefully unscrew the old keyboard from the top of the case. Leave the "pull open" part in place (unlike what's on the photo below, that was a mistake).

Get the new keyboard in place under the top of the case. The fit is very tight as the plate should actually enter the hole and only the main PCB should remain visible.

![Positioning the new keyboard in the case](./Media/Decent800-assembly.jpg)

Add the four printed parts to hold the keyboard in place like on the above photo.

### Connect the LED power lines

The keyboard's backlighting needs to get power from the 800 board since the keyboard connector doesn't have a 5V line. Power and ground tap vias can be found on the power board. Use wires with Dupont female connectors on one end, and nothing on the other end. I just cut and tin jumper cables for those.

![Connecting backlighting power lines](./Media/Decent800-power.jpg)

The black wire is ground and the white one is 5V.

### Connect the keyboard

Carefully insert the connectors into the motherboard's keyboard connector.

Connect the two power lines to the remaining two pins on the keyboard's connector. LED ground is the bottom pin, and 5V goes right above that.

### Close the case

Close the case (follow whatever tutorial you followed for disassembling the computer in reverse).

Congratulations, you're done! Turn your computer on and enjoy your mechanical keyboard. It's a good idea to go into BASIC and check every key works. There are also [keyboard testers](https://forums.atariage.com/index.php?app=core&module=attach&section=attach&attach_rel_module=post&attach_id=443022) that will allow for a complete check.

## Troubleshooting

Defects and mistakes happen. If when testing your keyboard, you notice a key or a bunch of them don't work, testing and fixing the keyboard is usually quite easy.

![The back of the Decent800 PCB](./Media/Decent800-keyboard-back.png)

The back of the board shows the matrix the keyboard is built on. It's easy, from the indications there to figure out what pins a switch is supposed to connect. It's like coordinates: the keyboard is essentially a matrix of switches with diodes behind them. You can test continuity using the connector pins and the diode testing mode of your multimeter. Connect your multimeter, press the switch. You can also test the switch directly, and test continuity from it to its neighbours and to the connectors. Most problems can be found this way, and if the keyboard needs repairs, it's usually easy to pull an additional wire to fix a damaged trace.

## Acknowledgements

I want to thank [XLFreak](https://forums.atariage.com/profile/63723-xl-freak/) for designing the modern key cap set for this project.

And of course, many thanks to all those who provided feedback on the [DecentXE keyboard](https://github.com/bleroy/3d-junkyard/tree/main/Atari130MX) over its many revisions or bought a keyboard.

## What about vintage?

The current PCB suports vintage versions of the keyboard through the use of Kailh Choc v1 switches and printed adapters that bridge the gap between the footprint of the Kailh switches and the Atari key caps. The adapters can be printed from models that are in [the SCAD file for all adapters](../Atari130MX/Stems/keeb-stem.scad). Wide keys are offset, which necessitates weird positioning of the switch footprints on the PCB.

There's a reason why I stopped producing vintage keyboards: they are of much lower quality than the modern ones, so if you want to go that route, you're on your own, sorry...

The types of keyboards I've seen so far for the 800 are:

* [Mitsumi KSD](https://deskthority.net/wiki/Mitsumi_KSD_Type): 1.6mm cross pattern
* [Hi-Tek High Profile](https://deskthority.net/wiki/Hi-Tek_High_Profile): square pattern, flat-top variant