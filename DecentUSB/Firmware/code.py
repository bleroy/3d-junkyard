# DecentUSB (c) 2024 Bertrand Le Roy
# A USB host for Atari 8-bit computers
# This is work in progress.
# This firmware doesn't entirely work yet.
# It will be rewritten in PIO assembly and C to ensure reliable timing.

import asyncio
import digitalio
import board
import array
import usb_host
import usb.core

import adafruit_usb_host_descriptors
import adafruit_ssd1306
from adafruit_mcp230xx.mcp23017 import MCP23017

import busio as io

# Modifier key mask definitions
CONTROL = 0x11
SHIFT = 0x22
ALT = 0x44
WIN = 0x88

# Key to character and Atari matrix coordinates (row, col)
# Reference for the key codes: https://www.usb.org/sites/default/files/hut1_5.pdf#chapter.10
keymap = {
    # Main matrix
    0x24: ("7", 1, 1),                         0x25: ("8", 1, 3), 0x26: ("9", 1, 4), 0x27: ("0", 1, 5),                                             0x2A: ("Backspace", 1, 8), 0x48: ("Break", 1, 9),
    0x23: ("6", 2, 1),                         0x22: ("5", 2, 3), 0x21: ("4", 2, 4), 0x20: ("3", 2, 5), 0x1F: ("2", 2, 6), 0x1E: ("1", 2, 7),       0x29: ("Esc", 2, 8),
    0x18: ("U", 3, 1),                         0x0C: ("I", 3, 3), 0x12: ("O", 3, 4), 0x13: ("P", 3, 5), 0x2D: ("-", 3, 6), 0x2E: ("=", 3, 7),       0x28: ("Return", 3, 8),
    0x1C: ("Y", 4, 1),                         0x17: ("T", 4, 3), 0x15: ("R", 4, 4), 0x08: ("E", 4, 5), 0x1A: ("W", 4, 6), 0x14: ("Q", 4, 7),       0x2B: ("Tab", 4, 8),
    0x3A: ("F1", 5, 1), 0x0D: ("J", 5, 2),     0x0E: ("K", 5, 3), 0x0F: ("L", 5, 4), 0x33: (";", 5, 5),                                             0x3B: ("F2", 5, 8),
                        0x0B: ("H", 6, 2),     0x0A: ("G", 6, 3), 0x09: ("F", 6, 4), 0x07: ("D", 6, 5), 0x16: ("S", 6, 6), 0x04: ("A", 6, 7),       0x39: ("Caps", 6, 8),
    0x11: ("N", 7, 1),  0x2C: ("Space", 7, 2), 0x10: ("M", 7, 3), 0x36: (",", 7, 4), 0x37: (".", 7, 5), 0x38: ("/", 7, 6), 0x35: ("Inverse", 7, 7),
    0x3C: ("F3", 8, 1), 0x43: ("Help", 8, 2),  0x05: ("B", 8, 3), 0x19: ("V", 8, 4), 0x06: ("C", 8, 5), 0x1B: ("X", 8, 6), 0x1D: ("Z", 8, 7),       0x3D: ("F4", 8, 8),
}

