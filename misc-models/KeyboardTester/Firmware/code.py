import digitalio
import microcontroller
import board
import pwmio
import neopixel
import math
import random
import array
import adafruit_ssd1306
import busio as io
import usb_host
import usb.core
import adafruit_usb_host_descriptors
from rainbowio import colorwheel

# Settings
led_intensity = 0.1

# Layout description:
# Lines are arrays containing key descriptions.
# Key descriptions can be a simple string if there's a normal offset of 1U from the
# previous key and if the width of the key is 1U.
# If a key has an offset, is wider or taller, define the key as a tuple with the'
# string description as the first element, the offset as the second, the width in
# keyboard units as the third and the height as the fourth.
keys = [
    ['Esc', ('F1', 1), 'F2', 'F3', 'F4', ('F5', 0.5), 'F6', 'F7', 'F8', ('F9', 0.5), 'F10', 'F11', 'F12', ('PrtSc', 0.5), 'ScrLck', 'Pause', ('Break', 0.5), 'Inverse', ('Power', 1)],
    ['`~', '1!', '2@', '3#', '4$', '5%', '6^', '7&', '8*', '9(', '0)', '-_', '=+', ('Backspace', 0, 2), ('Insert', 0.5), 'Home', 'PgUp', ('NumLck', 0.5), '/', '*', '-', ('Reset', 0.5)],
    [('Tab', 0, 1.5), 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[{', ']}', ('\|', 0, 1.5), ('Del', 0.5), 'End', 'PgDn', ('7', 0.5), '8', '9', ('+', 0, 1, 2), ('Option', 0.5)],
    [('CapsLock', 0, 1.75), 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';:', '\'\"', ('Return', 0, 2.25), ('4', 4), '5', '6', ('Select', 1.5)],
    [('LeftShift', 0, 2.25), 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',<', '.>', '/?', ('RightShift', 0, 2.75), ('Up', 1.5), ('1', 1.5), '2', '3', ('Enter', 0, 1, 2), ('Start', 0.5)],
    [('LeftControl', 0, 1.25), ('Win', 0, 1.25), ('LeftAlt', 0, 1.25), ('Space', 0, 6.25), ('RightAlt', 0, 1.25), ('Fn', 0, 1.25), ('Menu', 0, 1.25), ('RightControl', 0, 1.25), ('Left', 0.5), 'Down', 'Right', ('0', 0.5, 2), '.', ('Help', 1.5)]
]

# List of keys in the same order they are positioned on the PCB
leds = ['Power', 'Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'PrtSc', 'ScrLck', 'Pause',
    '`~', '1!', '2@', '3#', '4$', '5%', '6^', '7&', '8*', '9(', '0)', '-_', '=+', 'Backspace', 'Insert', 'Home', 'PgUp',
    'Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[{', ']}', '\|', 'Del', 'End', 'PgDn',
    'CapsLock', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';:', '\'\"', 'Return',
    'LeftShift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',<', '.>', '/?', 'RightShift', 'Up',
    'LeftControl', 'Win', 'LeftAlt', 'Space', 'RightAlt', 'Fn', 'Menu', 'RightControl', 'Left', 'Down', 'Right',
    'NumLck', '/', '*', '-', '7', '8', '9', '+', '4', '5', '6', '1', '2', '3', 'Enter', '0', '.',
    'Help', 'Start', 'Select', 'Option', 'Reset', 'Break', 'Inverse']

# Modifier key mask definitions
CONTROL = 0x11
SHIFT = 0x22
ALT = 0x44
WIN = 0x88

# Key code to name mapping
# Reference for the key codes: https://www.usb.org/sites/default/files/hut1_5.pdf#chapter.10
keymap = {
    0x66: "Power",
    0x29: "Esc", 0x3A: "F1", 0x3B: "F2", 0x3C: "F3", 0x3D: "F4", 0x3E: "F5", 0x3F: "F6", 0x40: "F7", 0x41: "F8", 0x42: "F9", 0x43: "F10", 0x44: "F11", 0x45: "F12", 0x46: "PrtSc", 0x47: "ScrLck", 0x48: "Pause",
    0x35: '`~', 0x1E: "1!", 0x1F: "2@", 0x20: "3#", 0x21: "4$", 0x22: "5%", 0x23: "6^", 0x24: "7&", 0x25: "8*", 0x26: "9(", 0x27: "0)", 0x2D: "-_", 0x2E: "=+", 0x2A: "Backspace", 0x49: 'Insert', 0x4A: 'Home', 0x4B: 'PgUp',
    0x2B: 'Tab', 0x14: 'Q', 0x1A: 'W', 0x08: 'E', 0x15: 'R', 0x17: 'T', 0x1C: 'Y', 0x18: 'U', 0x0C: 'I', 0x12: 'O', 0x13: 'P', 0x2F: '[{', 0x30: ']}', 0x31: '\|', 0x4C: 'Del', 0x4D: 'End', 0x4E: 'PgDn',
    0x39: 'CapsLock', 0x04: 'A', 0x16: 'S', 0x07: 'D', 0x09: 'F', 0x0A: 'G', 0x0B: 'H', 0x0D: 'J', 0x0E: 'K', 0x0F: 'L', 0x33: ';:', 0x34: '\'\"', 0x28: 'Return',
    0x102: 'LeftShift', 0x1D: 'Z', 0x1B: 'X', 0x06: 'C', 0x19: 'V', 0x05: 'B', 0x11: 'N', 0x10: 'M', 0x36: ',<', 0x37: '.>', 0x38: '/?', 0x120: 'RightShift', 0x52: 'Up',
    0x101: 'LeftControl', 0x108: 'Win', 0x104: 'LeftAlt', 0x2C: 'Space', 0x140: 'RightAlt', 0x180: 'Fn', 0x65: 'Menu', 0x110: 'RightControl', 0x50: 'Left', 0x51: 'Down', 0x4F: 'Right',
    0x53: 'NumLck', 0x54: '/', 0x55: '*', 0x56: '-', 0x5F: '7', 0x60: '8', 0x61: '9', 0x57: '+', 0x5C: '4', 0x5D: '5', 0x5E: '6', 0x59: '1', 0x5A: '2', 0x5B: '3', 0x58: 'Enter', 0x62: '0', 0x63: '.',
    0x75: 'Help', 0x74: 'Start', 0x77: 'Select', 0xA1: 'Option', 0x79: 'Reset', 0x78: 'Break', 0xCF: 'Inverse'
}

# Compute coordinates of each key:
# Name: (x, y, led_index)
coordinates = dict()
y = -0.5
for row in keys:
    x = -0.5
    for key in row:
        (name, offset, width, height) = (
            key if type(key) is str else key[0],
            key[1] if type(key) is tuple and len(key) > 1 else 0,
            key[2] if type(key) is tuple and len(key) > 2 else 1,
            key[3] if type(key) is tuple and len(key) > 3 else 1
            )
        coordinates[name] = (x + offset + width / 2, y + height / 2, leds.index(name) if name in leds else -1)
        x = x + width + offset
    y = y + (1.25 if y == 0 else 1)
#print(coordinates)

width = max([x for (x, _, _) in coordinates.values()])
height = max([y for (_, y, _) in coordinates.values()])
center = (width / 2, height / 2)

PIXEL_COUNT = sum([len(key) for key in keys])

# Some basic colors
BLACK = 0x000000
WHITE = 0xFFFFFF
PURPLE = 0x9400D3
BLUE = 0x0000FF
GREEN = 0x00FF00
YELLOW = 0xFFFF00
ORANGE = 0xFF8000
RED = 0xFF0000

# (K3, K4, K5): row number
K_to_row = {
    (False, False, False): 6,
    (True,  False, False): 1,
    (False, True,  False): 4,
    (True,  True,  False): 7,
    (False, False, True ): 2,
    (True,  False, True ): 8,
    (False, True,  True ): 3,
    (True,  True,  True ): 5
}

# (K0, K1, K2): col number
K_to_col = {
    (False, False, False): 7,
    (True,  False, False): 6,
    (False, True,  False): 3,
    (True,  True,  False): 8,
    (False, False, True ): 1,
    (True,  False, True ): 5,
    (False, True,  True ): 2,
    (True,  True,  True ): 4
}

# I/O utils
ios = dict()
def get_io(pin):
    if pin in ios:
        return ios[pin]
    if type(pin) == microcontroller.Pin:
        ios[pin] = digitalio.DigitalInOut(pin)
    return ios[pin]

# Setup the display
# VCC is just GPIO16 set to high and GND is GPIO17 set to low.
OLED_WIDTH = 128
OLED_HEIGHT = 32
OLED_SDA = board.GP28
OLED_SCK = board.VOLTAGE_MONITOR

oledI2C = io.I2C(OLED_SCK, OLED_SDA)
oled = adafruit_ssd1306.SSD1306_I2C(OLED_WIDTH, OLED_HEIGHT, oledI2C)
oledCol = 0

# Setup the mode button
mode_button = get_io(board.GP26)
mode_button.switch_to_input(pull=digitalio.Pull.UP)

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
    if oledCol + len(chars) > OLED_WIDTH / 6:
        oled.scroll(0, -8)
        oled.fill_rect(0, OLED_HEIGHT - 8, OLED_WIDTH, 8, 0)
        oledCol = 0
    oled.text(chars, oledCol * 6, OLED_HEIGHT - 8, 1)
    oled.show()
    oledCol = oledCol + len(chars)

def cls():
    oled.fill(0)
    oled.show()

log("DecentKeyboardTester")
log("(c) B. Le Roy 2025")

def modulate(color, intensity):
    intensity = max(0, min(1, intensity))
    red = math.ceil(((color & 0xFF0000) >> 16) * intensity)
    green = math.ceil(((color & 0xFF00) >> 8) * intensity)
    blue = math.ceil((color & 0xFF) * intensity)
    return (red << 16) | (green << 8) | blue

pixels = neopixel.NeoPixel(board.GP27, PIXEL_COUNT, auto_write = False)

def clear_keyboard():
    for i in range(PIXEL_COUNT):
        pixels[i] = 0
    pixels.show()

class Mode:
    def init(self):
        pass
    def loop(self):
        pass

class Animation(Mode):
    def __init__(self):
        self.frame_number = 0
    def loop(self):
        self.frame_number = self.frame_number + 1
        self.display_frame()
    def display_frame(self):
        for (key, (x, y, led_index)) in coordinates.items():
            pixels[led_index] = self.paint(x, y)
        pixels.show()
    def paint(self, x, y):
        return 0

class RadialRainbow(Animation):
    def __init__(self):
        super().__init__()
        self.name = "Radial Rainbow"
    def paint(self, x, y):
        return modulate(colorwheel((math.sqrt((x - center[0])**2 + (y - center[1])**2) * 20 + 256 - self.frame_number) % 256), led_intensity)

class Droplet:
    def __init__(self, x = 0, y = 0):
        self.x = x
        self.y = y
        
class GhostInTheShell(Animation):
    def __init__(self):
        super().__init__()
        self.name = "Ghost in the Shell"
        self.droplets = []
    def display_frame(self):
        if (len(self.droplets) < 8):
            self.droplets.append(Droplet(
                x = width * random.random(),
                y = -random.random() * 10
            ))
        for droplet in self.droplets:
            droplet.y = droplet.y + 0.5
            if droplet.y > height + 10:
                self.droplets.remove(droplet)
        super().display_frame()
    def paint(self, x, y):
        intensity = 1
        for droplet in self.droplets:
            if abs(droplet.x - x) < 0.5 and y < droplet.y and y > droplet.y - 9:
                intensity = 10 - droplet.y + y
        return modulate(GREEN, intensity / 100)
    
class AnimationMode(Mode):
    def __init__(self):
        self.name = "Animations"
    def loop(self):
        self.animations[self.current_animation].loop()
        if (mode_button.value == False):
            self.current_animation = (self.current_animation + 1) % len(self.animations)
            cls()
            clear_keyboard()
            log(self.animations[self.current_animation].name)


DATA_PLUS = board.GP0
DATA_MINUS = board.GP1

keyboard_port = usb_host.Port(DATA_PLUS, DATA_MINUS)

DIR_IN = 0x80

class UsbKeyboardMode(Mode):
    def __init__(self):
        self.name = "USB Keyboard"
        self.keyboard = None
        self.keyboard_interface_address = None
        self.char = ""
        self.control = False
        self.alt = False
        self.shift = False
        self.win = False

    def init(self):
        pixels.fill(modulate(ORANGE, led_intensity))
        pixels[coordinates['Power'][2]] = modulate(RED, led_intensity)
        pixels.show()
        print("Starting USB discovery")
        # HID protocol reference: https://usb.org/sites/default/files/hid1_11.pdf
        for device in usb.core.find(find_all=True):
            config_descriptor = adafruit_usb_host_descriptors.get_configuration_descriptor(
                device, 0
            )

            i = 0
            while i < len(config_descriptor):
                descriptor_len = config_descriptor[i]
                descriptor_type = config_descriptor[i + 1]
                if descriptor_type == adafruit_usb_host_descriptors.DESC_INTERFACE:
                    interface_protocol = config_descriptor[i + 7]
                    if interface_protocol == 1 and self.keyboard == None:
                        log(f"{device.product}")
                        self.keyboard = device
                elif descriptor_type == adafruit_usb_host_descriptors.DESC_ENDPOINT:
                    endpoint_address = config_descriptor[i + 2]
                    if (endpoint_address & DIR_IN) and device == self.keyboard and interface_protocol == 1:
                        self.keyboard_interface_address = endpoint_address
                i += descriptor_len

        if self.keyboard != None and self.keyboard_interface_address != None:
            self.keyboard.set_configuration()
    def loop(self):
        if self.keyboard != None:
            try:
                buffer = array.array("i", range(1))

                self.keyboard.read(self.keyboard_interface_address, buffer)
                current_raw_code = buffer[0]
                print(current_raw_code) if current_raw_code != 0 else None

                current_key_code = (current_raw_code & 0xFF0000) >> 16
                current_modifier = current_raw_code & 0xFFFF

                self.char = keymap[current_key_code] if current_key_code in keymap else ""
                self.control = current_modifier & CONTROL != 0
                self.alt = current_modifier & ALT != 0
                self.shift = current_modifier & SHIFT != 0
                self.win = current_modifier & WIN != 0

                if current_key_code != 0:
                    ch(("CTRL + " if self.control else "") +
                       ("ALT + " if self.alt else "") +
                       ("SHIFT + " if self.shift else "") +
                       ("WIN + " if self.win else "") +
                       self.char if self.char != "" else "0x{:02x}".format(current_key_code))
                if current_key_code in keymap:
                    (_, _, led_index) = coordinates[keymap[current_key_code]]
                    pixels[led_index] = modulate(GREEN, led_intensity)
                if current_raw_code | 0x100 in keymap:
                    (_, _, led_index) = coordinates[keymap[current_raw_code | 0x100]]
                    pixels[led_index] = modulate(GREEN, led_intensity)
                pixels.show()

            except usb.core.USBTimeoutError:
                pass
            except usb.core.USBError:
                self.keyboard = None
                self.keyboard_interface_address = None

class MatrixKeyboard(Mode):
    def __init__(self):
        self.name = "Matrix keyboard"
        self.row_pins = []
        self.col_pins = []
        self.matrix = []
        self.charmap = dict()
        self.console_pin = None
        self.console = None
        self.start_pin = None
        self.start = None
        self.start_key = 'Start'
        self.select_pin = None
        self.select = None
        self.select_key = 'Select'
        self.option_pin = None
        self.option = None
        self.option_key = 'Option'
        self.reset_pin = None
        self.reset = None
        self.reset_key = 'Reset'
        self.power_pin = None
        self.logo_leds = None
        self.frame_number = 0
        self.last_key = None
        self.char_map = None
    def init(self):
        pixels.fill(0)
        # Setup the row pins
        for pin in self.row_pins:
            pinio = get_io(pin)
            pinio.direction = digitalio.Direction.OUTPUT
            pinio.value = True
        # Setup the column pins
        for pin in self.col_pins:
            pinio = get_io(pin)
            pinio.direction = digitalio.Direction.INPUT
            pinio.pull = digitalio.Pull.UP
        # Setup the console GND pin
        if self.console_pin != None:
            self.console = get_io(self.console_pin)
            self.console.direction = digitalio.Direction.INPUT
            self.console.pull = digitalio.Pull.DOWN
        # Setup the START pin
        if self.start_pin != None:
            self.start = get_io(self.start_pin)
            self.start.direction = digitalio.Direction.OUTPUT
            self.start.value = False
            pixels[coordinates[self.start_key][2]] = modulate(ORANGE, led_intensity)
        # Setup the SELECT pin
        if self.select_pin != None:
            self.select = get_io(self.select_pin)
            self.select.direction = digitalio.Direction.OUTPUT
            self.select.value = False
            pixels[coordinates[self.select_key][2]] = modulate(ORANGE, led_intensity)
        # Setup the OPTION pin
        if self.option_pin != None:
            self.option = get_io(self.option_pin)
            self.option.direction = digitalio.Direction.OUTPUT
            self.option.value = False
            pixels[coordinates[self.option_key][2]] = modulate(ORANGE, led_intensity)
        # Setup the RESET pin
        if self.reset_pin != None:
            self.reset = get_io(self.reset_pin)
            self.reset.direction = digitalio.Direction.OUTPUT
            self.reset.value = False
            pixels[coordinates[self.reset_key][2]] = modulate(ORANGE, led_intensity)
        # Setup the POWER pin with PWM
        if self.power_pin != None:
            ios[self.power_pin] = pwmio.PWMOut(self.power_pin, frequency=1000, duty_cycle=200)
        # Setup the default state of the keyboard visualization
        for row in self.matrix:
            for key in row:
                if key != None:
                    (_, _, led_index) = coordinates[key]
                    if led_index >= 0:
                        pixels[led_index] = modulate(ORANGE, led_intensity)
        # Manually setup right shift
        pixels[coordinates['RightShift'][2]] = modulate(ORANGE, led_intensity)
        # Setup the POWER LED
        pixels[coordinates['Power'][2]] = modulate(RED, led_intensity)
        pixels.show()
    def reset_last_key(self):
        if self.last_key != None:
            (_, _, led_index) = coordinates[self.last_key]
            pixels[led_index] = modulate(GREEN, led_intensity)
        self.last_key = None
    def loop(self):
        # Scan the matrix
        shift = False
        control = False
        char = ''
        mapped_char = ''
        for row_pin in range(len(self.row_pins)):
            rowio = get_io(self.row_pins[row_pin])
            rowio.value = False
            for col_pin in range(len(self.col_pins)):
                colio = get_io(self.col_pins[col_pin])
                if colio.value == False:
                    key = self.matrix[row_pin][col_pin]
                    if key != None:
                        if key != self.last_key:
                            self.reset_last_key()
                        (_, _, led_index) = coordinates[key]
                        pixels[led_index] = modulate(WHITE, led_intensity)
                        if key == self.shift_key:
                            shift = True
                            pixels[coordinates['RightShift'][2]] = modulate(GREEN, led_intensity)
                        if key == self.control_key:
                            control = True
                        if key != self.shift_key and key != self.control_key:
                            char = key
                        pixels.show()
                        self.last_key = key
            rowio.value = True
        if self.last_key != None:
            self.reset_last_key()
        mapped_char = self.char_map[char] if char != '' and self.char_map != None and char in self.char_map else char
        # Output the key pressed
        if len(mapped_char) == 1:
            if shift and mapped_char != '<Shift>':
                ch(mapped_char.upper())
            elif control and mapped_char != '<Control>':
                ch('CTRL + ' + mapped_char)
            else:
                ch(mapped_char.lower())
        elif len(mapped_char) == 2 and mapped_char[0] != 'F':
            if shift:
                ch(mapped_char[1])
            elif control:
                ch('CTRL + ' + mapped_char[0])
            else:
                ch(mapped_char[0])
        elif mapped_char != '':
            ch(("SHIFT + " if shift and mapped_char != '<Shift>' else "") + ("CTRL + " if control and mapped_char != '<Control>' else "") + mapped_char)
        # Check the console keys
        if self.start != None:
            self.start.value = True
            if self.console.value == True:
                pixels[coordinates[self.start_key][2]] = modulate(WHITE, led_intensity)
                pixels.show()
                ch('<Start>')
                self.last_key = self.start_key
            self.start.value = False
        if self.select != None:
            self.select.value = True
            if self.console.value == True:
                pixels[coordinates[self.select_key][2]] = modulate(WHITE, led_intensity)
                pixels.show()
                ch('<Select>')
                self.last_key = self.select_key
            self.select.value = False
        if self.option != None:
            self.option.value = True
            if self.console.value == True:
                pixels[coordinates[self.option_key][2]] = modulate(WHITE, led_intensity)
                pixels.show()
                ch('<Option>')
                self.last_key = self.option_key
            self.option.value = False
        if self.reset != None:
            self.reset.value = True
            if self.console.value == True:
                pixels[coordinates[self.reset_key][2]] = modulate(WHITE, led_intensity)
                pixels.show()
                ch('<Reset>')
                self.last_key = self.reset_key
            self.reset.value = False

        if self.logo_leds != None:
            for (i, led) in enumerate(self.logo_leds):
                pixels[coordinates[led][2]] = modulate(colorwheel(self.frame_number % 256 + i * (256 / len(self.logo_leds))), led_intensity)
            pixels.show()
        self.frame_number = self.frame_number + 1

class AtariXE(MatrixKeyboard):
    def __init__(self):
        super().__init__()
        self.name = "Atari XE"
        self.row_pins = [board.GP14, board.GP15, board.GP13, board.GP16, board.GP8, board.GP19, board.GP6, board.GP7]
        self.col_pins = [board.GP20, board.GP5, board.GP9, board.GP10, board.GP11, board.GP12, board.GP18, board.GP17, board.GP21]
        self.matrix = [
            ['7&', None,    '8*', '9(', '0)', '-_',   '=+',           'Backspace',    'Break'],
            ['6^', None,    '5%', '4$', '3#', '2@',   '1!',           '`~',           None],
            ['U',  None,    'I',  'O',  'P',  '[{',   ']}',           '\|',           None],
            ['Y',  None,    'T',  'R',  'E',  'W',    'Q',            'Tab',          None],
            ['F1', 'J',     'K',  'L',  ';:', '\'\"', 'Return',       'F2',           'CapsLock'],
            [None, 'H',     'G',  'F',  'D',  'S',    'A',            'RightControl', None],
            ['N',  'Space', 'M',  ',<', '.>', '/?',   'Inverse',      None,           None],
            ['F3', 'F8',    'B',  'V',  'C',  'X',    'Z',            'F4',           'LeftShift']]
        self.console_pin = board.GP4
        self.start_pin = board.GP22
        self.start_key = 'F9'
        self.select_pin = board.GP23
        self.select_key = 'F10'
        self.option_pin = board.GP24
        self.option_key = 'F11'
        self.reset_pin = board.GP25
        self.reset_key = 'F12'
        self.power_pin = board.GP3
        self.shift_key = 'LeftShift'
        self.control_key = 'CapsLock'
        self.logo_leds = ['0', '.', 'Enter', 'Help']
        self.char_map = {'RightControl': '<Caps>', 'CapsLock': '<Control>', 'LeftShift': '<Shift>', '`~': 'Esc', '-_': '<', '=+': '>', 'F8': '<Help>',
                         '[{': '-_', ']}': '=|', "'\"": '+\\', 'Return': '*^', '\|': '<Return>', 'Inverse': '<Inverse>', 'Break': '<Break>',
                         'F1': '<F1>', 'F2': '<F2>', 'F3': '<F3>', 'F4': '<F4>', ',<': ',[', '.>': '.]'}

class AtariXL(MatrixKeyboard):
    def __init__(self):
        super().__init__()
        self.name = "Atari XL"
        self.row_pins = [board.GP2, board.GP3, board.GP4, board.GP5, board.GP6, board.GP7, board.GP8, board.GP9]
        self.col_pins = [board.GP11, board.GP12, board.GP13, board.GP14, board.GP15, board.GP16, board.GP17, board.GP18, board.GP10]
        self.matrix = [
            ['7&', None,    '8*', '9(', '0)', '-_',   '=+',           'Backspace',    'Break'],
            ['6^', None,    '5%', '4$', '3#', '2@',   '1!',           '`~',           None],
            ['U',  None,    'I',  'O',  'P',  '[{',   ']}',           '\|',           None],
            ['Y',  None,    'T',  'R',  'E',  'W',    'Q',            'Tab',          None],
            ['F1', 'J',     'K',  'L',  ';:', '\'\"', 'Return',       'F2',           'CapsLock'],
            [None, 'H',     'G',  'F',  'D',  'S',    'A',            'RightControl', None],
            ['N',  'Space', 'M',  ',<', '.>', '/?',   'Inverse',      None,           None],
            ['F3', 'Help',  'B',  'V',  'C',  'X',    'Z',            'F4',           'LeftShift']]
        self.console_pin = board.GP19
        self.start_pin = board.GP21
        self.start_key = 'F9'
        self.select_pin = board.GP22
        self.select_key = 'F10'
        self.option_pin = board.GP23
        self.option_key = 'F11'
        self.reset_pin = board.GP24
        self.reset_key = 'F12'
        self.power_pin = board.GP25
        self.shift_key = 'LeftShift'
        self.control_key = 'CapsLock'
        self.logo_leds = ['Insert', 'Home', 'PgUp', 'NumLck']
        self.char_map = {'RightControl': '<Caps>', 'CapsLock': '<Control>', 'LeftShift': '<Shift>', '`~': 'Esc', '-_': '<', '=+': '>', 'Help': '<Help>',
                         '[{': '-_', ']}': '=|', "'\"": '+\\', 'Return': '*^', '\|': '<Return>', 'Inverse': '<Inverse>', 'Break': '<Break>',
                         'F1': '<F1>', 'F2': '<F2>', 'F3': '<F3>', 'F4': '<F4>', ',<': ',[', '.>': '.]'}

modes = [AtariXE(), AtariXL(), UsbKeyboardMode(), GhostInTheShell(), RadialRainbow()]
current_mode = 0
log('Mode: ' + modes[current_mode].name)
modes[current_mode].init()

while True:
    modes[current_mode].loop()
    if (mode_button.value == False):
        current_mode = (current_mode + 1) % len(modes)
        cls()
        clear_keyboard()
        # De-initialize GPIOs 2-25 that have been used by the previous mode
        for pin in [board.GP2, board.GP3, board.GP4, board.GP5, board.GP6, board.GP7,
                    board.GP8, board.GP9, board.GP10, board.GP11, board.GP12,
                    board.GP13, board.GP14, board.GP15, board.GP16, board.GP17,
                    board.GP18, board.GP19, board.GP20, board.GP21, board.GP22,
                    board.GP23, board.GP24, board.GP25]:
            if pin in ios:
                pin = get_io(pin)
                pin.deinit()
        ios = dict()
        log('Mode: ' + modes[current_mode].name)
        modes[current_mode].init()
        while (mode_button.value == False):
            pass
