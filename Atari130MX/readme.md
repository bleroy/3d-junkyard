# Atari 130MX mechanical keyboard replacement for Atari XE computers

There's been a number of previous projects to put a modern keyboard on Atari 8-bit computers. I don't think anyone's done it while preserving the original keycaps though (would love to be proven wrong). This is exactly what I did, by 3D-printing modified stems for Kailh Box Pink switches that take the Atari XE key footprint instead of the Cherry MX cross. Cheap resin printers can print at an amazing 50 micron resolution, which is enough to print very small parts with very fine details. Switch stems are such parts, and must be printed very precisely to reproduce the touch and feel from the original. It took a lot of tinkering to get there, and trying a lot of different resins (in the end, Elegoo black and translucent red were the most reliable), but the keyboard feels absolutely great. What's more, you can't tell the difference from an aesthetic point of view... Check this out:

![The end result](Reference/Atari130MX.jpg)

The project is built on [a new original PCB design](Atari130MX.pro), [a custom laser-cut steel plate](Atari130MX-plate.svg), [Kailh Box Pink switches](https://www.kailhswitch.com/mechanical-keyboard-switches/smt-key-switches/box-blue-white-switches-for-mechanical.html) and Costar stabilizers.

![The Atari 130MX keyboard assembly](Reference/Atari130MX-assembly.jpg)

The stabilizer metal parts are also preserved, but the one for the space bar has a diameter that's considerably larger than off-the-shelf Costar stabilizers can handle, so I also 3D printed new ones:

![Stems and stabilizers, comparison with stock parts](Reference/stems-and-stabilizers.jpg)

Here's [a video showing the end result (Rev. B)](https://youtu.be/r8T07Rskkgs):

<iframe width="560" height="315" src="https://www.youtube.com/embed/r8T07Rskkgs" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## Bill of materials

This project is meant to be reproduced. You'll need a few things that are more or less easy to source, so I've made sure to give multiple roads to success and alternatives for most parts.

It's also an approach that could easily be adapted to other vintage computer keyboards, Atari or not. Everything is provided [under an open source license](../LICENSE) so you're encouraged to reproduce and fork the design.

### Atari XE computer

The project is designed around the conservation of the vintage look of Atari XE computers and the integration of the keyboard in its original case. As such, ideally, you should have a donor XE keyboard, and a host XE computer to receive the end product.

It is also possible however to build and use this keyboard and use it with an emulator on a PC or Mac. In this way, you can get closer to the original experience even if you don't have access to the original hardware.

* Optimal: Atari XE computer
* Fine: a PC or mac with [an emulator](https://www.virtualdub.org/altirra.html)

### Key caps

The best result will be obtained with the vintage key caps from an Atari XE computer. If you don't have access to a set of the original keys, you can build the keyboard with any MX-compatible switches and caps. This is a considerably easier option since no 3D printing is required, but the aesthetic qualities of the results will be clearly inferior.

* Optimal: vintage set of XE key caps
* Fine: MX-compatible set of key caps

### Switches

The starting point for modified switches that work with vintage caps was Kailh box pink switches. A choice of switches is highly personal, and it should be possible to adapt [the stem design](keeb-stem.scad) for other types of switches, but you should be warned this will be **a lot** of work.

* Optimal: 63 Kailh box pink switches
* Fine: if not using vintage caps, any MX-compatible switch would do
* Hard: modify the design for your own preferred switch type

### Stems

The stems are the part of the switch that attaches to the cap, and goes up and down with it. This is the part that I had to design a replacement for. The replacement has a different shape of hole on the top in order to accommodate the Atari XE key caps, but the bottom part should be as close as possible to the original. Because the shape of that bottom part varies from switch to switch, I can only guarantee my design will work with Kailh box pinks.

In order to print them, you'll need a resin printer with a resolution of 50 micrometers (1/20th of a millimeter) or better. I use an [Elegoo Mars 2 Pro](https://www.elegoo.com/products/elegoo-mars-2-pro-mono-lcd-3d-printer), which is both excellent and inexpensive. The printing bed si rather small, so you may want to go for something larger, but keep in mind that resin printers involve a lot of cleanup and potential mess, and a larger bed means even more of that. There are alternatives to the Elegoo Mars, of course.

If you don't own a resin printer, or don't want or can't buy one (a good reason not to adopt one is if you live in an apartment, for example), there is probably a maker space not far from your home or workplace where you can access one.

I'd stay away from online printing services, they are very expensive and are not used to that kind of batch of small parts.

The choice of resin is very important, as the same design on the same printer can give wildly varying qualities of print. For instance, I stay away from all grey Elegoo resins, as I found them to blur the design and be very unreliable. The resins I've had the best results with are Elegoo's [clear red](https://www.elegoo.com/collections/resin/products/elegoo-standard-resin?variant=32365787807792) and [black](https://www.elegoo.com/collections/resin/products/elegoo-standard-resin?variant=32365787938864).

* Optimal:
    * access to a resin printer
    * precision resin
    * key switch and stabilizer lube
* Fine: if you're not using vintage caps, you don't need 3D printed stems

### Stabilizers

The Atari XE keyboard has stabilizers on the left SHIFT key and on the space bar.

The left shift stabilizer is made with a standard metal bar that fits in standard costar stabilizers, for which the plate is designed. Those stabilizers can be bought for a very reasonable price from many places. You could print your own but I'm not providing design files for them at this time.

The space bar is more problematic because the metal part that comes with the XE keyboard is much thicker than the standard costar stabilizers can accommodate, so we need either alternative metal bars to te right dimensions and the right diameter, or we need to print stabilizers with a larger diameter hole. I went for the printed part, but it should be possible to make the metal part instead. I just haven't tried that, so you're on your own if you want to go that route.

* Optimal:
    * original Atari XE stabilizer metal parts
    * access to a resin printer and some resin
    * 2 standard costar stabilizers
* Fine: if not using vintage caps, I'm not surewhat you;d need for the space bar stabilizer, but 4 standard ones plus a custom space bar metal part may be doable

### Main board

The [Atari130MX KiCad project](Atari130MX.pro) should have everything you need to order a 2 layer PCB from any manufacturing house.

* Optimal: [130MX main board](Atari130MX.pro)

### Plate

While it is possible to build and operate a keyboard without a plate, it will not be as nicely aligned and won't feel as solid as it would with a proper plate. There's a number of possible materials that the plate can be manufactured from. [The SVG file for it](Atari130MX-plate.svg) should be all you need if you decide to go with any laser-cuttable material, and nowadays that includes metal. The price will depend on the material you choose. I don't own a laser cutter at all, and the ones that can cut metal are very expensive, so I've been using Ponoko, which, be warned, is not a cheap option.

![My 1.5mm laser-cut steel plate](Reference/steel-plate.jpg)

I'm currently considering what options would enable using a regular PCB, but that's not yet ready.

* Optimal: laser-cut 1.5mm steel plate (cost me ~$75 with tax & shipping)
* Very good: laser-cut 1.6mm aluminum plate
* Fine, maybe: PCB?
* Not fine: laser-cut acrylic. Really, don't even try, it'll shatter. Some other laser-cut plastics may be OK, but I can't help you with that, I don't know.

### Connectors and adapters

The original Atari XE keyboard's connector was just a part of the mylar membrane. We need a replacement for that, and there are many options.

![The Atari 130MX cable adapter](Atari130MX-adapter/Atari130MX-adapter-front.png)

* Optimal:
    * 2 [FFC 26 position 1mm connectors](https://www.digikey.com/en/products/detail/molex/0522072660/5170985)
    * [FFC 26 position 1mm ribbon cable](https://www.digikey.com/en/products/detail/molex/0152670441/4427307)
    * [130MX Adapter](Atari130MX-adapter/Atari130MX-adapter.pro)
    * 1x24 2.54mm pin headers
* Very good:
    * 2 [2x12 position connectors](https://www.digikey.com/product-detail/en/adam-tech/BHR-24-VUA/2057-BHR-24-VUA-ND/9832347)
    * [24 position 2.54mm ribbon cable](https://www.digikey.com/product-detail/en/3m/3365-24-100/3M157996-5-ND/9479206)
    * 2 [2x12 flat cable sockets](https://www.digikey.com/product-detail/en/adam-tech/FCS-24-SG/2057-FCS-24-SG-ND/9832255)
    * [130MX Adapter](Atari130MX-adapter/Atari130MX-adapter.pro)
    * 1x24 2.54mm pin headers
* Fine:
    * 1x24 right-angle 2.54mm pin headers
    * 2 1x12 2.54mm pin headers
    * 24 F-F header cables
* Terrible:
    * 24 wires and some permanent soldering you should be ashamed of

### Misc & optional components

* red LED (you can re-use the one from your old XE keyboard)
* if using as a PC keyboard:
    * Raspberry Pi PICO
    * 100 Ohm resitor
    * Micro-USB cable

**NOTE** Do **not** connect the Pi PICO through USB at the same time as the keyboard is connected to an Atari XE motherboard. The board is not designed for those to be used together, and bad things would probably happen if you tried. There is no hardware protections in place.

## Fabrication and assembly instructions

... to be written soon