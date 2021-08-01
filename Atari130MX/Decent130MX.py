# SPDX-License-Identifier: MIT

"""
`Decent 130MX`
====================================================

This driver connects an Atari 130XE keyboard as an
Altirra-compatible PC keyboard

* Author: Bertrand Le Roy
"""

import board
import digitalio
import time
import usb_hid
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keycode import Keycode

GPIO_BASE = 0xd0000004

keeb = Keyboard(usb_hid.devices)

IN = digitalio.Direction.INPUT
OUT = digitalio.Direction.OUTPUT
PULLUP = digitalio.Pull.UP
PULLDOWN = digitalio.Pull.DOWN

def PinIn(id, pull):
    pin = digitalio.DigitalInOut(getattr(board, 'GP' + str(id)))
    pin.direction = digitalio.Direction.INPUT
    pin.pull = pull
    return pin
    
def PinOut(id):
    pin = digitalio.DigitalInOut(getattr(board, 'GP' + str(id)))
    pin.direction = digitalio.Direction.OUTPUT
    return pin

led = PinOut(2)

row_pin_numbers = [13, 14, 12, 15, 7, 18, 5, 6]
col_pin_numbers = [19, 4, 8, 9, 10, 11, 17, 16, 20]
# Last row is special as pin 3 is connected to ground: cols are: [21, 22, 0, 1] # Pi pin 0-> keeb pin 23, Pi pin 1 -> keeb pin 24
start_pin = PinIn(21, PULLUP)
select_pin = PinIn(22, PULLUP)
option_pin = PinIn(0, PULLUP)
reset_pin =PinIn(1, PULLUP)

SHIFTED = 0x100
CONTROLLED = 0x200

key_matrix = [
    [Keycode.SEVEN,           None,          Keycode.EIGHT,         Keycode.NINE,          Keycode.ZERO,            SHIFTED | Keycode.COMMA,     SHIFTED | Keycode.PERIOD, Keycode.BACKSPACE,              Keycode.PAUSE],
    [Keycode.SIX,             None,          Keycode.FIVE,          Keycode.FOUR,          Keycode.THREE,           Keycode.TWO,                 Keycode.ONE,              Keycode.ESCAPE,                 None],
    [Keycode.U,               None,          Keycode.I,             Keycode.O,             Keycode.P,               Keycode.MINUS,               Keycode.EQUALS,           Keycode.RETURN,                 None],
    [Keycode.Y,               None,          Keycode.T,             Keycode.R,             Keycode.E,               Keycode.W,                   Keycode.Q,                Keycode.TAB,                    None],
    [None,                    Keycode.J,     Keycode.K,             Keycode.L,             Keycode.SEMICOLON,       SHIFTED | Keycode.EQUALS,     SHIFTED | Keycode.EIGHT,  None,                           Keycode.CONTROL],
    [None,                    Keycode.H,     Keycode.G,             Keycode.F,             Keycode.D,               Keycode.S,                   Keycode.A,                Keycode.CAPS_LOCK,              None],
    [Keycode.N,               Keycode.SPACE, Keycode.M,             Keycode.COMMA,         Keycode.PERIOD,          Keycode.FORWARD_SLASH,       Keycode.END,              None,                           None],
    [None,                    Keycode.F6,    Keycode.B,             Keycode.V,             Keycode.C,               Keycode.X,                   Keycode.Z,                None,                           Keycode.SHIFT]]

shifted_overrides = dict([
    (Keycode.SEVEN, Keycode.QUOTE),
    (Keycode.EIGHT, SHIFTED | Keycode.TWO),
    (SHIFTED | Keycode.COMMA, Keycode.HOME),
    (SHIFTED | Keycode.PERIOD, SHIFTED | Keycode.INSERT),
    (Keycode.BACKSPACE, SHIFTED | Keycode.DELETE),
    (Keycode.SIX, SHIFTED | Keycode.SEVEN),
    (Keycode.TWO, SHIFTED | Keycode.QUOTE),
    (Keycode.EQUALS, SHIFTED | Keycode.BACKSLASH),
    (SHIFTED | Keycode.EQUALS, Keycode.BACKSLASH),
    (SHIFTED | Keycode.EIGHT, SHIFTED | Keycode.SIX),
    (Keycode.COMMA, Keycode.LEFT_BRACKET),
    (Keycode.PERIOD, Keycode.RIGHT_BRACKET)])

controlled_overrides = dict([
    (SHIFTED | Keycode.PERIOD, Keycode.INSERT),
    (Keycode.BACKSPACE, Keycode.DELETE),
    (Keycode.ESCAPE, CONTROLLED | Keycode.BACKSLASH),
    (Keycode.MINUS, Keycode.UP_ARROW),
    (Keycode.EQUALS, Keycode.DOWN_ARROW),
    (SHIFTED | Keycode.EQUALS, Keycode.LEFT_ARROW),
    (SHIFTED | Keycode.EIGHT, Keycode.RIGHT_ARROW)])

row_pins = []
col_pins = []

for row_pin_number in row_pin_numbers:
    row_pins.append(PinOut(row_pin_number))

for col_pin_number in col_pin_numbers:
    col_pins.append(PinIn(col_pin_number, PULLDOWN))

#print("{0:b}".format(col_pin_mask))
keys_pressed = set()
def scan_keeb():
    currently_pressed = set()
    shift_pressed = False
    control_pressed = False
    global keys_pressed
    for row_idx, row_pin in enumerate(row_pins):
        # Light-up this row
        row_pin.value = 1
        # Get all column pins at once through the hardware register
        for col_idx, col_pin in enumerate(col_pins):
            if col_pin.value:
                key = key_matrix[row_idx][col_idx]
                if key == Keycode.SHIFT:
                    shift_pressed = True
                if key == Keycode.CONTROL:
                    control_pressed = True
                if not key is None:
                    currently_pressed.add(key)
        # Turn off this row so we can scan the next one
        row_pin.value = 0
    # Look for the additional row, which is pull-up to ground
    if not start_pin.value:
        currently_pressed.add(Keycode.F2)
    if not select_pin.value:
        currently_pressed.add(Keycode.F3)
    if not option_pin.value:
        currently_pressed.add(Keycode.F4)
    if not reset_pin.value:
        currently_pressed.add(Keycode.F5)
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
    
    #if len(currently_pressed - keys_pressed) != 0:
    #    print(currently_pressed - keys_pressed)
    # Press keys not pressed before
    keeb.press(*(currently_pressed - keys_pressed))
    # Release keys no lonnger pressed
    keeb.release(*(keys_pressed - currently_pressed))
    # Update the old set of keys pressed with the current one for the next scan
    keys_pressed = currently_pressed
    # Turn on the led if any key was pressed
    led.value = 1 if len(keys_pressed) > 0 else 0

while True:
    scan_keeb()
    time.sleep(0.001)

print('Ready')

