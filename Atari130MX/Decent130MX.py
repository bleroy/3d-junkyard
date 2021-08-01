from machine import Pin, Timer, mem32
import pyb
import rp2
import utime
from keycode import Keycode
from keyboard import Keyboard

GPIO_BASE = 0xd0000004

keeb = Keyboard(pyb.USB_HID.devices)

led = Pin(2, Pin.OUT)
timer = Timer()

row_pin_numbers = [13, 14, 12, 15, 7, 18, 5, 6]
col_pin_numbers = [19, 4, 8, 9, 10, 11, 17, 16, 20]
# Last row is special as pin 3 is connected to ground: cols are: [21, 22, 0, 1] # Pi pin 0-> keeb pin 23, Pi pin 1 -> keeb pin 24
start_pin = Pin(21, Pin.IN, Pin.PULL_UP)
select_pin = Pin(22, Pin.IN, Pin.PULL_UP)
option_pin = Pin(0, Pin.IN, Pin.PULL_UP)
reset_pin =Pin(1, Pin.IN, Pin.PULL_UP)

SHIFTED = 0x100
CONTROLLED = 0x200

key_matrix = [
    [Keycode.SEVEN,           None,          Keycode.EIGHT,         Keycode.NINE,          Keycode.ZERO,            SHIFTED | Keycode.COMMA,     SHIFTED | Keycode.PERIOD, Keycode.BACKSPACE,              Keycode.PAUSE],
    [Keycode.SIX,             None,          Keycode.FIVE,          Keycode.FOUR,          Keycode.THREE,           Keycode.TWO,                 Keycode.ONE,              Keycode.ESCAPE,                 None],
    [Keycode.U,               None,          Keycode.I,             Keycode.O,             Keycode.P,               Keycode.MINUS,               Keycode.EQUALS,           Keycode.RETURN,                 None],
    [Keycode.Y,               None,          Keycode.T,             Keycode.R,             Keycode.E,               Keycode.W,                   Keycode.Q,                Keycode.TAB,                    None],
    [None,                    Keycode.J,     Keycode.K,             Keycode.L,             Keycode.SEMICOLON,       SHIFTED | Keycode.EQUAL,     SHIFTED | Keycode.EIGHT,  None,                           Keycode.CONTROL],
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
    (Keycode.MINUS, SHIFTED | Keycode.BACKSLASH),
    (SHIFTED | Keycode.EQUAL, Keycode.BACKSLASH),
    (SHIFTED | KeyCode.EIGHT, SHIFTED | KeyCode.SIX),
    (Keycode.COMMA, Keycode.LEFTBRACKET),
    (Keycode.PERIOD, Keycode.RIGHTBRACKET)])

controlled_overrides = dict([
    (SHIFTED | Keycode.PERIOD, Keycode.INSERT),
    (Keycode.BACKSPACE, Keycode.DELETE),
    (Keycode.ESCAPE, CONTROLLED | Keycode.BACKSLASH),
    (Keycode.MINUS, Keycode.UP_ARROW),
    (Keycode.EQUAL, Keycode.DOWN_ARROW),
    (SHIFTED | Keycode.EQUAL, Keycode.LEFT_ARROW),
    (SHIFTED | Keycode.EIGHT, Keycode.RIGHT_ARROW)])

row_pins = []
col_pins = []
col_pin_mask = 0

for row_pin_number in row_pin_numbers:
    row_pins.append(Pin(row_pin_number, Pin.OUT))

for col_pin_number in col_pin_numbers:
    col_pins.append(Pin(col_pin_number, Pin.IN, Pin.PULL_DOWN))
    col_pin_mask = col_pin_mask | 1 << col_pin_number

#print("{0:b}".format(col_pin_mask))
keys_pressed = set()
def scan_keeb():
    currently_pressed = set()
    shift_pressed = False
    control_pressed = False
    global PC_key
    for row_idx, row_pin in enumerate(row_pins):
        # Light-up this row
        row_pin.value(1)
        # Get all column pins at once through the hardware register
        set_pins = mem32[GPIO_BASE] & col_pin_mask
        if set_pins != 0:
            for col_idx, col_pin_number in enumerate(col_pin_numbers):
                if set_pins & 1 << col_pin_number != 0:
                    #print("Row {0} (pin {1}), Col {2} (pin {3})".format(row_idx, row_pin_numbers[row_idx], col_idx, col_pin_number))
                    key = key_matrix[row_idx][col_idx]
                    if key == Keycode.SHIFT:
                        shift_pressed = True
                    if key == Keycode.CONTROL:
                        control_pressed = True
                    if not key is None:
                        currently_pressed.append(key)
                    #Row {0} (pin {2}): {1:b}".format(row_idx, set_pins, row_pin_numbers[row_idx]))
        # Turn off this row so we can scan the next one
        row_pin.value(0)
    # Post-process the keys for shifted values, overrides, etc.
    for key in currently_pressed:
        if shift_pressed and key in shifted_overrides:
            key = shifted_overrides[key]
        if control_pressed and key in controlled_overrides:
            key = controlled_overrides[key]
        shift_pressed = shift_pressed or key & SHIFTED != 0
        control_pressed = control_pressed or key & CONTROLLED != 0
        if shift_pressed:
            currently_pressed.append(Keycode.SHIFT)
        if control_pressed:
            currently_pressed.append(Keycode.CONTROL)
        key = key & 0xFF
    # Press keys not pressed before
    keeb.press(*(currently_pressed - keys_pressed))
    # Release keys no lonnger pressed
    keeb.release(*(keys_pressed - currnelty_pressed))
    # Update the old set of keys pressed with the current one for the next scan
    keys_pressed = currently_pressed
    # Turn on the led if any key was pressed
    led.value(1 if len(keys_pressed) > 0 else 0)
    
while True:
    scan_keeb()
    utime.sleep(0.001)

print('Ready')