# Key map overrides map with modifier key overrides (0 suppresses all modifier keys)
keymap_overrides = {
    # Atari-specifc differences
    (0x36, SHIFT): ("<", 1, 6, 0),
    (0x37, SHIFT): (">", 1, 7, 0),
    (0x2E, SHIFT): ("+", 5, 6, 0),
    (0x25, SHIFT): ("*", 5, 7, 0),
    (0x1F, SHIFT): ("@", 1, 3, SHIFT),
    (0x34, SHIFT): ('"', 2, 6, SHIFT),
    (0x34, 0):     ("'", 1, 1, SHIFT),
    (0x24, SHIFT): ("&", 2, 1, SHIFT),
    (0x23, SHIFT): ("^", 5, 7, SHIFT),
    (0x31, 0):     ("\\", 5, 6, 0),
    (0x31, SHIFT): ("|", 3, 7, SHIFT),
    (0x2F, 0):     ("[", 7, 4, SHIFT),
    (0x30, 0):     ("]", 7, 5, SHIFT),
    # Additional full-size keyboard keys
    ## Nav cluster
    (0x50, 0): ("Left", 5, 6, CONTROL),
    (0x4F, 0): ("Right", 5, 7, CONTROL),
    (0x52, 0): ("Up", 3, 6, CONTROL),
    (0x51, 0): ("Down", 3, 7, CONTROL),
    (0x49, 0): ("Insert", 1, 7, SHIFT),
    (0x4C, 0): ("Del", 1, 8, SHIFT),
    (0x4A, 0): ("Home", 8, 1, SHIFT),
    (0x4D, 0): ("End", 8, 8, SHIFT),
    (0x4B, 0): ("PgUp", 5, 1, SHIFT),
    (0x4E, 0): ("PgDown", 5, 8, SHIFT),
    ## Num pad
                               (0x54, 0): ("/", 7, 6, 0), (0x55, 0): ("*", 5, 7, 0), (0x56, 0): ("-", 3, 6, 0),
    (0x5F, 0): ("7", 1, 1, 0), (0x60, 0): ("8", 1, 3, 0), (0x61, 0): ("9", 1, 4, 0), (0x57, 0): ("+", 5, 6, 0),
    (0x5C, 0): ("4", 2, 4, 0), (0x5D, 0): ("5", 2, 3, 0), (0x5E, 0): ("6", 2, 1, 0),
    (0x59, 0): ("1", 2, 7, 0), (0x5A, 0): ("2", 2, 6, 0), (0x5B, 0): ("3", 2, 5, 0),  (0x58, 0): ("Enter", 3, 8, 0),
    (0x62, 0): ("0", 1, 5, 0), (0x63, 0): (".", 7, 5, 0),
    ## and more
    (0x42, 0): ("Break", 1, 9, 0)
}

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

# Setup the optional monitor screen
# VCC is just GPIO16 set to high and GND is GPIO17 set to low.
OLED = True
OLED_WIDTH = 128
OLED_HEIGHT = 32
OLED_GND = board.GP17
OLED_VCC = board.GP16
OLED_SDA = board.GP14
OLED_SCK = board.GP15

if OLED:
    oledVccPin = digitalio.DigitalInOut(OLED_VCC)
    oledVccPin.direction = digitalio.Direction.OUTPUT
    oledVccPin.value = True
    OledGndPin = digitalio.DigitalInOut(OLED_GND)
    OledGndPin.direction = digitalio.Direction.OUTPUT
    OledGndPin.value = False

    oledI2C = io.I2C(OLED_SCK, OLED_SDA)
    oled = adafruit_ssd1306.SSD1306_I2C(OLED_WIDTH, OLED_HEIGHT, oledI2C)

oledCol = 0

def log(str):
    global oledCol
    # Echo the string on both the console and the oled screen
    print(str)
    if OLED:
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

# # How to translate USB key presses to Pokey signals
# Internal keyboard connector layouts vary by Atari computer models, but we're connecting between
# Pokey and the two 4051 decoder chips that are then connected to the keyboard connector, which
# abstracts us from those differences.
# In order to simulate key presses for Pokey, we need to monitor the 3-bit encoded signals
# that go to the 4051 chips and that binary-encode row and column numbers between 1 and 8.
# That tells us the matrix coordinates of the key the computer is in the process of scanning.
# If that corresponds to the currently pressed key on the USB keyboard, we need to pull key response
# line 1 (KR1) to ground.
# One exception to this process is for the Break, Control and Shift keys for which the column is not
# one of the 8 regular encoded columns. Instead, the voltage for their respective row is passed
# directly to keyboard read line 2 (KR2) by closing the switch. That creates effectively a ninth
# column. We can read the state of those keys outside of the column loop but inside the row loop
# by reading the state of KR2.
# See for example this Atari 800XL schematic:
# https://ezcontents.org/sites/default/files/downloads/Atari800XL_schematics_rev2.pdf

