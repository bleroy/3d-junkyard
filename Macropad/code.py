import time
import board
import neopixel
import microcontroller
import digitalio
import analogio
import usb_hid
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keyboard_layout_us import KeyboardLayoutUS
from adafruit_hid.keycode import Keycode

a1 = digitalio.DigitalInOut(board.A0)
a2 = digitalio.DigitalInOut(board.A1)
a3 = digitalio.DigitalInOut(board.A2)
a4 = digitalio.DigitalInOut(board.A3)
a5 = digitalio.DigitalInOut(board.D24)

b1 = digitalio.DigitalInOut(board.D25)
b2 = digitalio.DigitalInOut(board.D2)
b3 = digitalio.DigitalInOut(board.D7)
b4 = digitalio.DigitalInOut(board.D9)
b5 = digitalio.DigitalInOut(board.D10)

c1 = digitalio.DigitalInOut(board.D11)
c2 = digitalio.DigitalInOut(board.D12)
c3 = digitalio.DigitalInOut(board.D13)
c4 = digitalio.DigitalInOut(board.D3)
c5 = digitalio.DigitalInOut(board.D4)

# Map key coordinates to key codes that are sent to the host
key_to_code = {
    (0,0): [Keycode.CONTROL, Keycode.ALT, Keycode.F1],
    (0,1): [Keycode.CONTROL, Keycode.ALT, Keycode.F2],
    (0,2): [Keycode.CONTROL, Keycode.ALT, Keycode.F3],
    (0,3): [Keycode.CONTROL, Keycode.ALT, Keycode.F4],
    (0,4): [Keycode.CONTROL, Keycode.ALT, Keycode.F4],
    (1,0): [Keycode.CONTROL, Keycode.ALT, Keycode.F5],
    (1,1): [Keycode.CONTROL, Keycode.ALT, Keycode.F6],
    (1,2): [Keycode.Q],
    (1,3): [Keycode.UP_ARROW],
    (1,4): [Keycode.E],
    (2,0): [Keycode.CONTROL, Keycode.ALT, Keycode.F7],
    (2,1): [Keycode.CONTROL, Keycode.ALT, Keycode.F8],
    (2,2): [Keycode.LEFT_ARROW],
    (2,3): [Keycode.DOWN_ARROW],
    (2,4): [Keycode.RIGHT_ARROW]
}

# Those keys act on key down and remain active until released
key_down_keys = [b3, b4, b5, c3, c4, c5]

row1 = [a1, a2, a3, a4, a5]
row2 = [b1, b2, b3, b4, b5]
row3 = [c1, c2, c3, c4, c5]

keeb = [row1, row2, row3]

for row in keeb:
    for key in row:
        key.pull = digitalio.Pull.UP

led = digitalio.DigitalInOut(board.TX)
led.direction = digitalio.Direction.OUTPUT

pixel = neopixel.NeoPixel(board.NEOPIXEL, 1)

keyboard = Keyboard(usb_hid.devices)
keyboard_layout = KeyboardLayoutUS(keyboard)

print("Keyboard ready")

last_key = (-1, -1)
while True:
    color = [0, 0, 0]
    for r, row in enumerate(keeb):
        intensity = 0
        for k, key in enumerate(row):
            if not key.value:
                intensity += 2**(k + 3)
                #print('Key {}{}'.format(chr(ord('A') + r), k + 1))
                if key in key_down_keys and (r, k) != last_key:
                    keyboard.press(*key_to_code[(r, k)])
                    print("down")
                last_key = (r, k)
            else:
                if (r, k) == last_key:
                    if not (key in key_down_keys):
                        keyboard.press(*key_to_code[(r, k)])
                    keyboard.release_all()
                    last_key = (-1, -1)
        color[r] = intensity
    led.value = color[0] != 0 or color[1] != 0 or color[2] != 0
    pixel.fill((color[0], color[1], color[2]))
    time.sleep(0.01)
