import os
import math
import random
import time
import board
import digitalio
import neopixel
import usb_hid
import adafruit_logging
from adafruit_debouncer import Debouncer
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keyboard_layout_us import KeyboardLayoutUS as KeyboardLayout
from rainbowio import colorwheel

logger = adafruit_logging.getLogger("log")
logger.setLevel(adafruit_logging.ERROR)
logger.info("Starting up")

class Mode():
    SIMON = 0
    MACROPAD = 1

mode = Mode.SIMON

class Color():
    RED = 0xFF0000
    GREEN = 0x00FF00
    BLUE = 0x0000FF
    YELLOW = 0xFFFF00
    ORANGE = 0xFF8000
    WHITE = 0xFFFFFF
    BLACK = 0x000000

led_intensity = float(os.getenv("INTENSITY"))

pixels = neopixel.NeoPixel(board.GP4, 4)
coordinates = [[-1, -1], [-1, 1], [1, -1], [1, 1]]

def modulate(color, intensity):
    intensity = max(0, min(1, intensity))
    red = math.ceil(((color & 0xFF0000) >> 16) * intensity)
    green = math.ceil(((color & 0xFF00) >> 8) * intensity)
    blue = math.ceil((color & 0xFF) * intensity)
    return (red << 16) | (green << 8) | blue

def addWithinRange(initialValue, addedValue, lowerBound, upperBound):
    return max(lowerBound, min(upperBound , initialValue + addedValue))

def combine_colors(color1, color2):
    return color1 if color2 == 0 else color2 if color1 == 0 else \
        addWithinRange(color1 & 0xFF, color2 & 0xFF, 0, 0xFF) + \
        (addWithinRange((color1 & 0xFF00) >> 8, (color2 & 0xFF00) >> 8, 0, 0xFF) << 8) + \
        (addWithinRange((color1 & 0xFF0000) >> 16, (color2 & 0xFF0000) >> 16, 0, 0xFF) << 16)

def display_solid(color):
    for i in range(4):
        pixels[i] = modulate(color, led_intensity)
    pixels.show()


class Animation():
    def __init__(self):
        self.frame_number = 0
    def define_done_callback(self, done_callback):
        self.done_callback = done_callback
    def loop(self):
        self.frame_number = self.frame_number + 1
    def display_frame(self):
        for i, [x, y] in enumerate(coordinates):
             pixels[i] = self.paint(x, y, i)
        pixels.show()
    def paint(self, x, y, i):
        return 0
    def done(self):
        if self.done_callback != None:
            self.done_callback(self)

class BeachBall(Animation):
    def paint(self, x, y, i):
        return modulate(colorwheel((math.atan2(y, x) * 128 / math.pi - self.frame_number) % 256), led_intensity)

class FlashAndFade(Animation):
    def __init__(self, led_index, color, duration):
        super().__init__()
        self.led_index = led_index
        self.color = color
        self.duration = self.count = duration
    def loop(self):
        self.count = max(0, self.count - 1)
        if (self.count == 0):
            self.done()
        super().loop()
    def paint(self, x, y, i):
        return modulate(modulate(self.color, self.count / self.duration), led_intensity) if self.led_index == i else 0

class CompositeAnimation(Animation):
    def __init__(self):
        super().__init__()
        self.animations = []
    def add(self, animation):
        self.animations.append(animation)
        def callback(anim):
            if anim in self.animations:
                self.animations.remove(anim)
        animation.define_done_callback(callback)
    def loop(self):
        for animation in self.animations:
            animation.loop()
        super().loop()
    def paint(self, x, y, i):
        color = super().paint(x, y, i)
        colors = [color]
        for animation in self.animations:
            animationColor = animation.paint(x, y, i)
            color = combine_colors(color, animationColor)
            colors.append(animationColor)
        if (len(self.animations) > 1):
            logger.info(f"Composite color {i} {colors} = {color}")
        return color

MSGS = [os.getenv("KEY" + str(i + 1)) for i in range(4)]

def setup_key(pin):
    KEY_GPIO = digitalio.DigitalInOut(pin)
    KEY_GPIO.direction = digitalio.Direction.INPUT
    KEY_GPIO.pull = digitalio.Pull.UP
    return KEY_GPIO

KEYS = [Debouncer(setup_key(getattr(board, "GP" + str(i)))) for i in range(4)]

def wait_for_no_keys():
    keys_pressed = True
    while keys_pressed:
        keys_pressed = False
        for key in KEYS:
            key.update()
            if not key.value:
                keys_pressed = True
                break

