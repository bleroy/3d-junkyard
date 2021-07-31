from machine import Pin, Timer, mem32
import rp2
import utime
from keycode import Keycode

GPIO_BASE = 0xd0000004

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

shifted_overrides = [
    [Keycode.QUOTE,           None,          SHIFTED | Keycode.TWO, None,                  None,                    Keycode.HOME,                SHIFTED | Keycode.INSERT, SHIFTED | Keycode.DELETE,       None],
    [SHIFTED | Keycode.SEVEN, None,          None,                  None,                  SHIFTED | Keycode.QUOTE, None,                        None,                     None,                           None],
    [None,                    None,          None,                  None,                  None,                    SHIFTED | Keycode.BACKSLASH, None,                     None,                           None],
    [None,                    None,          None,                  None,                  None,                    None,                        None,                     None,                           None],
    [None,                    None,          None,                  None,                  Keycode.BACKSLASH,       SHIFTED | Keycode.SIX,       None,                     None,                           None],
    [None,                    None,          None,                  None,                  None,                    None,                        None,                     None,                           None],
    [None,                    None,          Keycode.LEFT_BRACKET,  Keycode.RIGHT_BRACKET, None,                    None,                        None,                     None,                           None],
    [None,                    None,          None,                  None,                  None,                    None,                        None,                     None,                           None]]

controlled_overrides = [
    [None,                    None,          None,                  None,                  None,                    None,                        Keycode.INSERT,           Keycode.DELETE,                 None],
    [None,                    None,          None,                  None,                  None,                    None,                        None,                     CONTROLLED | Keycode.BACKSLASH, None],
    [None,                    None,          None,                  None,                  None,                    Keycode.UP_ARROW,            Keycode.DOWN_ARROW,       None,                           None],
    [None,                    None,          None,                  None,                  None,                    None,                        None,                     None,                           None],
    [None,                    None,          None,                  None,                  None,                    Keycode.LEFT_ARROW,          Keycode.RIGHT_ARROW,      None,                           None],
    [None,                    None,          None,                  None,                  None,                    None,                        None,                     None,                           None],
    [None,                    None,          None,                  None,                  None,                    None,                        None,                     None,                           None],
    [None,                    None,          None,                  None,                  None,                    None,                        None,                     None,                           None]]

row_pins = []
col_pins = []
col_pin_mask = 0

for row_pin_number in row_pin_numbers:
    row_pins.append(Pin(row_pin_number, Pin.OUT))

for col_pin_number in col_pin_numbers:
    col_pins.append(Pin(col_pin_number, Pin.IN, Pin.PULL_DOWN))
    col_pin_mask = col_pin_mask | 1 << col_pin_number

#print("{0:b}".format(col_pin_mask))
PC_key = None
def scan_keeb():
    matrix = []
    global PC_key
    for row_idx, row_pin in enumerate(row_pins):
        row_pin.value(1)
        set_pins = mem32[GPIO_BASE] & col_pin_mask
        if set_pins != 0:
            any_key = True
            matrix.append(set_pins)
            for col_idx, col_pin_number in enumerate(col_pin_numbers):
                if set_pins & 1 << col_pin_number != 0:
                    #print("Row {0} (pin {1}), Col {2} (pin {3})".format(row_idx, row_pin_numbers[row_idx], col_idx, col_pin_number))
                    key = key_matrix[row_idx][col_idx]
                    if not key is None:
#            print("Row {0} (pin {2}): {1:b}".format(row_idx, set_pins, row_pin_numbers[row_idx]))
        else:
            matrix.append(0)
        row_pin.value(0)
        
    return matrix if any_key else None
    
def tick(timer):
    global led
    led.toggle()

timer.init(freq=2.5, mode=Timer.PERIODIC, callback=tick)

while True:
    matrix = scan_keeb()
#     if not matrix is None:
#         print(matrix)
    utime.sleep(0.001)

print('Ready')

