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
map_jostick_to_dpad = False # If false, joystick directions are mapped to analog joystick, otherwise to D-pad.
paddle_a_min = 34000 # The minimum value from paddle A, that will map to -127 as an analog HID value
paddle_a_max = 65000 # The maximum value from paddle A, that will map to 127 as an analog HID value
paddle_b_min = 34000 # The minimum value from paddle B, that will map to -127 as an analog HID value
paddle_b_max = 65000 # The maximum value from paddle B, that will map to 127 as an analog HID value

# Requirements: copy Adafruit's HID library into the lib folder on the Pi Pico, as well as hid_gamepad.py into the lib/adafruit_hid.
# Adafruit HID: https://github.com/adafruit/Adafruit_CircuitPython_HID
# Gamepad HID:  https://github.com/adafruit/Adafruit_CircuitPython_HID/blob/main/examples/hid_gamepad.py

import board
import digitalio
import analogio
import pwmio
import time
import usb_hid
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keycode import Keycode
from adafruit_hid.hid_gamepad import Gamepad

SHIFTED = 0x100
CONTROLLED = 0x200

# Map of the Atari XE keyboard matrix to key codes
key_matrix = [
    [Keycode.SEVEN,           None,          Keycode.EIGHT,         Keycode.NINE,          Keycode.ZERO,            SHIFTED | Keycode.COMMA,     SHIFTED | Keycode.PERIOD, Keycode.BACKSPACE,              Keycode.PAUSE],
    [Keycode.SIX,             None,          Keycode.FIVE,          Keycode.FOUR,          Keycode.THREE,           Keycode.TWO,                 Keycode.ONE,              Keycode.ESCAPE,                 None],
    [Keycode.U,               None,          Keycode.I,             Keycode.O,             Keycode.P,               Keycode.MINUS,               Keycode.EQUALS,           Keycode.RETURN,                 None],
    [Keycode.Y,               None,          Keycode.T,             Keycode.R,             Keycode.E,               Keycode.W,                   Keycode.Q,                Keycode.TAB,                    None],
    [Keycode.F1,              Keycode.J,     Keycode.K,             Keycode.L,             Keycode.SEMICOLON,       SHIFTED | Keycode.EQUALS,    SHIFTED | Keycode.EIGHT,  Keycode.F2,                    Keycode.CONTROL],
    [None,                    Keycode.H,     Keycode.G,             Keycode.F,             Keycode.D,               Keycode.S,                   Keycode.A,                Keycode.CAPS_LOCK,              None],
    [Keycode.N,               Keycode.SPACE, Keycode.M,             Keycode.COMMA,         Keycode.PERIOD,          Keycode.FORWARD_SLASH,       Keycode.GRAVE_ACCENT,     None,                           None],
    [Keycode.F3,              Keycode.F10,   Keycode.B,             Keycode.V,             Keycode.C,               Keycode.X,                   Keycode.Z,                Keycode.F4,                    Keycode.SHIFT]]

# Shifted Atari keys have a different layout than PC shifted keys; this maps between the two so the character typed on the Atari keyboard results in the right character on the PC
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

# Atari control key to PC key
controlled_overrides = dict([
    (SHIFTED | Keycode.PERIOD, Keycode.INSERT),
    (Keycode.BACKSPACE, Keycode.DELETE),
    (Keycode.ESCAPE, CONTROLLED | Keycode.BACKSLASH),
    (Keycode.MINUS, Keycode.UP_ARROW),
    (Keycode.EQUALS, Keycode.DOWN_ARROW),
    (SHIFTED | Keycode.EQUALS, Keycode.LEFT_ARROW),
    (SHIFTED | Keycode.EIGHT, Keycode.RIGHT_ARROW)])

# Joystick button enum
class JoystickButton:
    FIRE = 1
    UP = 2
    DOWN = 3
    LEFT = 4
    RIGHT = 5

GPIO_BASE = 0xd0000004

keeb = Keyboard(usb_hid.devices)
joystick = Gamepad(usb_hid.devices)

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

def reset_joy_mode():
    """Resets the joystick ports"""
    global joy_gnd, joy_vcc, paddle_a, paddle_b
    if "joy_gnd" in globals():
        joy_gnd.deinit()
    joy_gnd = pin_in(26, digitalio.Pull.DOWN)
    if "joy_vcc" in globals():
        joy_vcc.deinit()
    joy_vcc = set_brightness(board.GP8, joystick_brightness)

# Setup LED brightness through PWM and pull ground pins down
power_led = set_brightness(board.GP2, power_led_brightness)
backlight_gnd = set_brightness(board.GP3, 100 - backlight_brightness)
backlight = pin_out(9)
backlight.value = True
pico_led = set_brightness(board.LED, pico_led_brightness)
reset_joy_mode()

# Paddles
paddle_a = analogio.AnalogIn(board.A1)
paddle_b = analogio.AnalogIn(board.A2)

# Setup decoder pins
strobe = pin_out(4)
a0 = pin_out(16)
a1 = pin_out(17)
a2 = pin_out(19)
a3 = pin_out(20)

