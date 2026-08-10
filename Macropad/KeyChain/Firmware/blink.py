from machine import Pin, USBDevice
from utime import sleep
import neopixel
#import pyb
import math

# Pins we're going to use
A_pin = Pin.board.GP0
B_pin = Pin.board.GP1
C_pin = Pin.board.GP2
D_pin = Pin.board.GP3
RGB_pin = Pin.board.GP4

# Prepare the RGB LEDs
RGB = neopixel.NeoPixel(RGB_pin, 4)
brightness = 16

# Prepare USB
HID_REPORT_DESCRIPTOR = bytes([
    0x06, 0x00, 0xFF,  # Usage Page (Vendor-Defined 1)
    0x09, 0x01,        # Usage (Vendor-Defined 1)
    0xA1, 0x01,        # Collection (Application)
    
    # --- Input Report ---
    0x85, 0x01,        #   Report ID (1)
    0x09, 0x02,        #   Usage (Vendor-Defined 2)
    0x15, 0x00,        #   Logical Minimum (0)
    0x26, 0xFF, 0x00,  #   Logical Maximum (255)
    0x75, 0x08,        #   Report Size (8 bits)
    0x95, 0x08,        #   Report Count (8 bytes)
    0x81, 0x02,        #   Input (Data, Var, Abs)
    
    # --- Output Report ---
    0x85, 0x02,        #   Report ID (2)
    0x09, 0x03,        #   Usage (Vendor-Defined 3)
    0x15, 0x00,        #   Logical Minimum (0)
    0x26, 0xFF, 0x00,  #   Logical Maximum (255)
    0x75, 0x08,        #   Report Size (8 bits)
    0x95, 0x08,        #   Report Count (8 bytes)
    0x91, 0x02,        #   Output (Data, Var, Abs)
    
    0xC0,              # End Collection
])

DEVICE_DESCRIPTOR = bytes([
    0x12,  # bLength: 18 bytes
    0x01,  # bDescriptorType: DEVICE
    0x00, 0x02,  # bcdUSB: USB 2.0
    0x00,  # bDeviceClass: (defined in interface)
    0x00,  # bDeviceSubClass
    0x00,  # bDeviceProtocol
    0x40,  # bMaxPacketSize0: 64 bytes
    0xAD, 0xDE,  # idVendor: 0xDEAD (a common test VID)
    0xEF, 0xBE,  # idProduct: 0xBEEF (a common test PID)
    0x00, 0x01,  # bcdDevice: 1.00
    0x01,  # iManufacturer
    0x02,  # iProduct
    0x03,  # iSerialNumber
    0x01,  # bNumConfigurations
])

CONFIG_DESCRIPTOR = bytes([
    # Configuration
    0x09,  # bLength
    0x02,  # bDescriptorType: CONFIGURATION
    0x29, 0x00,  # wTotalLength: 41 bytes (9+9+9+7+7)
    0x01,  # bNumInterfaces
    0x01,  # bConfigurationValue
    0x00,  # iConfiguration
    0x80,  # bmAttributes: bus powered
    0xFA,  # bMaxPower: 500 mA

    # Interface
    0x09,  # bLength
    0x04,  # bDescriptorType: INTERFACE
    0x00,  # bInterfaceNumber
    0x00,  # bAlternateSetting
    0x02,  # bNumEndpoints (1 IN, 1 OUT)
    0x03,  # bInterfaceClass: HID
    0x00,  # bInterfaceSubClass
    0x00,  # bInterfaceProtocol
    0x00,  # iInterface

    # HID
    0x09,  # bLength
    0x21,  # bDescriptorType: HID
    0x11, 0x01,  # bcdHID: 1.11
    0x00,  # bCountryCode
    0x01,  # bNumDescriptors
    0x22,  # bDescriptorType: REPORT
    len(HID_REPORT_DESCRIPTOR), 0x00,  # wDescriptorLength

    # Endpoint IN
    0x07,  # bLength
    0x05,  # bDescriptorType: ENDPOINT
    0x81,  # bEndpointAddress: IN Endpoint 1
    0x03,  # bmAttributes: Interrupt
    0x40, 0x00,  # wMaxPacketSize: 64 bytes
    0x0A,  # bInterval: 10 ms polling interval

    # Endpoint OUT
    0x07,  # bLength
    0x05,  # bDescriptorType: ENDPOINT
    0x01,  # bEndpointAddress: OUT Endpoint 1
    0x03,  # bmAttributes: Interrupt
    0x40, 0x00,  # wMaxPacketSize: 64 bytes
    0x0A,  # bInterval: 10 ms polling interval
])

STRING_DESCRIPTORS = [
    # 0: Language
    b'\x04\x03\x09\x04',  # LangID: 0x0409 (English US)
    # 1: Manufacturer
    "DecentEngineering".encode('utf-16le'),
    # 2: Product
    "Keychain Macropad".encode('utf-16le'),
    # 3: Serial
    "123456".encode('utf-16le'),
]

usb_configured = False
transfer_in_progress = False

def hid_handler(event, data):
    global usb_configured, transfer_in_progress
    if event == "set_config":
        print("USB configured by host.")
        usb_configured = True
    elif event == "set_report":
        print(f"Received OUT report (packet size: {len(data)}): {bytes(data)}")
    elif event == "ep_in_complete":
        if data == 1: 
            transfer_in_progress = False

report_buffer = bytearray(64)

try:
    usb = USBDevice(
        dev_descriptor = DEVICE_DESCRIPTOR,
        config_descriptor = CONFIG_DESCRIPTOR,
        string_descriptors = STRING_DESCRIPTORS,
        hid = {0: (HID_REPORT_DESCRIPTOR, hid_handler, (1, 1), 64)}
    )
    # usb.connect()
    print("USB initialized")

except Exception as e:
    print("Failed to initialize USB")

print("Main loop starting")

hue = 0
counter = 0
while True:
    if usb_configured and not transfer_in_progress:
        try:
            report_buffer[:] = b'\x00' * 64
            report_buffer[0] = 0x01 # Report ID
            report_buffer[1] = counter & 0xFF
            
            transfer_in_progress = True
            usb.submit_xfer(1, report_buffer)

            counter = (counter + 1) & 0xFF
        
        except Exception as e:
            print(f"Error submitting transfer: {e}")
            transfer_in_progress = False

    try:
        for led in range(4):
            r = int(brightness / 2 * (1 + math.cos(math.radians(hue + led * 60))))
            g = int(brightness / 2 * (1 + math.cos(math.radians(hue + 120 + led * 60))))
            b = int(brightness / 2 * (1 + math.cos(math.radians(hue + 240 + led * 60))))
            RGB[led] = (r, g, b)
        #print(int(brightness * math.cos(math.radians(hue))), neo[0])
        RGB.write()
        hue = hue + 10 if hue < 360 else 0
        sleep(1) # sleep 1sec
    except KeyboardInterrupt:
        break

    sleep(1)

print("Turning off")
RGB.fill((0, 0, 0))
RGB.write()
print("Finished.")
