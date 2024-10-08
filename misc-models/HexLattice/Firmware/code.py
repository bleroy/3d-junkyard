import neopixel
from rainbowio import colorwheel
from board import *
import keypad
import math
import random

# Some basic colors
BLACK = 0x000000
WHITE = 0xFFFFFF
PURPLE = 0x9400D3
BLUE = 0x0000FF
GREEN = 0x00FF00
YELLOW = 0xFFFF00
ORANGE = 0xFF8000
RED = 0xFF0000

RAINBOW = [PURPLE, BLUE, GREEN, YELLOW, ORANGE, RED]

# Setup the LED strip
num_pixels = 61

pixels = neopixel.NeoPixel(GP0, num_pixels, auto_write=False)
pixels.brightness = 0.1

# Setup the buttons
BTN_SELECT = GP1
BTN_NEXT = GP2
BTN_PREVIOUS = GP3

buttons = keypad.Keys((BTN_SELECT, BTN_NEXT, BTN_PREVIOUS), value_when_pressed=False, pull=True)
SELECT = keypad.Event(0, True)
NEXT = keypad.Event(1, True)
PREVIOUS = keypad.Event(2, True)

# Lists of pixels by ring index to the center.
# Each pixel has an index on the strip and an angle
R0 = [(30, 0)]
R1 = [(31, 0), (38, 60), (39, 120), (29, 180), (22, 240), (21, 300)]
R2 = [(32, 0), (37, 30), (47, 60), (46, 90), (45, 120), (40, 150), (28, 180), (23, 210), (13, 240), (14, 270), (15, 300), (20, 330)]
R3 = [(33, 0), (36, 20), (48, 40), (51, 60), (52, 80), (53, 100), (54, 120), (44, 140), (41, 160), (27, 180), (24, 200), (12, 220), (9, 240), (8, 260), (7, 280), (6, 300), (16, 320), (19, 340)]
R4 = [(34, 0), (35, 15), (49, 30), (50, 45), (60, 60), (59, 75), (58, 90), (57, 105), (56, 120), (55, 135), (43, 150), (42, 165), (26, 180), (25, 195), (11, 210), (10, 225), (0, 240), (1, 255), (2, 270), (3, 285), (4, 300), (5, 315), (17, 330), (18, 345)]
rings = [R0, R1, R2, R3, R4] 

# Compute the (r, angle) for each pixel index from the above
pixel_r_angle = [(0, 0) for i in range(num_pixels)]
for r in range(len(rings)):
    ring = rings[r]
    for pixel_index, angle in ring:
        pixel_r_angle[pixel_index] = (r, angle)

line_intervals = [
    (0, 4),
    (5, 10),
    (11, 17),
    (18, 25),
    (26, 34),
    (35, 42),
    (43, 49),
    (50, 55),
    (56, 60)
]

def translate_horizontally(pixel_index, offset):
    for i in range(len(line_intervals)):
        start, end = line_intervals[i]
        if pixel_index >= start and pixel_index <= end:
            translated = pixel_index + offset * (1 if i % 2 == 0 else -1)
            return -1 if translated > end or translated < start else translated
    return -1

def modulate(color, intensity):
    red = math.ceil(((color & 0xFF0000) >> 16) * intensity)
    green = math.ceil(((color & 0xFF00) >> 8) * intensity)
    blue = math.ceil((color & 0xFF) * intensity)
    return (red << 16) | (green << 8) | blue

class Frame:
    def __init__(self, pixels, num_pixels):
        self.pixels = pixels
        self.num_pixels = num_pixels
        self.data = [0x000000 for i in range(self.num_pixels)]
    def set_pixel(self, index, color):
        self.data[index] = color
    def show(self):
        for i in range(self.num_pixels):
            self.pixels[i] = self.data[i]
        pixels.show()

