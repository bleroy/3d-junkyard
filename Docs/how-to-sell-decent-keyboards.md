# How to sell Decent keyboards

Decent keyboards are open source under [a very liberal license](../LICENSE) that allows
for commercial applications. As such, anybody can in principle build, modify and
even sell their own keyboards.

This guide is for small businesses that want to get started selling kits and assembled
Decent keyboards.

## IP and royalties

The open source [license](../LICENSE) under which Decent keyboards are available doesn't require
vendors to share a part of the profit with the authors, in principle.
However, I'd prefer people would adhere to some sort of "don't be a dick" ethos.
A lot of work went into the design of the keyboards, and it seems fair that if
you're going to profit from our work, you would share some of this profit with
us, the authors.

I ([Bertrand Le Roy](https://forums.atariage.com/profile/76850-screamingattheradio/)) created
the general design of the keyboards, in particular the PCBs.

Jesse ([@XL Freak](https://forums.atariage.com/profile/63723-xl-freak/) on AtariAge) designed
all the key caps.

The cost of a keyboard is roughly 1/3 key caps and 2/3 for everything else, so if you're going
to share part of the profit, you should split that share 1/3 - 2/3 between Jesse and I.

Typical royalty rates are 10-15% of the sale price, so if you sell a keyboard for $300,
15% of that would be $45, so I suggest you cut a share of $15 to Jesse and $30 to me.

## What do you need in order to get started?

First, you need a business structure, in accordance with local laws for reselling electronics.

You'll also need a way to get payment from your buyers. I've been using a simple
[Stripe link](https://docs.stripe.com/payment-links), but if you have a full commerce web
site, that's great too.

Of course, you'll need to stock parts and supplies, some of which you can acquire as you
handle orders, some you'll need to have an inventory of, for example because buying in
larger quantities is going to save you money.

Depending on the quantities you order, you may be able to negotiate deals with suppliers.
In most places, businesses can waive the sales tax on the supplies they use to manufacture goods.
Consult your local government to obtain the relevant forms and procedures.
Contact each supplier to ask them to setup your account so taxes are waived.

Finally, some parts are 3D-printed, so you'll need access to a 3D printer, or to have those
parts printed, for example by JLCPCB.

You'll need access to a vinyl cutter to make console key stickers.

### Parts and supplies

1. **PCBs and plates**: the PCBs and plates for each model of Decent keyboard can be ordered
   from JLCPCB or from any PCB manufacturer. Those fabrication houses usually start with
   orders of 5. The PCB for a keyboard can be ordered with all surface-mount parts
   assembled, leaving only the switches to be soldered manually by you.
1. **Cables**: XE and XL models use the same flexible PCB as a cable. Those are relatively
   inexpensive and can also be ordered in batches of at least 5 from JLCPCB. Other models
   use Dupont cables that can easily be ordered from various places (specs by model below).
   Make sure to have enough length (more than 10cm).
1. **Headers**: some keyboards (400, 800 ans 1200XL) need 90 degree angle pin headers.
   those are very easy and inexpensive to source. They can be cut to size.
1. **Stabilizers**: all modern models use one 6.5U stabilizer for the space bar and 3 to 4
   2U stabilizers. All stabilizers are Durock v2 types (although there are other brands).
1. **Key caps**: there are very few companies that print custom key caps. We use
   [GoblinTech](https://goblintechkeys.com/). Note that there's typically a long lead
   of a few weeks on those parts.
1. **Printed parts**: some parts are fine to print on a simple consumer-level printer
   and some more delicate parts such as key cap adapters, are better done on the kind of
   expensive printer places like JLCPCB have.
1. **Switches**: you should have an inventory of linear, tactile and clicky switches, both
   full-size and low-profile (for console keys), sufficient to build a full keyboard with
   each type (around 57 full-size switches and 5 to 11 low-profile).
1. **Packing material**: you'll need boxes and padding material to ship the keyboards safely.
1. **Solder** and soldering supplies and tools.

## Assembly

There are assembly instructions specific to each keyboard type in the relevant readmes in
this repository:

- [DecentXE](../DecentXE/readme.md)
- [DecentXL](../DecentXL/readme.md)
- [Decent1200](../Decent1200/readme.md)
- [Decent400](../Decent400/readme.md)
- [Decent800](../Decent800/readme.md)

Essentially, for all keyboards, the steps are:

1. Mount stabilizers.
1. If there's a flexible PCB for the cable, connect it now. If it's an angled pin header
   connector, it's necessary to solder it now because the connector may be inaccessible
   once the plate and switches have been assembled.
1. Insert switches in the plate, verify pins are properly aligned.
1. Carefully align the pins of the switches and bring the plate and PCB together.
1. Solder the switches.
1. If there are console keys, solder the low-profile switches for them.
1. Add the key caps.
1. Add the console keys if there are any. Apply stickers if relevant.
1. Test the keyboard.
   Keyboards can be tested in a real Atari machine, or you can build and use a
   [Decent Keyboard Tester](../misc-models/KeyboardTester/).

### Troubleshooting

#### Some keys don't work

First check the proper connection of the cable.

If a single key fails to actuate, it's usually a missing or defective solder joint,
or it can be a defective switch. Both issues are easy to diagnose and deal with by
inspecting the board, flowing or reflowing the solder points, or by desoldering and
replacing the switch.

More rarely, a whole set of adjacent switches can fail. That means an entire row or
column is failing. That's a little trickier but still fairly easy to fix.
One common cause could be a broken trace, which can be patched by soldering a cable
replacing the broken trace.

All keyboards have a representation of the internal matrix
for easy reference and diagnostics, as well as a set of extra vias that can be used with a multimeter to probe rows and columns.

When testing with a multimeter, keep in mind that we have anti-ghosting diodes behind
the switches from columns to rows, so a continuity test will work when testing column
traces, but you should use diode testing mode for row traces.

First determine what row or column is defective, then solder a wire between the
relevant labelled via on the diagnostics port and one of the vias on the correct side
of the switches for that row or column.

Fixing rows can be a little more involved because the anti-ghosting diodes are on the
inaccessible side of the PCB, so you can't solder after the diodes.
That means you have to bypass the diodes for that row and establish contact between
all switches on the row. Consult the schematic if in doubt.

#### Stabilized keys don't correctly come back all the way up or at all

Stabilizers can be tricky to get right: their proper function relies on near perfect
alignment and distances between three stems under the key cap.

Because stabilizers are attached to the PCB before the switches are soldered and are
inaccessible thereafter, it can seem discouraging to discover a stabilizer is
misbehaving. However, there are simple steps that are usually enough to make them work.

First, try to loosen the screws of the stabilizers, to give the stabs some freedom
to move into better alignment.

If that doesn't work, you can reflow the switches while operating the keys, which
should deal with misalignment of the switch.

#### F#@#$%, I forgot to assemble the stabilizers before I soldered the switches

Yeah, that sucks. Desoldering 57 switches is dangerous: the risk of damaging a pad
is pretty high, especially on modern PCBs. You may have to discard that PCB once you're
done, but at least the switches should be reusable.

#### I'm still stuck

You can always contact me or someone else with expertise on Decent keyboards through the
AtariAge forums.

## BOM

| Part                         | XE | XL | 1200 | 400 | 800 |
|------------------------------|----|----|------|-----|-----|
|PCB                           |   1|   1|     1|    1|    1|
|Plate                         |   1|   1|     1|    1|    1|
|Flex cable                    |   1|   1|      |     |     |
|5P F/F Dupont                 |    |    |     1|     |     |
|9P F/F Dupont                 |    |    |      |     |    2|
|10P F/F Dupont                |    |    |     1|     |     |
|10P M/F Dupont                |    |    |      |    1|     |
|12P M/F Dupont                |    |    |      |    1|     |
|2P F Dupont, other end tinned |    |    |      |    1|    1|
|15P angled pin headers        |    |    |     1|     |     |
|20P angled pin headers        |    |    |      |     |    1|
|24P angled pin headers        |    |    |      |    1|     |
|6.5U Durock v2 stabilizer     |   1|   1|     1|    1|    1|
|2U Durock v2 stabilizer       |   3|   3|     4|    1|    3|
|MX-style switches             |  57|  57|    56|   62|   57|
|Kailh Choc v1 switches        |   5|   5|    11|     |     |
|Key caps                      |  57|  57|    56|   62|   57|
|Printed console keys (1)      |Opt5|   5|    11|     |     |
|Console key stickers (1)      |Opt5|   5|    11|     |     |
|Cap adapters (1)              |  10|    |      |     |     |
|Printed padding               |   2|    |      |     |     |
|Printed brackets              |    |   2|     2|     |    4|
|Printed support block         |   1|    |     1|     |     |
|LED diffuser (2)              |   1|   2|      |    1|     |

(1) Two sets of key cap adapters for the square and round types of XE 
key caps so people have spares. Ask customer to specify which type
of adapter (square or circle) they need for their vintage console keys.
Provide printed console keys only if the customer asks for them.

(2) The new power LED is small and bright, and should ideally be diffused.
A printed translucent part of the right diameter can fulfill this role.
The diameter on 600XL and 800XL is different, so you should include both parts.

## Component and supplies sources

The following are suggestions for sourcing parts and supplies.
If you can find better ones, for example local suppliers, fantastic!

- [Shipping box](https://www.amazon.com/BOX-USA-BMFL15112-White-Pack/dp/B01D9T473E)
- [Packing material](https://www.amazon.com/dp/B09Y693NJB)
- Anti-static bubble wrap: You can usually cut and re-use the wrap that the fabrication
  house sends the PCBs in.
- [PCBs, plates and flex PCBs](https://cart.jlcpcb.com/quote?orderType=1)
- [Dupont cables](https://www.aliexpress.us/item/3256805354208051.html)
- [Pin headers](https://www.aliexpress.us/item/3256807383526945.html)
- [Stabilizers](https://novelkeys.com/collections/supplies/products/nk-stabilizers) or
  [Durock v3](https://www.aliexpress.us/item/3256801446358046.html)
- [Kailh Box switches](https://novelkeys.com/collections/switches/products/kailh-box-switches)
- [Kailh Choc v1 switches](https://chosfox.com/collections/kailh-low-profile-switch-pg1350/products/kailh-chocs)
- [Key caps](https://goblintechkeys.com/collections/65-keycaps)
- [Printed console keys and key adapters](https://jlc3dp.com/3d-printing-quote)
- [Cuttable XL brushed metal vinyl](https://www.amazon.com/Stainless-Countertops-Waterproof-Backsplash-Appliances/dp/B09TZWGTFB)
- [Cuttable XE grey vinyl](https://www.amazon.com/dp/B0CQYQGDNH)

## Design files

### DecentXE

- [PCB Gerber](../DecentXE/Keyboard/production/Decent_XE_Keyboard_-_Modern_16.zip),
  [BOM](../DecentXE/Keyboard/production/Decent_XE_Keyboard_-_Modern_16-bom.csv) and
  [positions](../DecentXE/Keyboard/production/Decent_XE_Keyboard_-_Modern_16-positions.csv)
- [Plate](../DecentXE/Plate/production/Decent_XE_Keyboard_Plate_-_Modern_16m.zip) should
  be made in aluminium with the default 1.6mm thickness and a black silkscreen.
- [Flex cable](../DecentXL/DecentXL-Cable/production/DecentXL_Flexible_Cable_2.zip): tell the fabrication
  house to apply stiffeners to the two rectangles in the front silkscreen layer.
- [Falcon caps](../DecentXE/Caps/Atari%20XE%20-%20Falcon.svg) and
  [white caps](../DecentXE/Caps/Atari%20XE%20-%20White.svg)
- [Console keys](../DecentXE/Caps/ConsoleKeySet-x2.stl) can be printed in grey or clear resin covered with stickers to make shine-through console keys.
- [Console key stickers](../DecentXE/Caps/ConsoleKeyStickers.svg)
- [Circle key adapters](../DecentXE/Stems/kailh-choc-to-xe-circle-set.stl) and
  [square key adapters](../DecentXE/Stems/kailh-choc-to-xe-square-set.stl)
- [Printed padding](../DecentXE/Stabilizers/HeightPadding.stl)
- [Printed support bracket](../DecentXE/Misc/XE-mid-keeb-support.stl)
- [LED diffuser](../DecentXE/Misc/LED-red-lens.stl)

### DecentXL

- [PCB Gerber](../DecentXL/DecentXL-keyboard/production/DecentXL_keyboard_-_Modern_4.2m.zip),
  [BOM](../DecentXL/DecentXL-keyboard/production/DecentXL_keyboard_-_Modern_4.2m-bom.csv) and
  [positions](../DecentXL/DecentXL-keyboard/production/DecentXL_keyboard_-_Modern_4.2m-positions.csv)
- [Plate](../DecentXL/DecentXL-plate/production/DecentXL_plate_4m.zip) should
  be made in aluminium with the default 1.6mm thickness and a black silkscreen.
- [Flex cable](../DecentXL/DecentXL-Cable/production/DecentXL_Flexible_Cable_2.zip): tell the fabrication
  house to apply stiffeners to the two rectangles in the front silkscreen layer.
- [Caps](../DecentXL/Caps/Atari%20XL.svg)
- [Console keys](../DecentXL/Caps/Console-set-XL-Choc-x10.stl) can be printed in clear resin
  and covered with stickers to make shine-through console keys.
- [Console key stickers](../Decent1200/PrintedParts/ConsoleKeyStickers.svg)
- [600XL LED diffuser](../DecentXL/Misc/LedDiffuser600XL.stl) and
  [800XL LED diffuser](../DecentXL/Misc/LedDiffuser800XL.stl)
- [Left](../DecentXL/Brackets/DecentXL-Left-Bracket.stl) and [right brackets](../DecentXL/Brackets/DecentXL-Right-Bracket.stl)

## Decent1200

- [PCB Gerber](../Decent1200/Keyboard/production/Decent1200_modern_keyboard_5m.zip),
  [BOM](../Decent1200/Keyboard/production/Decent1200_modern_keyboard_5m-bom.csv) and
  [positions](../Decent1200/Keyboard/production/Decent1200_modern_keyboard_5m-positions.csv)
- [Plate](../Decent1200/Plate/production/Decent1200_plate_4m.zip) should
  be made in aluminium with the default 1.6mm thickness and a black silkscreen.
- [Caps](../Decent1200/Caps/Atari%201200XL.svg)
- [Console keys](../Decent1200/Caps/Decent1200-console-choc-x10.stl) can be printed
  in clear resin and covered with stickers to make shine-through console keys.
  **WARNING** the 1200 console keys are different from the XL console keys: they are
  deeper.
- [Console key stickers](../Decent1200/PrintedParts/ConsoleKeyStickers.svg)
- [Printed support](../Decent1200/PrintedParts/KeyboardMiddleSupport1200.stl)
- [Printed brackets](../Decent1200/PrintedParts/Decent1200Brackets.stl)

## Decent400

- [PCB Gerber](../Decent400/Keyboard/production/Decent400_keyboard_2i.zip),
  [BOM](../Decent400/Keyboard/production/Decent400_keyboard_2i-bom.csv) and
  [positions](../Decent400/Keyboard/production/Decent400_keyboard_2i-positions.csv)
- [Plate](../Decent400/Plate/production/Decent400_Plate_2i.zip) should
  be made in aluminium with the default 1.6mm thickness and a black silkscreen.
- [Caps](../Decent400/Caps/Decent_Atari_400_REAL400_Black.svg)
- [LED diffuser](../Decent400/Misc/Decent400LedDiffuser.stl)

## Decent800

- [PCB Gerber](../Decent800/Keyboard/production/Decent800_keyboard_3M.zip),
  [BOM](../Decent800/Keyboard/production/Decent800_Rev_3M-bom.csv) and
  [positions](../Decent800/Keyboard/production/Decent800_Rev_3M-positions.csv)
- [Plate](../Decent800/Plate/production/Decent800_Rev3M.zip) should
  be made in aluminium with the default 1.6mm thickness and a black silkscreen.
- [Caps](../Decent800/Caps/Decent_Atari_800.svg)
- Printed brackets [1](../Decent800/Misc/Decent800%20brackets-ScrewColumn%201.stl),
  [2](../Decent800/Misc/Decent800%20brackets-ScrewColumn%202.stl)
  [3](../Decent800/Misc/Decent800%20brackets-ScrewColumn%203.stl) and
  [4](../Decent800/Misc/Decent800%20brackets-ScrewColumn%204.stl)
