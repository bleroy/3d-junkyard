import digitalio
import board
import neopixel
import math
import adafruit_ssd1306
import busio as io
from rainbowio import colorwheel

# Layout description:
# Lines are arrays containing key descriptions.
# Key descriptions can be a simple string if there's a normal offset of 1U from the
# previous key and if the width of the key is 1U.
# If a key has an offset, is wider or taller, define the key as a tuple with the'
# string description as the first element, the offset as the second, the width in
# keyboard units as the third and the height as the fourth.
keys = [
    ['Esc', ('F1', 1), 'F2', 'F3', 'F4', ('F5', 0.5), 'F6', 'F7', 'F8', ('F9', 0.5), 'F10', 'F11', 'F12', ('PrtSc', 0.5), 'ScrLck', 'Pause', ('Break', 0.5), 'Inverse', ('Power', 1)],
    ['`', '1!', '2@', '3#', '4$', '5%', '6^', '7&', '8*', '9(', '0)', '-_', '=+', ('Backspace', 0, 2), ('Insert', 0.5), 'Home', 'PgUp', ('NumLck', 0.5), '/', '*', '-', ('Reset', 0.5)],
    [('Tab', 0, 1.5), 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[{', ']}', ('\|', 0, 1.5), ('Del', 0.5), 'End', 'PgDn', ('7', 0.5), '8', '9', ('+', 0, 1, 2), ('Option', 0.5)],
    [('CapsLck', 0, 1.75), 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';:', '\'\"', ('Return', 0, 2.25), ('4', 4), '5', '6', ('Select', 1.5)],
    [('LeftShift', 0, 2.25), 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',<', '.>', '/?', ('RightShift', 0, 2.75), ('Up', 1.5), ('1', 1.5), '2', '3', ('Enter', 0, 1, 2), ('Start', 0.5)],
    [('LeftControl', 0, 1.25), ('LeftWin', 0, 1.25), ('LeftAlt', 0, 1.25), ('Space', 0, 6.25), ('RightAlt', 0, 1.25), ('Fn', 0, 1.25), ('Menu', 0, 1.25), ('RightControl', 0, 1.25), ('Left', 0.5), 'Down', 'Right', ('0', 0.5, 2), '.', ('Help', 1.5)]
]
PIXEL_COUNT = 112
print(dir(board))
# Setup the display
# VCC is just GPIO16 set to high and GND is GPIO17 set to low.
OLED_WIDTH = 128
OLED_HEIGHT = 32
OLED_SDA = board.GP28
OLED_SCK = board.VOLTAGE_MONITOR

oledI2C = io.I2C(OLED_SCK, OLED_SDA)
oled = adafruit_ssd1306.SSD1306_I2C(OLED_WIDTH, OLED_HEIGHT, oledI2C)
oledCol = 0

def log(str):
    global oledCol
    # Echo the string on both the console and the oled screen
    print(str)
    oled.scroll(0, -8)
    oled.fill_rect(0, OLED_HEIGHT - 8, OLED_WIDTH, 8, 0)
    oled.text(str, 0, OLED_HEIGHT - 8, 1)
    oled.show()
    oledCol = OLED_WIDTH / 6

def ch(chars):
    global oledCol
    print(chars)
    if OLED:
        if oledCol + len(chars) > OLED_WIDTH / 6:
            oled.scroll(0, -8)
            oled.fill_rect(0, OLED_HEIGHT - 8, OLED_WIDTH, 8, 0)
            oledCol = 0
        oled.text(chars, oledCol * 6, OLED_HEIGHT - 8, 1)
        oled.show()
        oledCol = oledCol + len(chars)

log("Decent KB Tester")
log("Firmware 0.1")
log("(c) B. Le Roy 2025")

def modulate(color, intensity):
    red = math.ceil(((color & 0xFF0000) >> 16) * intensity)
    green = math.ceil(((color & 0xFF00) >> 8) * intensity)
    blue = math.ceil((color & 0xFF) * intensity)
    return (red << 16) | (green << 8) | blue

pixels = neopixel.NeoPixel(board.GP27, PIXEL_COUNT, auto_write = False)
frame_number = 0
while True:
    for i in range(PIXEL_COUNT):
        pixels[i] = modulate(colorwheel(i + frame_number), 0.01) 
    pixels.show()
    frame_number = frame_number + 1
pixels.fill((0, 2, 2))