log("Decent USB Host")

DATA_PLUS = board.GP2
DATA_MINUS = board.GP3

keyboard_port = usb_host.Port(DATA_PLUS, DATA_MINUS)

DIR_IN = 0x80

class Shared:
    def __init__(self, keyboard, keyboard_interface_address):
        self.keyboard = keyboard
        self.keyboard_interface_address = keyboard_interface_address
        self.shift = False
        self.control = False
        self.alt = False
        self.win = False
        self.current_raw_code = 0
        self.current_key_code = 0
        self.current_modifier = 0
        self.char = ""
        self.char_row = 0
        self.char_col = 0
        self.start = False
        self.select = False
        self.option = False
        self.reset = False

async def discover_usb_devices(shared):
    print("Starting USB discovery")
    # HID protocol reference: https://usb.org/sites/default/files/hid1_11.pdf
    while True:
        for device in usb.core.find(find_all=True):
            #log(f"pid {hex(device.idProduct)}")
            #log(f"vid {hex(device.idVendor)}")
            #log(f"man {device.manufacturer}")
            #log(f"product {device.product}")
            #log(f"serial {device.serial_number}")
            #log(f"class {adafruit_usb_host_descriptors.get_device_descriptor(device)[4]:02x} subclass {adafruit_usb_host_descriptors.get_device_descriptor(device)[5]:02x} protocol {adafruit_usb_host_descriptors.get_device_descriptor(device)[6]:02x}")
            #log("config[0]:")
            config_descriptor = adafruit_usb_host_descriptors.get_configuration_descriptor(
                device, 0
            )

            i = 0
            while i < len(config_descriptor):
                descriptor_len = config_descriptor[i]
                descriptor_type = config_descriptor[i + 1]
                if descriptor_type == adafruit_usb_host_descriptors.DESC_CONFIGURATION:
                    config_value = config_descriptor[i + 5]
                    #log(f" value {config_value:d}")
                elif descriptor_type == adafruit_usb_host_descriptors.DESC_INTERFACE:
                    interface_number = config_descriptor[i + 2]
                    interface_class = config_descriptor[i + 5]
                    interface_subclass = config_descriptor[i + 6]
                    interface_protocol = config_descriptor[i + 7]
                    #log(f" interface[{interface_number:d}]")
                    #log(
                    #    f"  class {interface_class:02x} subclass {interface_subclass:02x} protocol {interface_protocol:02x}"
                    #)
                    if interface_protocol == 1 and shared.keyboard == None:
                        log(f"{device.product}")
                        shared.keyboard = device
                elif descriptor_type == adafruit_usb_host_descriptors.DESC_ENDPOINT:
                    endpoint_address = config_descriptor[i + 2]
                    if (endpoint_address & DIR_IN) and device == shared.keyboard and interface_protocol == 1:
                        shared.keyboard_interface_address = endpoint_address
                        #log(f"Found keyboard interface IN {endpoint_address:02x}")
                i += descriptor_len

        if shared.keyboard != None and shared.keyboard_interface_address != None:
            shared.keyboard.set_configuration()
            await asyncio.sleep(0)
        else:
            await asyncio.sleep(5)

