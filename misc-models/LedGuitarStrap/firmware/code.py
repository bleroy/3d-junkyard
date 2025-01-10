from collections import namedtuple
import neopixel
from rainbowio import colorwheel
from board import *
import keypad
import math
import random
import time

# Scrolling messages
messages = [
    "All your base are belong to us",
    "We are fucking fucked",
    "The will of the people",
    "Fuck everyone and run!"
]

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
num_strips = 6
strip_width = 4
strip_length = 12
num_pixels = num_strips * strip_width * strip_length

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

# Font
FONT_LINES = """
 **  ***   **  ***  **** ****  **  *  * ***     * *  * *    *  * *  *  **  ***   **  ***   *** ***  *  * *  * *  * *  * *  * ****  **    *   **   **     * ****  **  ****  **   **             **   *                   * *   *            *  *    *    *  *   
*  * *  * *  * *  * *    *    *  * *  *  *      * * *  *    **** ** * *  * *  * *  * *  * *     *   *  * *  * *  * *  * *  *   *  *  *  **  *  * *  *   ** *    *       * *  * *  *           *  *  *          *    *   * *   *    *        **     *   *    *  
**** ***  *    *  * ***  ***  *    ****  *      * **   *    *  * * ** *  * ***  *  * ***   **   *   *  * *  * *  *  **   **   *   *  *   *    *    *   * * ***  ***    *   **   ***             *   *                             ***  *** ****   *    *    *  
*  * *  * *  * *  * *    *    * ** *  *  *   *  * * *  *    *  * *  * *  * *    * ** * *     *  *   *  * * *  **** *  *  *   *    *  *   *   *   *  * ****    * *  *  *   *  *    *                       *    *    *              *        **   *     *    *  
*  * ***   **  ***  **** *     *** *  * ***   **  *  * **** *  * *  *  **  *     *** *  * ***   *    **  **   *  * *  * *    ****  **    *  ****  **     * ***   **  *     **   **        *     *   *    *    *                            *  *  *      *  *   """.splitlines()
FONT_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .?!,;:"' + "'+-*/()"
EMPTY_LINE = [0, 0, 0, 0, 0]

# Build the font as a dictionary from char to array<array<bool>> describing lines of pixels
FONT = dict()
for i, c in enumerate(FONT_LETTERS):
    FONT[c] = list(map(
        lambda line: list(map(
            lambda c: 0 if c == ' ' else 1,
            line[i * 5 : i * 5 + 5])),
        FONT_LINES[1:]))

def modulate(color, intensity):
    red = math.ceil(((color & 0xFF0000) >> 16) * intensity)
    green = math.ceil(((color & 0xFF00) >> 8) * intensity)
    blue = math.ceil((color & 0xFF) * intensity)
    return (red << 16) | (green << 8) | blue

class Frame:
    def __init__(self, pixels = pixels,  width = num_strips * strip_length, height = strip_width):
        self.pixels = pixels
        self.width = width
        self.height = height
        self.num_pixels = width * height
        self.data = [0x000000 for i in range(self.num_pixels)]
    def set_pixel(self, x, y, color):
        if x < self.width and y < self.height:
            self.data[x * self.height + (y if x % 2 == 0 else 3 - y)] = color
    def show(self):
        for i in range(self.num_pixels):
            self.pixels[i] = self.data[i]
        pixels.show()
    def clear(self):
        for i in range(self.num_pixels):
            self.data[i] = BLACK
    def draw_sprite(self, coord, frames, frame_number, color):
        frame = frames[(frame_number) % len(frames)]
        for x in range(4):
            for y in range(len(frame[0])):
                if frame[3 - x][len(frame[0]) - y - 1] == 1:
                    self.set_pixel(coord + y, x, color)

class Animation:
    def __init__(self, pixels = pixels, width = num_strips * strip_length, height = strip_width, setting_count = 1):
        self.pixels = pixels
        self.width = width
        self.height = height
        self.num_pixels = width * height
        self.frame_number = 0
        self.frame = Frame(pixels, width, height)
        self.setting_count = setting_count
        self.setting = 0
        self.direction = 1
    def prepare_frame(self):
        for x in range(self.width):
            for y in range(self.height):
                self.frame.set_pixel(x, y, self.pixel_color(i, x, y))
    def pixel_color(self, index, x, y):
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
    def __init__(self, pixels=pixels, width = num_strips * strip_length, height = strip_width):
        super().__init__(pixels, width, height, setting_count = 2)
    def next(self):
        super().next()
        self.direction = 1 if self.setting % 2 == 0 else -1
    def previous(self):
        super().previous()
        self.direction = 1 if self.setting % 2 == 0 else -1
    def pixel_color(self, index, x, y):
        max_frame = self.width
        frame_number = self.frame_number % max_frame
        return modulate(colorwheel(((x + frame_number) % self.width) * 500), 100)

