# DecentUSB Host - a USB / Bluetooth / Wifi host for Atari 8-bit computers

![The DecentUSB Host board installed in an Atari 800XL computer](./Media/DecentUSB-Host.JPG)

## Disclaimer

This is very much a prototype.
Both the hardware and the software are work in progress but the proof of concept is here.

## Summary

The DecentUSB Host aims at being a low-cost extension for Atari 8-bit computers that brings USB,
Bluetooh and Wifi capabilities to the platform.
It's open source both in hardware and software to allow the community to easily build new features.

The device is a multi-function interface to keyboards, gamepads or memory devices
in a single board that costs less than $15 to build.

The Raspberry Pi Pico has been a fantastic booster for retro-computer extensions.
Its fast PIO state machines and its extremely low price enable applications involving precise timing
of signals with a much lower barrier to entry than FPGAs.

Specifically, the Pico-W can act as a USB host, a Bluetooth host, and a WiFi card.
By connecting it internally to the relevant Atari 8-bit buses and signals, we can interface modern
devices with our favorite retro platform.

## Applications

Once drivers have been built, we should be able to support the following scenarios (non exhaustive list):

* USB and Bluetooth keyboards
* USB and Bluetooth gamepads
* USB and Bluetooth mouses
* USB stick drives and SD cards
* Internet access (potentially in a FujiNet-compatible way)
* Atari to PC communication (potentially in a SIO2PC-compatible way)

## Internal interfaces

The DecentUSB Host board exposes pins that connect to the following signals inside the Atari:

* GND and 5V power the Pi and its helper chips
* Pokey K0-6, KR1 and KR2: enables the device to simulate a keyboard
* Start, select, option, reset: enables console key control, for example through an external keyboard
* SIO clock in/out, data in/out and command: enables SIO device simulation
* Joystick port 1 up, down, left, right and fire as well as A_POT: enables joystick simulation
* Potentially other signals using the remaining free GPIOs on the Pi

## External interfaces

* USB-A: enables the connection of keyboards, gamepads, memory cards, etc.
* WiFi: enables connecting the Atari to a WiFi network
* Bluetooth: enables the connection of wireless keyboards, gamepads, etc.
* Extra GPIOs: can be used to connect a small screen and buttons to control the device (for example to select a disk image on a USB stick)

## Design

![The schematic for the DecentUSB Host board](./Board/DecentUSB.svg)

