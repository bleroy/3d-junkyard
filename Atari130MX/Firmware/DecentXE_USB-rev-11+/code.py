# SPDX-License-Identifier: MIT

"""
`Decent XE USB adapter`
====================================================

This CircuitPython driver connects an Atari 130XE keyboard as an
Altirra-compatible PC keyboard

* Author: Bertrand Le Roy
"""

#Settings
power_led_brightness = 10 # Percent brightness for the keyboard's power LED.
backlight_brightness = 10 # Percent brightness for the keyboard backlight.
joystick_brightness = 10 # Percent brightness. This won't do anything on ordinary joysticks, but will set the backlight brightness for JoyKeys with backlight.
pico_led_brightness = 10 # Percent brightness for the Pi Pico's built-in LED.

# Requirements: copy Adafruit's HID library into the lib folder on the Pi Pico, as well as hid_gamepad.py into the lib/adafruit_hid.
# Adafruit HID: https://github.com/adafruit/Adafruit_CircuitPython_HID
# Gamepad HID:  https://github.com/adafruit/Adafruit_CircuitPython_HID/blob/main/examples/hid_gamepad.py

import board
import digitalio
import pwmio
import time
import usb_hid
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keycode import Keycode
from adafruit_hid.hid_gamepad import Gamepad

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

GPIO_BASE = 0xd0000004

print("Hello world")
print(usb_hid.devices)

keeb = Keyboard(usb_hid.devices)
joystick = Gamepad(usb_hid.devices)

power_led = pwmio.PWMOut(board.GP2, frequency = 5000, duty_cycle = int(65535 * power_led_brightness / 100))
backlight = pwmio.PWMOut(board.GP3, frequency = 5000, duty_cycle = int(65535 * backlight_brightness / 100))
joy_gnd = pwmio.PWMOut(board.GP26, frequency = 5000, duty_cycle = int(65535 * (100 - joystick_brightness) / 100))
pico_led = pwmio.PWMOut(board.LED, frequency = 5000, duty_cycle = int(65535 * pico_led_brightness / 100))

def PinIn(id, pull):
    pin = digitalio.DigitalInOut(getattr(board, 'GP' + str(id)))
    pin.direction = digitalio.Direction.INPUT
    pin.pull = pull
    return pin
    
def PinOut(id):
    pin = digitalio.DigitalInOut(getattr(board, 'GP' + str(id)))
    pin.direction = digitalio.Direction.OUTPUT
    return pin

strobe = PinOut(4)
a0 = PinOut(16)
a1 = PinOut(17)
a2 = PinOut(19)
a3 = PinOut(20)

row_pin_numbers = [13, 14, 12, 15, 7, 18, 5, 6]
row_pins = list(map(lambda pin: PinIn(pin, digitalio.Pull.DOWN), row_pin_numbers))

# Last row is special as pin 3 is connected to ground: cols are: [21, 22, 0, 1] # Pi pin 0-> keeb pin 23, Pi pin 1 -> keeb pin 24
start_pin = PinIn(21, digitalio.Pull.UP)
select_pin = PinIn(22, digitalio.Pull.UP)
option_pin = PinIn(0, digitalio.Pull.UP)
reset_pin = PinIn(1, digitalio.Pull.UP)

def probe_col(col):
    global row_pins
    results = []
    strobe.value = False
    col += 1
    a0.value = col & 0x01
    a1.value = col & 0x02
    a2.value = col & 0x04
    a3.value = col & 0x08
    strobe.value = True
    time.sleep(0.000001)
    strobe.value = False
    for row_index, row_pin in enumerate(row_pins):
        if row_pin.value:
            results.append(row_index)
    return results

def probe_joystick(col):
    global row_pins
    results = []
    strobe.value = False
    col += 1
    a0.value = col & 0x01
    a1.value = col & 0x02
    a2.value = col & 0x04
    a3.value = col & 0x08
    strobe.value = True
    time.sleep(0.000001)
    strobe.value = False
    for row_index, row_pin in enumerate(row_pins):
        if row_pin.value:
            results.append(row_index)
    return results

keys_pressed = set()

def scan_keeb():
    currently_pressed = set()
    shift_pressed = False
    control_pressed = False
    global keys_pressed
    # Light up one column at a time
    for col_idx in range(9):
        rows = probe_col(col_idx)
        if len(rows) != 0:
            for row_idx in rows:
                print(row_idx)
                key = key_matrix[row_idx][col_idx]
                if key == Keycode.SHIFT:
                    shift_pressed = True
                if key == Keycode.CONTROL:
                    control_pressed = True
                if not key is None:
                    currently_pressed.add(key)
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
    
    # Press keys not pressed before
    keeb.press(*(currently_pressed - keys_pressed))
    # Release keys no lonnger pressed
    keeb.release(*(keys_pressed - currently_pressed))
    # Update the old set of keys pressed with the current one for the next scan
    keys_pressed = currently_pressed

while True:
    scan_keeb()