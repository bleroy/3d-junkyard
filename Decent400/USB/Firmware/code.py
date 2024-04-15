# SPDX-License-Identifier: MIT

"""
`Decent400 USB adapter`
====================================================

This CircuitPython driver connects an Atari 130XE keyboard as an
Altirra-compatible PC keyboard

* Author: Bertrand Le Roy
"""

#Settings
power_led_brightness = 50 # Percent brightness for the keyboard's power LED.
pico_led_brightness = 10 # Percent brightness for the Pi Pico's built-in LED.

# Requirements: copy Adafruit's HID library into the lib folder on the Pi Pico.
# Adafruit HID: https://github.com/adafruit/Adafruit_CircuitPython_HID

import board
import digitalio
import pwmio
import usb_hid
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keycode import Keycode

SHIFTED = 0x100
CONTROLLED = 0x200

# Map of the Atari 400 keyboard matrix to key codes
key_matrix = [
    [Keycode.SEVEN,           None,          Keycode.EIGHT,         Keycode.NINE,          Keycode.ZERO,            SHIFTED | Keycode.COMMA,     SHIFTED | Keycode.PERIOD, Keycode.BACKSPACE,              Keycode.F8],
    [Keycode.SIX,             None,          Keycode.FIVE,          Keycode.FOUR,          Keycode.THREE,           Keycode.TWO,                 Keycode.ONE,              Keycode.ESCAPE,                 None],
    [Keycode.U,               None,          Keycode.I,             Keycode.O,             Keycode.P,               Keycode.MINUS,               Keycode.EQUALS,           Keycode.RETURN,                 None],
    [Keycode.Y,               None,          Keycode.T,             Keycode.R,             Keycode.E,               Keycode.W,                   Keycode.Q,                Keycode.TAB,                    None],
    [Keycode.F9,              Keycode.J,     Keycode.K,             Keycode.L,             Keycode.SEMICOLON,       SHIFTED | Keycode.EQUALS,    SHIFTED | Keycode.EIGHT,  Keycode.F10,                    Keycode.CONTROL],
    [None,                    Keycode.H,     Keycode.G,             Keycode.F,             Keycode.D,               Keycode.S,                   Keycode.A,                Keycode.CAPS_LOCK,              None],
    [Keycode.N,               Keycode.SPACE, Keycode.M,             Keycode.COMMA,         Keycode.PERIOD,          Keycode.FORWARD_SLASH,       Keycode.APPLICATION,      None,                           None],
    [Keycode.F11,             Keycode.F6,    Keycode.B,             Keycode.V,             Keycode.C,               Keycode.X,                   Keycode.Z,                Keycode.F12,                    Keycode.SHIFT]]

# Shifted Atari keys have a different layout than PC shifted keys; this maps between the two so the character typed on the Atari keyboard results in the right character on the PC
shifted_overrides = dict([
    (Keycode.SEVEN, Keycode.QUOTE),
    (Keycode.EIGHT, SHIFTED | Keycode.QUOTE),
    (SHIFTED | Keycode.COMMA, Keycode.HOME),
    (SHIFTED | Keycode.PERIOD, SHIFTED | Keycode.INSERT),
    (Keycode.BACKSPACE, SHIFTED | Keycode.DELETE),
    (Keycode.SIX, SHIFTED | Keycode.SEVEN),
#    (Keycode.TWO, SHIFTED | Keycode.QUOTE),
    (Keycode.EQUALS, SHIFTED | Keycode.BACKSLASH),
    (SHIFTED | Keycode.EQUALS, Keycode.BACKSLASH),
    (SHIFTED | Keycode.EIGHT, SHIFTED | Keycode.SIX),
    (Keycode.COMMA, Keycode.LEFT_BRACKET),
    (Keycode.PERIOD, Keycode.RIGHT_BRACKET)])

# Atari control key to PC key
controlled_overrides = dict([
    (SHIFTED | Keycode.PERIOD, Keycode.INSERT),
    (Keycode.BACKSPACE, Keycode.DELETE),
    (Keycode.ESCAPE, CONTROLLED | Keycode.BACKSLASH),
    (Keycode.MINUS, Keycode.UP_ARROW),
    (Keycode.EQUALS, Keycode.DOWN_ARROW),
    (SHIFTED | Keycode.EQUALS, Keycode.LEFT_ARROW),
    (SHIFTED | Keycode.EIGHT, Keycode.RIGHT_ARROW)])