The board is organized around a Raspberry Pi Pico-W. Because the Pi Pico's GPIOs are 3.3V, we need level shifting
when communicating with Atari chips, that work with 5V.
A [74LS245 octal bus transceiver with 3-state outputs](https://www.ti.com/lit/ds/symlink/sn74ls245.pdf?ts=1721591805770&ref_url=https%253A%252F%252Fwww.ti.com%252Fproduct%252FSN74LS245%253Fbm-verify%253DAAQAAAAJ_____z09G5w-RuXKmyqPN9D01GsauQwYL8dDyMXiK44u71BrArA7bduJh3_OD8st1mj1Cc3ZQpKBlPkj0bqm2ZqPSW0lef3Epl4jaI_pUddQ0aPeXT9HDIQboftbEbC32nspc6P45mNWv85oCSzuZ3bw6x_tf0xGXKeRdpE4WSm0GdRcWSv3V-uQrgrP_k79VoEyhaTUUqllb1Mgz0MrIIXEplHwcklhPus3aLMropnEETrmvWX90fqZ9q2pWK7u4F95ruxiMyiBAu3lhsDOHY2GYXNoXjbwjd2Grb8x_CDRsfsvbxKD)
that is compatible with 3.3V and 5V does the fast level shifting we need to read the K0-6 and KR2 lines
from Pokey as well as EXT2 and make those signals available to the Pi on its GPIOs.

![The DecentUSB Host board](./Media/DecentUSB-Host-out.JPG)

We also have a [MCP23017 5V-compatible GPIO extender](https://ww1.microchip.com/downloads/en/devicedoc/20001952c.pdf)
that we use to interface with other 5V signals (Pokey's KR1, SIO signals, joystick digital signals and
the console key signals).

Finally, power is supplied to the board through the Pi either from the Atari motherboard if that's connected,
or through the Pi's micro-USB port.
MOSFET Q3 takes care of selecting the correct power supply.
This enables the board to be safely programmed through the micro-USB port while the board is connected
inside the Atari.

![An Atari 800XL case-modded for the DecentUSB Host board](./Media/USB800XL.jpg)

Physically, the board is designed to fit in an Atari 800XL between the ROMs and the SIO port.
Optionally, the case can be modified on the right side behind the joystick ports to let a USB port through.
If the user doesn't want to use USB but only Bluetooth and Wifi, the board can operate without case mods.

In a XE computer, the board can be fitted closer to the keyboard connector.
The optional USB port can be exposed to the outside through a case mod that lets the new port through the
right side of the case in front of the joystick ports.

In other machines such as the 600XL or XEGS, the back of the case can let the USB port through.
If necessary, there could be optimized versions for each model or form factor.

### Pokey keyboard scanning

The way the Pokey chip scans keyboards is with 6 clock signals and two return lines.

The 6 clock lines, K0 to K5, have frequencies divided by two with each one, starting with K0 at 7.85kHz,
continuing to K1 at 3.925kHz and so on down to K5 at 245Hz.
The set of clock signals creates a binary counter that goes through all values from 0 to 63 in about 4ms,
or 245 times per second.

The 6 bits of this counter are split into two sets of 3 bits that are sent to [4051 decoder chips (U24 and U25)](https://www.digikey.com/htmldatasheets/production/63891/0/0/1/cd4051-53bc.pdf)
that activate one of their 8 I/O lines.
One chip (U25) is used for rows on the keyboard matrix and the other (U24) for columns.
The chip used for rows is setup in sending mode by pulling its in/out signal (pin 3) down to ground.
The chip used for columns is setup in receiving mode by leaving in/out pulled up to 5V but connected to
Pokey's KR1 line (pin 25).

Note that the "active" state of a line is low.
When the key at the intersection of the row and column being scanned is not pressed, KR1 remains high.
When the key is pressed, the selected line on the row and column 4051s are connected, which brings
KR1 to become low.

The values of the K0-K5 lines at any moment when KR1 is low is what becomes the new keyboard scan code
through a simple bit inversion and using K5 as the most significant bit.

For example, if K0-K5 have the following state: `011111`, transform that into `000001`, which is `0x01`,
the scan code for `J`.

Another example, the space key, has scan code 33, or `0x21`, which transforms into K0-K5 `011110`

Here's what it looks like in logic analyzer with lines K0 to K5, then KR2 and KR1:

![Space](./Reference/PokeyCycle_Space.png)

Here's another example, the escape key, which has scan code 28, `0x1C`, which translates to `110001`:

![Esc](./Reference/PokeyCycle_Esc.png)

Here's a table of all scan codes and their translation:

|Key   |Scan code| K0-K5|
|------|---------|------|
|Esc   |       28|110001|
|1     |       31|000001|
|2     |       30|100001|
|3     |       26|101001|
|4     |       24|111001|
|5     |       29|010001|
|6     |       27|001001|
|7     |       51|001100|
|8     |       53|010100|
|9     |       48|111100|
|0     |       50|101100|
|&lt;  |       54|100100|
|&gt;  |       55|000100|
|Del   |       52|110100|
|Tab   |       44|110010|
|Q     |       47|000010|
|W     |       46|100010|
|E     |       42|101010|
|R     |       40|111010|
|T     |       45|010010|
|Y     |       43|001010|
|U     |       11|001011|
|I     |       13|010011|
|O     |        8|111011|
|P     |       10|101011|
|-     |       14|100011|
|=     |       15|000011|
|Return|       12|110011|
|A     |       63|000000|
|S     |       62|100000|
|D     |       58|101000|
|F     |       56|111000|
|G     |       61|010000|
|H     |       57|011000|
|J     |        1|011111|
|K     |        5|010111|
|L     |        0|111111|
|;     |        2|101111|
|+     |        6|100111|
|*     |        7|000111|
|Caps  |       60|110000|
|Z     |       23|000101|
|X     |       22|100101|
|C     |       18|101101|
|V     |       16|111101|
|B     |       21|010101|
|N     |       35|001110|
|M     |       37|010110|
|,     |       32|111110|
|.     |       34|101110|
|/     |       38|100110|
|Atari |       39|000110|
|Space |       33|011110|
|F1    |        3|001111|
|F2    |        4|110111|
|F3    |       19|001101|
|F4    |       20|110101|
|Help  |       17|011101|

This is enough to encode all keys except for the start, select, option and reset console keys
(which have their own line on the keyboard connector and are not handled by Pokey) and shift, control
and break.
Shift, control and break are on a special "ninth column" on the keyboard matrix, that is read from
Pokey's KR2 (pin 16) line and do not go through U24.
Because the signal for KR2 never goes through U24, which handles K0, K1 and K3, the low pulse
for those three keys 

Break corresponds to K3, K4 and K5 100, control is 111 and shift is 101.

On the following timeline, one can see what's going on when the break key is pressed:

![Break](./Reference/PokeyCycle_Break.png)

Here's shift:

![Shift](./Reference/PokeyCycle_Shift.png)

Here's control:

![Control](./Reference/PokeyCycle_Control.png)

And here's shift + control:

![Shift + Control](./Reference/PokeyCycle_Shift_Control.png)

Because the three modifier keys go through a separate reading line, any combination of
shift, control and any other key correspond to different scan codes.
A shifted key has the same scan code as the unshifted key, plus 64.
A controlled key has the same scan code as the uncontrolled key, plus 128.
Of course, shift and control pressed simultaneously add 128 + 64 = 192 to the regular
scan code.

## Future developments

### Hardware

The prototype relies on the Pi to host a USB port on GPIOs using the USB host library.
One of the disadvantages of this approach is that we're using the Pi's computing resources to wait for USB data.
The USB host library supports only one USB port and can only work in a blocking or polling way, meaning
that it's very difficult to handle other tasks while waiting for USB data without missing
any of it.

For those reasons, the next version of the hardware will include a specialized USB hosting chip such as
[the Microchip PIC16(L)F145X](https://ww1.microchip.com/downloads/aemDocuments/documents/OTH/ProductDocuments/DataSheets/PIC16LF1454-5-9-14-20-Pin-8-Bit-Flash-USB-Microcontroller-with-XLP-Technology-DS40001639C.pdf)
and a 2-port USB hub chip such as
[the Microchip USB2422 2-port USB hub controller](https://ww1.microchip.com/downloads/aemDocuments/documents/OTH/ProductDocuments/DataSheets/00001726B.pdf) to have two active USB ports without having to connect a hub.

The prototype was all through hole components, which is great for experimentation.
The production version of the board will use SMD components, which are easier to source and
will allow for an even more compact design.

I might also add enough GPIO extenders to plug into the PBI.

### Software

The software for the board is currently highly experimental and only establishes a proof of concept.
It can detect USB devices being added and removed. It recognizes any USB keyboard and can read its inputs.
It can map USB keystrokes to Pokey signals.
It can scan the Pokey keyboard pins and simulate keystrokes
(albeit imperfectly at this time because it does so in Python).

Over the next few months, the code will be extended and rewritten to use PIO state machines, which are
much faster than Python code. The main code will be rewritten in C, again for better perf.

I'll also write new drivers for gamepads, thumbdrives and Wifi.