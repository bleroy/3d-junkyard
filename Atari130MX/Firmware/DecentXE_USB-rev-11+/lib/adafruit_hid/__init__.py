# SPDX-FileCopyrightText: 2017 Scott Shawcroft for Adafruit Industries
#
# SPDX-License-Identifier: MIT

"""
`adafruit_hid`
====================================================

This driver simulates USB HID devices.

* Author(s): Scott Shawcroft, Dan Halbert

Implementation Notes
--------------------
**Software and Dependencies:**
* Adafruit CircuitPython firmware for the supported boards:
  https://github.com/adafruit/circuitpython/releases
"""

# imports
from __future__ import annotations

try:
    from typing import Sequence
    import usb_hid
except ImportError:
    pass

__version__ = "5.3.4"
__repo__ = "https://github.com/adafruit/Adafruit_CircuitPython_HID.git"


def find_device(
    devices: Sequence[usb_hid.Device], *, usage_page: int, usage: int
) -> usb_hid.Device:
    """Search through the provided sequence of devices to find the one with the matching
    usage_page and usage."""
    if hasattr(devices, "send_report"):
        devices = [devices]  # type: ignore
    for device in devices:
        if (
            device.usage_page == usage_page
            and device.usage == usage
            and hasattr(device, "send_report")
        ):
            return device
    raise ValueError("Could not find matching HID device.")
