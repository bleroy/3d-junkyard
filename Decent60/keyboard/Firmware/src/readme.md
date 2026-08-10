# Decent MegaXE

*A 60% keyboard designed for the MegaXE FPGA retro computer*

* Keyboard Maintainer: [Bertrand Le roy](https://github.com/bleroy/3d-junkyard/blob/main/DecenTKL/)
* Hardware Supported: Decent MegaXE (RP2040 based)
* Hardware Availability: Custom built but open-source

Make example for this keyboard (after setting up your QMK build environment):

qmk compile -kb decent/megaxe -km default

Flashing example for this keyboard:

```
qmk flash -kb decent/megaxe -km default
```

See the [build environment setup](https://docs.qmk.fm/#/getting_started_build_tools) and the [make instructions](https://docs.qmk.fm/#/getting_started_make_guide) for more information. Brand new to QMK? Start with our [Complete Newbs Guide](https://docs.qmk.fm/#/newbs).

## Bootloader

Press the escape key or the button on the back of the Pi while connecting the keyboard.

## Special commands

[Control]+[Atari] + 1: Toggle RGB lighting
[Control]+[Atari] + Up: Next RGB effect
[Control]+[Atari] + Down: Previous RGB effect
[Control]+[Atari] + X: Change RGB hue
[Control]+[Atari] + S: Lower RGB brightness
[Control]+[Atari] + W: Raise RGB brightness
[Control]+[Atari] + Left: Lower RGB animation speed
[Control]+[Atari] + Right: Raise RGB animation speed

[Both shifts] + B: go into bootloader mode without unplugging the keyboard
[Both shifts] + \: delete configuration data

## Layout
```C
/*
    *      /─────/─────/─────/─────/─────/─────/─────/─────/─────/
    *     /F1   /F2   /F3   /F4   /Help /Start/Slect/Optin/Reset/
    *    /─────/─────/─────/─────/─────/─────/─────/─────/─────/
    * ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───────┐
    * │Esc│ 1!│ 2@│ 3#│ 4%│ 5%│ 6^│ 7&│ 8*│ 9(│ 0)│ - │ = │ Backsp│
    * ├───┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─────┤
    * │ Tab │ Q │ W │ E │ R │ T │ Y │ U │ I │ O │ P │ [{│ ]}│  \| │
    * ├─────┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴─────┤
    * │ Caps │ A │ S │ D │ F │ G │ H │ J │ K │ L │ ;:│ '"│  Enter │
    * ├──────┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴────────┤
    * │ Shift  │ Z │ X │ C │ V │ B │ N │ M │ ,<│ .>│ /?│    Shift │
    * ├────┬───┴┬──┴─┬─┴───┴───┴───┴───┴───┴──┬┴───┼───┴┬────┬────┤
    * │Ctrl│ GUI│ Brk│                        │  ← │  ↑ │  ↓ │  → │
    * └────┴────┴────┴────────────────────────┴────┴────┴────┴────┘
*/