display_solid(Color.WHITE)

keyboard_found = False

for device in usb_hid.devices:
    if device.usage_page == 1 and device.usage == 6:
        keyboard_found = True
        logger.info("Keyboard found")
        pixels[0] = Color.GREEN
        pixels.show()

if (keyboard_found):
    try:
        kb = Keyboard(usb_hid.devices, 2)
        display_solid(Color.BLUE)
        layout = KeyboardLayout(kb)
        mode = Mode.MACROPAD
        display_solid(Color.GREEN)
    except ValueError:
        logger.error("Keyboard not found")
        display_solid(Color.ORANGE)
    except OSError:
        logger.error("USB not connected")
        display_solid(Color.RED)

class SimonMode():
    PROMPT = 0
    GUESS = 1
    NEW_PROMPT = 2

while True:
    if mode == Mode.SIMON:
        colors = [(0, Color.RED), (1, Color.GREEN), (2, Color.YELLOW), (3, Color.BLUE)]
        for prompt_led, prompt_color in colors:
            pixels[prompt_led] = prompt_color
        pixels.show()

        simon_state = SimonMode.NEW_PROMPT
        simon_prompt = []
        simon_prompt_length = 3
        simon_prompt_delay_color_display = 1000 #ms
        simon_prompt_delay_between_colors = 100 #ms

        while mode == Mode.SIMON:
            if simon_state == SimonMode.NEW_PROMPT:
                logger.info("Simon new prompt mode")
                time.sleep(1)
                simon_prompt = [random.choice(colors) for i in range(simon_prompt_length)]
                simon_state = SimonMode.PROMPT
            elif simon_state == SimonMode.PROMPT:
                logger.info("Simon prompt mode")
                for prompt_led, prompt_color in simon_prompt:
                    for led, color in colors:
                        pixels[led] = prompt_color if prompt_led == led else Color.BLACK
                    pixels.show()
                    time.sleep(simon_prompt_delay_color_display / 1000)
                    display_solid(Color.BLACK)
                    time.sleep(simon_prompt_delay_between_colors / 1000)
                simon_state = SimonMode.GUESS
            elif simon_state == SimonMode.GUESS:
                logger.info("Simon guess mode")
                display_solid(Color.BLACK)
                correct = False
                for (prompted_index, prompted_color) in simon_prompt:
                    guessed = False
                    while not guessed:
                        keys_pressed = 0
                        for pressed_index, key in enumerate(KEYS):
                            # handle key presses
                            key.update()
                            if key.fell:
                                logger.info(f"Key {pressed_index} pressed")
                                for prompt_led, prompt_color in colors:
                                    pixels[prompt_led] = prompt_color if pressed_index == prompt_led else Color.BLACK
                                pixels.show()
                                guessed = True
                                correct = pressed_index == prompted_index
                            if not key.value:
                               keys_pressed = keys_pressed + 1
 
                        if keys_pressed > 0: logger.info(f"{keys_pressed} pressed")
                        if keys_pressed == 4:
                            logger.info("4 keys pressed, back to macropad mode")
                            mode = Mode.MACROPAD
                            display_solid(Color.YELLOW)
                            wait_for_no_keys()
                            break
                    if not correct or mode != Mode.SIMON:
                        break
                if correct:
                    display_solid(Color.GREEN)
                    simon_prompt_length = simon_prompt_length + 1
                    simon_state = SimonMode.NEW_PROMPT
                    time.sleep(1)
                else:
                    display_solid(Color.RED)
                    simon_state = SimonMode.PROMPT
                    time.sleep(1)

    elif mode == Mode.MACROPAD:
        display_solid(Color.YELLOW)

        animation = CompositeAnimation()
        animation.add(BeachBall())

        while mode == Mode.MACROPAD:
            keys_pressed = 0
            for i, key in enumerate(KEYS):
                # handle key presses
                key.update()
                if key.fell:
                    animation.add(FlashAndFade(i, Color.WHITE, 10))
                    layout.write(MSGS[i], delay=0.05)
                    logger.info(f"Key {i} pressed")
                if not key.value:
                    keys_pressed = keys_pressed + 1
            if (keys_pressed > 0): logger.info(f"Number of keys pressed {keys_pressed}")
            if keys_pressed == 4:
                logger.info("4 keys pressed, going into Simon mode")
                mode = Mode.SIMON
                display_solid(Color.YELLOW)
                wait_for_no_keys()
            else:
                # update LEDS according to the current animation
                animation.loop()
                animation.display_frame()