class WakaWaka(Animation):
    def __init__(self, pixels=pixels, width = num_strips * strip_length, height = strip_width):
        super().__init__(pixels, width, height, setting_count = 1)
        self.angle = 60
        self.pacman_frames = [
            [
                [0, 1, 1, 0],
                [1, 1, 1, 1],
                [1, 1, 1, 1],
                [0, 1, 1, 0]
            ],
            [
                [0, 1, 1, 0],
                [1, 1, 1, 1],
                [0, 0, 1, 1],
                [0, 1, 1, 0]
            ],
            [
                [0, 1, 1, 0],
                [0, 0, 1, 1],
                [0, 0, 0, 1],
                [0, 1, 1, 0]
            ],
            [
                [0, 1, 1, 0],
                [1, 1, 1, 1],
                [0, 0, 1, 1],
                [0, 1, 1, 0]
            ]
        ]
        self.ghost_frames = [
            [
                [0, 1, 1, 1, 0],
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 0],
                [0, 1, 1, 1, 1]
            ],
            [
                [0, 1, 1, 1, 1],
                [1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1],
                [0, 1, 1, 1, 0]
            ]
        ]
        self.pacman_x = -4
        self.ghost_x = self.width
        self.super_pill_x = 26
    def prepare_frame(self):
        self.frame.clear()
        # Draw the pills where the man of pac has not yet been
        for x in range(0, self.width - self.pacman_x, 5):
            self.frame.set_pixel(self.width - x, 1, WHITE)
        # Draw the super-pill
        if self.pacman_x < self.super_pill_x:
            self.frame.set_pixel(self.super_pill_x + 1, 2, WHITE)
            self.frame.set_pixel(self.super_pill_x, 2, WHITE)
            self.frame.set_pixel(self.super_pill_x, 1, WHITE)
        # Draw the protagonist
        self.frame.draw_sprite(self.pacman_x, self.pacman_frames, self.frame_number, YELLOW)
        # Draw the ghost
        self.frame.draw_sprite(
            self.ghost_x,
            self.ghost_frames,
            self.frame_number,
            RED if self.pacman_x < self.super_pill_x else BLUE)
    def next_frame(self):
        time.sleep(0.1)
        super().next_frame()
        self.pacman_x = (self.pacman_x + 1) if self.pacman_x < self.width + 4 else -4
        self.ghost_x = (self.ghost_x - 1) if self.pacman_x < self.super_pill_x else self.width if self.pacman_x >= self.width + 4 else (self.ghost_x + 1)

class ScrollingMessage(Animation):
    def __init__(self, pixels=pixels, width = num_strips * strip_length, height = strip_width):
        super().__init__(pixels, width, height, setting_count = len(messages))
        self.new_frame = True
        self.current_index = 0
        self.current_offset = -6
        self.messages = messages
        self.message = ("          " + self.messages[0]).upper()
        self.setting_count = len(self.messages)
    def next(self):
        super().next()
        self.message = ("          " + self.messages[self.setting]).upper()
    def previous(self):
        super().previous()
        self.message = ("          " + self.messages[self.setting]).upper()
    def prepare_frame(self):
        for x in range(self.width):
            ch_index = ((self.width - x + self.frame_number) // 6) % len(self.message)
            ch = self.message[ch_index]
            line = (self.width - x + self.frame_number) % 6
            font_line = EMPTY_LINE if line == 5 else FONT[ch][line]
            for y in range(self.height):
                self.frame.set_pixel(x, y, self.pixel_color(i, x, y) if font_line[y] != 0 else BLACK)
    def pixel_color(self, index, x, y):
        frame_number = self.frame_number % 500
        return modulate(colorwheel(frame_number), 100)

class Droplet:
    def __init__(self, x = 0, y = 0):
        self.x = x
        self.y = y
        
class GhostInTheShell(Animation):
    def __init__(self, pixels=pixels, width = num_strips * strip_length, height = strip_width):
        super().__init__(pixels, width, height, setting_count = 1)
        self.droplets = []
    def next_frame(self):
        super().next_frame()
        if (len(self.droplets) < 8):
            self.droplets.append(Droplet(
                x = self.width + random.random() * self.width,
                y = random.random() * 4
            ))
        for droplet in self.droplets:
            droplet.x = droplet.x - 2
            if droplet.x < -20:
                self.droplets.remove(droplet)
    def pixel_color(self, index, x, y):
        intensity = 0
        for droplet in self.droplets:
            if abs(droplet.y - y) < 0.5 and x > droplet.x:
                intensity = intensity + 10 - min(x - droplet.x, 10)
        return (int(min(5 * intensity + 10, 255)) * 255) & 0xFF00

class White(Animation):
    def pixel_color(self, index, r, angle):
        return WHITE

animations = [WakaWaka(), ScrollingMessage(), GhostInTheShell(), Rainbow()] # , Radiate(), Pulsate(), WakaWaka(), BeatingHeart(), White(), Off()]
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