GPIO_BASE = 0xd0000004

keeb = Keyboard(usb_hid.devices)

# Setup the brightness of all LEDs
def set_brightness(pin, percent):
    """Sets up the LED at the specified pin with the specified brightness percentage"""
    return pwmio.PWMOut(pin, frequency = 5000, duty_cycle = int(65535 * percent / 100))

# Helpers to setup pins
def pin_in(id, pull):
    """Helper to setup an input pin from its number"""
    pin = digitalio.DigitalInOut(getattr(board, 'GP' + str(id)))
    pin.direction = digitalio.Direction.INPUT
    pin.pull = pull
    return pin

def pin_out(id):
    """Helper to setup an output pin from its number"""
    pin = digitalio.DigitalInOut(getattr(board, 'GP' + str(id)))
    pin.direction = digitalio.Direction.OUTPUT
    return pin

# Setup LED brightness through PWM and pull ground pins down
power_led = set_brightness(board.GP0, power_led_brightness)
pico_led = set_brightness(board.LED, pico_led_brightness)

# pin numbers for keyboard rows in order
row_pin_numbers = [1, 2, 3, 4, 5, 6, 7, 8]
row_pins = list(map(lambda pin: pin_in(pin, digitalio.Pull.DOWN), row_pin_numbers))

# pin numbers for keyboard columns in order
col_pin_numbers = [10, 11, 12, 13, 14, 15, 16, 17, 9]
col_pins = list(map(lambda pin: pin_out(pin), col_pin_numbers))

# Last row is special as pin 3 is connected to ground: cols are: [21, 22, 0, 1] # Pi pin 0-> keeb pin 23, Pi pin 1 -> keeb pin 24
start_pin = pin_in(21, digitalio.Pull.UP)
select_pin = pin_in(20, digitalio.Pull.UP)
option_pin = pin_in(19, digitalio.Pull.UP)
reset_pin = pin_in(18, digitalio.Pull.UP)

def probe_col(col):
    """
    Lights up a specific column on the keyboard matrix by passing its encoded row number to the decoder.

    Result is a list or rows for key presses on the specified column.
    """
    global row_pins, col_pins
    results = []
    col_pin = col_pins[col]
    col_pin.value = True
    # Read the row pins to detect key presses
    for row_index, row_pin in enumerate(row_pins):
        if row_pin.value:
            results.append(row_index)
    col_pin.value = False
    return results

keys_pressed = set()

def scan_keeb():
    """Scans the keyboard and translates pressed keys to HID events"""
    currently_pressed = set()
    shift_pressed = False
    control_pressed = False
    global keys_pressed
    # Light up one column at a time
    for col_idx in range(9):
        rows = probe_col(col_idx)
        if len(rows) != 0:
            for row_idx in rows:
                key = key_matrix[row_idx][col_idx]
                if key == Keycode.SHIFT:
                    shift_pressed = True
                if key == Keycode.CONTROL:
                    control_pressed = True
                if not key is None:
                    currently_pressed.add(key)
    # Look for the additional row, which is pull-up to ground
    if not start_pin.value:
        currently_pressed.add(Keycode.F7)
    if not select_pin.value:
        currently_pressed.add(Keycode.F6)
    if not option_pin.value:
        currently_pressed.add(Keycode.F5)
    if not reset_pin.value:
        currently_pressed.add(Keycode.F1)
    # Post-process the keys for shifted values, overrides, etc.
    normalized_pressed = set()
    for key in currently_pressed:
        if key == Keycode.SHIFT or key == Keycode.CONTROL:
            continue
        if shift_pressed and key in shifted_overrides:
            key = shifted_overrides[key]
            shift_pressed = False
        if control_pressed and key in controlled_overrides:
            key = controlled_overrides[key]
            control_pressed = False
        shift_pressed = shift_pressed or key & SHIFTED != 0
        control_pressed = control_pressed or key & CONTROLLED != 0
        if shift_pressed:
            normalized_pressed.add(Keycode.SHIFT)
        if control_pressed:
            normalized_pressed.add(Keycode.CONTROL)
        normalized_pressed.add(key & 0xFF)
    currently_pressed = normalized_pressed

    # Press keys not pressed before
    keeb.press(*(currently_pressed - keys_pressed))
    # Release keys no longer pressed
    keeb.release(*(keys_pressed - currently_pressed))
    # Update the old set of keys pressed with the current one for the next scan
    keys_pressed = currently_pressed

while(True):
    scan_keeb()