class Animation:
    def __init__(self, pixels = pixels, num_pixels = num_pixels, setting_count = 1):
        self.pixels = pixels
        self.num_pixels = num_pixels
        self.frame_number = 0
        self.frame = Frame(pixels, num_pixels)
        self.setting_count = setting_count
        self.setting = 0
        self.direction = 1
    def prepare_frame(self):
        for i in range(self.num_pixels):
            r, angle = pixel_r_angle[i]
            self.frame.set_pixel(i, self.pixel_color(i, r, angle))
    def pixel_color(self, index, r, angle):
        return BLACK
    def next_frame(self):
        self.prepare_frame()
        self.frame.show()
        self.frame_number += self.direction
    def next(self):
        self.setting = (self.setting + 1) % self.setting_count
    def previous(self):
        self.setting = (self.setting +  self.setting_count - 1) % self.setting_count

class Off(Animation):
    def prepare_frame(self):
        self.pixels.fill(BLACK)

class Rainbow(Animation):
    def __init__(self, pixels=pixels, num_pixels=num_pixels):
        super().__init__(pixels, num_pixels, setting_count = 4)
    def next(self):
        super().next()
        self.direction = 1 if self.setting % 2 == 0 else -1
    def previous(self):
        super().previous()
        self.direction = 1 if self.setting % 2 == 0 else -1
    def pixel_color(self, index, r, angle):
        max_frame = 255 if self.setting > 1 else 360
        frame_number = self.frame_number % max_frame
        return colorwheel(((angle + frame_number) * 255 // 360) if self.setting < 2 else (index + frame_number))

class Radiate(Animation):
    def __init__(self, pixels=pixels, num_pixels=num_pixels):
        super().__init__(pixels, num_pixels, setting_count = len(RAINBOW) + 1)
    def pixel_color(self, index, r, angle):
        intensity = math.cos((r - self.frame_number / 5) * math.pi // 5)
        color = RAINBOW[self.setting - 1] if self.setting > 0 else colorwheel(self.frame_number)
        return modulate(color, intensity)

class Pulsate(Animation):
    def __init__(self, pixels=pixels, num_pixels=num_pixels, setting_count=1):
        super().__init__(pixels, num_pixels, 2)
        self.radius = 0
        self.rounded_radius = 0
        self.speed = 1
    def next_frame(self):
        super().next_frame()
        self.speed = self.speed + (random.random() - 0.5) * 0.1
        if self.speed > 0.5:
            self.speed = 0.5
        if self.speed < -0.5:
            self.speed = -0.5
        self.radius = self.radius + self.speed
        if self.radius < 0:
            self.radius = 0
            self.speed = -self.speed
        if self.radius > 4:
            self.radius = 4
            self.speed = -self.speed
        self.rounded_radius = math.ceil(self.radius)
    def pixel_color(self, index, r, angle):
        color = colorwheel(((r * 255 // 5) + self.frame_number) % 255)
        if self.setting == 0:
            return color if r < self.rounded_radius else modulate(color, self.radius - self.rounded_radius) if r == self.rounded_radius else BLACK
        if self.setting == 1:
            return color if r == self.rounded_radius else BLACK

class WakaWaka(Animation):
    def __init__(self, pixels=pixels, num_pixels=num_pixels, setting_count=1):
        super().__init__(pixels, num_pixels, setting_count)
        self.angle = 60
    def next_frame(self):
        super().next_frame()
        self.angle = math.cos(self.frame_number * 0.1) * 40
    def pixel_color(self, index, r, angle):
        if index == 47:
            return BLACK
        if r > 0 and (angle >= 360 - self.angle or angle <= self.angle):
            if angle == 0 and r - 1 == (-self.frame_number // 70) % 4:
                return WHITE
            else:
                return BLACK
        else:
            return YELLOW

class BeatingHeart(Animation):
    def pixel_color(self, index, r, angle):
        frame = [0, 0, 0, 1, 2, 1, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0][(self.frame_number // 3) % 16]
        if index in {7, 14, 15, 22, 21, 20, 29, 30, 31, 32, 39, 37}:
            return RED
        if frame > 0:
            if index in {2, 9, 8, 6, 12, 13, 16, 23, 24, 19, 27, 28, 33, 38, 40, 36, 41, 44, 45, 47, 48}:
                return RED
            if frame == 2:
                if index in {1, 3, 6, 16, 19, 33, 35, 43, 46, 49, 55, 54, 53, 51, 50}:
                    return RED
        return BLACK

class FlashingMessage(Animation):
    def __init__(self, pixels=pixels, num_pixels=num_pixels, setting_count=1):
        super().__init__(pixels, num_pixels, setting_count)
        self.messages = [
            "Accent Everything"
        ]
        self.message = (self.messages[0] + "   ").upper()
        self.setting_count = len(self.messages)
    def next(self):
        super().next()
        self.message = (self.messages[self.setting] + "   ").upper()
    def previous(self):
        super().previous()
        self.message = (self.messages[self.setting] + "   ").upper()
    def pixel_color(self, index, r, angle):
        c = self.message[(self.frame_number // 2) % len(self.message)] if self.frame_number % 2 == 0 else " "
        return self.pixel_for_char(index, c)
    def pixel_for_char(self, index, c):
        return WHITE if index in {
            " ": {},
            "A": {58, 52, 53, 45, 47, 40, 37, 28, 29, 30, 31, 32, 12, 16, 0, 4},
            "B": {56, 57, 58, 59, 51, 48, 44, 37, 28, 29, 30, 31, 20, 12, 16, 6, 0, 1, 2, 3},
            "C": {57, 58, 59, 54, 51, 44, 28, 12, 9, 6, 1, 2, 3},
            "D": {56, 57, 58, 59, 51, 48, 44, 32, 28, 12, 16, 6, 0, 1, 2, 3},
            "E": {56, 57, 58, 59, 44, 28, 29, 30, 12, 0, 1, 2, 3},
            "F": {56, 57, 58, 59, 44, 28, 29, 30, 12, 0},
            "G": {57, 58, 59, 54, 51, 44, 28, 12, 6, 1, 2, 3, 20, 21, 16},
            "H": {56, 60, 44, 48, 28, 29, 30, 31, 32, 12, 16, 0, 4},
            "I": {57, 58, 59, 46, 30, 14, 1, 2, 3},
            "J": {57, 58, 59, 46, 30, 14, 8, 0, 1, 10},
            "K": {56, 60, 51, 44, 47, 38, 28, 29, 30, 21, 12, 15, 6, 0, 4},
            "L": {56, 44, 28, 12, 0, 1, 2, 3, 4},
            "M": {56, 60, 44, 48, 28, 54, 51, 45, 47, 39, 38, 30, 32, 12, 16, 0, 4},
            "N": {56, 60, 44, 48, 28, 54, 21, 45, 30, 39, 32, 12, 15, 16, 0, 6, 4},
            "O": {56, 57, 58, 59, 60, 55, 50, 41, 24, 10, 0, 1, 2, 3, 4, 5, 19, 36},
            "P": {56, 57, 58, 59, 51, 48, 37, 44, 28, 29, 30, 31, 12, 0},
            "Q": {57, 58, 59, 54, 51, 44, 28, 12, 6, 1, 2, 3, 48, 32, 16, 9, 4, 15, 21},
            "R": {56, 57, 58, 59, 51, 48, 37, 44, 28, 29, 30, 31, 12, 0, 4, 6, 15, 21},
            "S": {57, 58, 59, 54, 51, 44, 40, 29, 30, 31, 20, 16, 12, 9, 6, 1, 2, 3},
            "T": {56, 57, 58, 59, 60, 46, 30, 14, 2},
            "U": {56, 60, 44, 28, 12, 6, 1, 2, 3, 48, 32, 16, 9},
            "V": {56, 60, 44, 48, 28, 32, 23, 20, 13, 15, 8, 7, 2},
            "W": {56, 60, 44, 48, 28, 32, 12, 16, 0, 4, 30, 22, 21, 13, 15, 9, 6},
            "X": {56, 60, 54, 51, 45, 47, 39, 38, 0, 4, 30, 22, 21, 13, 15, 9, 6},
            "Y": {56, 60, 54, 51, 45, 47, 39, 38, 30, 14, 2},
            "Z": {56, 57, 58, 59, 60, 51, 47, 38, 30, 22, 13, 9, 0, 1, 2, 3, 4},
            "0": {57, 58, 59, 54, 51, 44, 28, 12, 6, 1, 2, 3, 48, 32, 16, 9},
            "1": {58, 53, 45, 46, 40, 30, 14, 2},
            "2": {54, 57, 58, 59, 51, 47, 38, 30, 22, 13, 9, 0, 1, 2, 3},
            "3": {54, 57, 58, 59, 51, 48, 37, 31, 30, 20, 16, 6, 1, 2, 3},
            "4": {58, 53, 45, 40, 28, 24, 23, 22, 21, 20, 46, 30, 14, 2},
            "5": {57, 58, 59, 56, 60, 44, 28, 29, 30, 31, 20, 16, 10, 6, 0, 1, 2, 3},
            "6": {57, 58, 59, 54, 44, 28, 29, 30, 31, 12, 20, 9, 16, 6, 1, 2, 3},
            "7": {56, 57, 58, 59, 60, 51, 47, 38, 30, 22, 13, 9, 0},
            "8": {57, 58, 59, 54, 51, 44, 40, 29, 30, 31, 20, 16, 12, 9, 6, 1, 2, 3, 23, 48, 37},
            "9": {57, 58, 59, 54, 44, 40, 29, 30, 31, 48, 32, 51, 16, 6, 1, 2, 3},
            ".": {2},
            ",": {2, 7},
            "'": {58, 53},
            "@": {39, 38, 29, 31, 22, 21, 15, 16, 19, 33, 36, 48, 51, 52, 53, 54, 44, 41, 27, 24, 12, 9, 1, 2, 3}
        }[c] else BLACK

class ScrollingMessage(FlashingMessage):
    def __init__(self, pixels=pixels, num_pixels=num_pixels, setting_count=1):
        super().__init__(pixels, num_pixels, setting_count)
        self.new_frame = True
        self.current_index = 0
        self.current_offset = -6
        self.count = 0;
    def prepare_frame(self):
        current_c = self.message[self.current_index]
        next_c = self.message[self.current_index + 1] if self.current_index + 1 < len(self.message) else " "
        next_offset = self.current_offset - 6
        color = colorwheel(self.count * 7 % 255)
        self.count = self.count + 1
        
        for i in range(self.num_pixels):
            current_translated_index = translate_horizontally(i, self.current_offset)
            self.frame.set_pixel(i, BLACK)
            if current_translated_index != -1:
                pixel = super().pixel_for_char(current_translated_index, current_c)
                if pixel != BLACK:
                    self.frame.set_pixel(i, color)
            next_translated_index = translate_horizontally(i, next_offset)
            if next_translated_index != -1:
                pixel = super().pixel_for_char(next_translated_index, next_c)
                if pixel != BLACK:
                    self.frame.set_pixel(i, color)
        # On step 12, there are temporarily 3 active characters on the display
        # The 3rd char can have only one pixel in screen, pixel 28
        if self.frame_number == 12 and self.current_index + 2 < len(self.message):
            third_char = self.message[self.current_index + 2]
            pixel = super().pixel_for_char(28, third_char)
            if pixel != BLACK:
                self.frame.set_pixel(34, color)
        self.new_frame = False
    def next_frame(self):
        super().next_frame()
        if (self.frame_number == 13):
            self.frame_number = 7
            self.current_index += 1
            if self.current_index >= len(self.message):
                self.current_index = 0
                self.current_offset = -6
                self.frame_number = 0
            else:
                self.current_offset = self.current_offset - 5
        else:
            self.current_offset += 1
        self.new_frame = True

class White(Animation):
    def pixel_color(self, index, r, angle):
        return WHITE

animations = [ScrollingMessage(), Rainbow(), Radiate(), Pulsate(), WakaWaka(), BeatingHeart(), White(), Off()]
animation = animations[0]
animation_index = 0

SELECT_ANIMATION = 0
SELECT_SETTING = 1
select_mode = SELECT_ANIMATION

while(True):
    animation.next_frame()
    event = buttons.events.get()
    if event and event.pressed:
        if event == NEXT:
            if select_mode == SELECT_ANIMATION:
                animation_index = (animation_index + 1) % len(animations)
                animation = animations[animation_index]
            else:
                animation.next()
        if event == PREVIOUS:
            if select_mode == SELECT_ANIMATION:
                animation_index = (animation_index + len(animations) - 1) % len(animations)
                animation = animations[animation_index]
            else:
                animation.previous()
        if event == SELECT:
            select_mode = SELECT_SETTING if select_mode == SELECT_ANIMATION else SELECT_ANIMATION