async def receive_usb_keyboard(shared):
    global shift, control, alt, win, current_raw_code, current_key_code, current_modifier, char, start, select, option, reset

    print("Starting USB scanning")
    while True:
        if shared.keyboard != None:
            try:
                buffer = array.array("i", range(1))

                shared.keyboard.read(shared.keyboard_interface_address, buffer)
                current_raw_code = buffer[0]

                current_key_code = (current_raw_code & 0xFF0000) >> 16
                current_modifier = current_raw_code & 0xFFFF

                shared.char = ""
                shared.start = False
                shared.select = False
                shared.option = False
                shared.reset = False
                shared.control = current_modifier & CONTROL != 0
                shared.alt = current_modifier & ALT != 0
                shared.shift = current_modifier & SHIFT != 0
                shared.win = current_modifier & WIN != 0

                ## Console keys
                if current_key_code == 0x3E:
                    shared.start = True
                    shared.char = "Start"
                elif current_key_code == 0x3F:
                    shared.select = True
                    shared.char = "Select"
                elif current_key_code == 0x40:
                    shared.option = True
                    shared.char = "Option"
                elif current_key_code == 0x41:
                    shared.reset = True
                    shared.char = "Reset"
                else:
                    override_key = (current_key_code, (SHIFT if shared.shift else 0) | (CONTROL if shared.control else 0) | (ALT if shared.alt else 0) | (WIN if shared.win else 0))

                    if override_key in keymap_overrides:
                        override = keymap_overrides[override_key]
                        shared.char = override[0]
                        shared.char_row = override[1]
                        shared.char_col = override[2]
                        shared.shift = override[3] & SHIFT != 0
                        shared.control = override[3] & CONTROL != 0
                        shared.alt = override[3] & ALT != 0
                        shared.win = override[3] & WIN != 0
                    else:
                        mapped = keymap[current_key_code] if current_key_code in keymap else ("", 0, 0)
                        shared.char = mapped[0]
                        shared.char_row = mapped[1]
                        shared.char_col = mapped[2]
                
                if current_key_code != 0:
                    ch(("CTRL + " if shared.control else "") + ("ALT + " if shared.alt else "") + ("SHIFT + " if shared.shift else "") + ("WIN + " if shared.win else "") + shared.char if shared.char != "" else "0x{:02x}".format(current_key_code))
            except usb.core.USBTimeoutError:
                pass
            except usb.core.USBError:
                shared.keyboard = None
                shared.keyboard_interface_address = None
        await asyncio.sleep(0)

# 
pio_scan_pokey = """
.program pokeyscan
.wrap_target
loop:
    in  x, pins          ; Current pokey scan code -> x
    jmp !y nope         ; If no active scan code, do nothing
cmp:
    jmp x!=y set_high
    out pins, 1
    jmp loop
set_high:
    out pins, 0
nope:
    nop
.wrap
"""

async def scan_pokey(shared):
    K0 = digitalio.DigitalInOut(board.GP11)
    K1 = digitalio.DigitalInOut(board.GP10)
    K2 = digitalio.DigitalInOut(board.GP9)
    K3 = digitalio.DigitalInOut(board.GP8)
    K4 = digitalio.DigitalInOut(board.GP7)
    K5 = digitalio.DigitalInOut(board.GP6)
    KR2 = digitalio.DigitalInOut(board.GP12)

    for line in [K0, K1, K2, K3, K4, K5, KR2]:
        line.direction = digitalio.Direction.INPUT
        line.pull = None

    mcp_I2C = io.I2C(board.GP1, board.GP0)
    mcp = MCP23017(mcp_I2C)
    KR1 = mcp.get_pin(7)
    KR1.direction = digitalio.Direction.OUTPUT

    print("Starting Pokey scanning")
    while True:
        if shared.keyboard != None:
            # Scan Pokey lines K0-5
            row = K_to_row[(K3.value, K4.value, K5.value)]
            col = K_to_col[(K0.value, K1.value, K2.value)]
            #print(f"({row}, {col}): {(K0.value, K1.value, K2.value, K3.value, K4.value, K5.value)}")
            if row == shared.char_row and col == shared.char_col:
                KR1.value = False
                #print(f"({row}, {col})")
            else:
                KR1.value = True
        #await asyncio.sleep(0)

async def main():
    shared = Shared(None, None)
    discover_usb_devices_task = asyncio.create_task(discover_usb_devices(shared))
    pokey_task = asyncio.create_task(scan_pokey(shared))
    #usb_task = asyncio.create_task(receive_usb_keyboard(shared))
    # Simulate a static key press for now
    #shared.char_row = 6
    #shared.char_col = 5
    await asyncio.gather(pokey_task)

asyncio.run(main())