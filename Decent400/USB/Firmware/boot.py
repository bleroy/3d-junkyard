import usb_hid

usb_hid.enable((usb_hid.Device.KEYBOARD, gamepad), boot_device = 0)