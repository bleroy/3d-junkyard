# JoyKeyMX - an Atari-compatible joystick built with mechanical switches

## Configuration

### LED configuration

The LED circuit is independent and optional. If you go for lighting, you can either use the 5V from pin 7 to power it, or provide power to the J3 LED power connector.
Another option is to address each LED separately through pins 10-16 on J2.

#### Individual power for each LED

LEDs can be powered individually, enabling for any effect you want. For this, leave jumpers JP1 to JP10 open and power the LEDs through pins 10-16 of J2.

The pins correspond to LEDs as follows:

- 10: Button 1 / main fire
- 11: Button 2 / right fire
- 12: Button 3 / left fire
- 13: Up
- 14: Down
- 15: Left
- 16: Right

#### Separate power

To power LEDs through a single separate source, apply power to J3 and solder closed jumpers JP1 to JP7.

#### Use Atari connector power

To power the LEDs through the Atari connector's 5V pin (pin 7), colder closed jumpers JP1 to JP7 as well as JP10. Note that this connects pin 1 of J3 to J1 pin 7 and J2 pin 7.

### JP8 - Right button / paddle

JP8 can be set to position 1-2 to enable the right button as an independent button (connecting pins 5 and 6), or to position 2-3 to enable the right paddle (connecting pins 7 and 5 with pot RV2).

### JP9 - Left button / paddle

JP9 can be set to position 1-2 to enable the left button as an independent button (connecting pins 6 and 9), or to position 2-3 to enable the left paddle (connecting pins 7 and 9 with pot RV1).

## Dependencies

This board uses [se7en9057's universal switch footprint](https://github.com/se7en9057/Universal-Switch-Footprint), which can take pretty much any type of switch on both sides of the board and include a LED.