# pin numbers for keyboard rows in order
row_pin_numbers = [13, 14, 12, 15, 7, 18, 5, 6]
row_pins = list(map(lambda pin: pin_in(pin, digitalio.Pull.DOWN), row_pin_numbers))

# Last row is special as pin 3 is connected to ground: cols are: [21, 22, 0, 1] # Pi pin 0-> keeb pin 23, Pi pin 1 -> keeb pin 24
start_pin = pin_in(21, digitalio.Pull.UP)
select_pin = pin_in(22, digitalio.Pull.UP)
option_pin = pin_in(0, digitalio.Pull.UP)
reset_pin = pin_in(1, digitalio.Pull.UP)

# Decoder helpers
def lightup(index):
    """Lights up the line at the specified number"""
    # Set the strobe to low while we prepare the input
    strobe.value = False
    # Encode the column number as binary
    a0.value = index & 0x01
    a1.value = index & 0x02
    a2.value = index & 0x04
    a3.value = index & 0x08
    # Strobe to acknowledge the column code
    strobe.value = True
    time.sleep(0.000001)
    strobe.value = False

def probe_col(col):
    """
    Lights up a specific column on the keyboard matrix by passing its encoded row number to the decoder.

    Result is a list or rows for key presses on the specified column.
    """
    global row_pins
    results = []
    lightup(col + 1)
    # Read the row pins to detect key presses
    for row_index, row_pin in enumerate(row_pins):
        if row_pin.value:
            results.append(row_index)
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
        currently_pressed.add(Keycode.F5)
    if not select_pin.value:
        currently_pressed.add(Keycode.F6)
    if not option_pin.value:
        currently_pressed.add(Keycode.F7)
    if not reset_pin.value:
        currently_pressed.add(Keycode.F8)
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

def probe_joystick():
    """
    Sets the five probing signals for the joystick directions and fire then read the corresponding signal on joystick ground.

    Returns the list of pressed buttons.
    """
    results = []
    # Temporarily reassign joystick ground to read values
    global joy_gnd, joy_vcc
    if "joy_gnd" in globals():
        joy_gnd.deinit()
    joy_gnd = analogio.AnalogIn(board.A0)
    if "joy_vcc" in globals():
        joy_vcc.deinit()
    joy_vcc = pin_in(8, digitalio.Pull.DOWN)
    # Strobe down and setup button
    values = []
    for btn in range(0x0A, 0x0F):
        lightup(btn)
        values.append(int(joy_gnd.value / 2048))
    if any(v == 0 for v in values):
        for i, v in enumerate(values):
            if v != 0:
                results.append(i + 1)

    # Reassign joystick ground to light up the backlight
    reset_joy_mode()
    return results

buttons_pressed = set()

def fitting(x, min_value, max_value): # This can be modified to map pot readings to HID analog values in a non-linear way
    return int((max([min([x, max_value]), min_value]) - min_value) * 254 / (max_value - min_value) - 127)

hid_buttons = [1, 12, 13, 14, 15]
def map_joystick_to_HID(buttons):
    return [hid_buttons[btn - JoystickButton.FIRE] for btn in buttons]

def scan_joystick():
    """Scans the joystick buttons and reports as gamepad HID events"""
    global buttons_pressed, joy_vcc, paddle_a, paddle_b, paddle_a_min, paddle_a_max, paddle_b_min, paddle_b_max
    currently_pressed = set(probe_joystick())
    x = 0
    y = 0
    # Press buttons not pressed before
    new_buttons = currently_pressed - buttons_pressed
    if map_jostick_to_dpad:
        if len(new_buttons) > 0:
            joystick.press_buttons(*map_joystick_to_HID(new_buttons))
    else:
        x = -127 if JoystickButton.LEFT in currently_pressed else 127 if JoystickButton.RIGHT in buttons_pressed else 0
        y = -127 if JoystickButton.UP in currently_pressed else 127 if JoystickButton.DOWN in buttons_pressed else 0
        if JoystickButton.FIRE in currently_pressed:
            joystick.press_buttons(*[1])
    # Release keys no longer pressed
    gone_buttons = buttons_pressed - currently_pressed
    if map_jostick_to_dpad:
        if len(gone_buttons) > 0:
            joystick.release_buttons(*map_joystick_to_HID(gone_buttons))
    elif JoystickButton.FIRE in gone_buttons:
        joystick.release_buttons(*[1])
    # Update the old set of keys pressed with the current one for the next scan
    buttons_pressed = currently_pressed
    # Check paddles
    if "joy_vcc" in globals():
        joy_vcc.deinit()
    joy_vcc = pin_out(8)
    joy_vcc.value = True
    a_val = paddle_a.value
    b_val = paddle_b.value
    a = fitting(a_val, paddle_a_min, paddle_a_max)
    b = fitting(b_val, paddle_b_min, paddle_b_max)
    #print((a_val, b_val, paddle_a_min, paddle_a_max, paddle_b_min, paddle_b_max, a, b))
    joystick.move_joysticks(x, y, a, b)
    # Reassign joystick ground to light up the backlight
    reset_joy_mode()

while True:
    scan_keeb()
    scan_joystick()

