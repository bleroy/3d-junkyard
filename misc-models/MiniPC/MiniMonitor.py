#!/usr/bin/env python3

import os
import sys
import signal
import RPi.GPIO as GPIO

from PIL import Image
from inky.inky_uc8159 import Inky as InkyUC8159

print("""lumie.py - Slide show script for PiMoroni eInk display

The script will display the first image in ../Pictures and
wait for the user to press the A or B button.

A goes to the previous image, and B goes to the next.

Press Ctrl+C to exit!

""")

# Gpio pins for each button (from top to bottom)
BUTTONS = [5, 6, 16, 24]

# These correspond to buttons A, B, C and D respectively
LABELS = ['A', 'B', 'C', 'D']

# Set up RPi.GPIO with the "BCM" numbering scheme
GPIO.setmode(GPIO.BCM)

# Buttons connect to ground when pressed, so we should set them up
# with a "PULL UP", which weakly pulls the input signal to 3.3V.
GPIO.setup(BUTTONS, GPIO.IN, pull_up_down=GPIO.PUD_UP)


# "handle_button" will be called every time a button is pressed
# It receives one argument: the associated input pin.
def handle_button(pin):
    label = LABELS[BUTTONS.index(pin)]
    print("Button press detected on pin: {} label: {}".format(pin, label))

inky = InkyUC8159(resolution=(640, 400))

path = "../Pictures"

imgPaths = [os.path.join(path, imgFile) for imgFile in os.listdir(path)]

print(imgPaths)

currentIndex = 0

def handle_previous(pin):
    global currentIndex
    currentIndex = currentIndex - 1 if currentIndex > 0 else len(imgPaths) - 1
    display_image()

def handle_next(pin):
    global currentIndex
    currentIndex = currentIndex + 1 if currentIndex < len(imgPaths) - 1 else 0
    display_image()

def display_image():
    global imgPaths, currentIndex

    saturation = 1

    imgFile = imgPaths[currentIndex]
    image = Image.open(imgFile)

    print ("""Opening {path}""".format(path = imgFile))

    image.thumbnail(inky.resolution)

    if len(sys.argv) > 2:
        saturation = float(sys.argv[2])

    x, y = ((inky.resolution[0] - image.width)>>1, 0) if image.width < inky.resolution[0] else (0, (inky.resolution[1] - image.height)>>1)

    padded = Image.new(image.mode, inky.resolution, (255, 255, 255))
    padded.paste(image, (x, y))

    inky.set_image(padded, saturation=saturation)
    inky.show()


GPIO.add_event_detect(BUTTONS[0], GPIO.FALLING, handle_previous, bouncetime=250)
GPIO.add_event_detect(BUTTONS[1], GPIO.FALLING, handle_next, bouncetime=250)

display_image()

signal.pause()
