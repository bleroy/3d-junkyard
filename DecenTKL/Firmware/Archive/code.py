print("DecenTKL")

import board

from kmk.kmk_keyboard import KMKKeyboard
from kmk.keys import KC
from kmk.scanners import DiodeOrientation
from kmk.extensions.rgb import RGB
from kmk.extensions.rgb import AnimationModes
from kmk.modules.encoder import EncoderHandler

keyboard = KMKKeyboard()

keyboard.col_pins = (board.GP1, board.GP2, board.GP3, board.GP4, board.GP5, board.GP6, board.GP7, board.GP8, board.GP9)
keyboard.row_pins = (board.GP11, board.GP12, board.GP13, board.GP14, board.GP15, board.GP16, board.GP17, board.GP18, board.GP19, board.GP20)
keyboard.diode_orientation = DiodeOrientation.COL2ROW

# Layout to matrix coordinates:
# 1-7 1-6 1-5 1-4 1-3 1-2 1-1 2-1 2-2 2-3 2-4 2-5 2-6
keyboard.keymap = [
    # Standard layer
    #0      1         2       3          4            5            6          7             8
    [KC.F6, KC.F5,    KC.F4,  KC.F3,     KC.F2,       KC.F1,       KC.ESCAPE, KC.RCTRL,     KC.LCTRL, #0
     KC.F7, KC.F8,    KC.F9,  KC.F10,    KC.INSERT,   KC.HOME,     KC.PGUP,   KC.RGUI,      KC.LGUI,  #1
     KC.N6, KC.N5,    KC.N4,  KC.N3,     KC.N2,       KC.N1,       KC.GRAVE,  KC.RALT,      KC.LALT,  #2
     KC.N7, KC.N8,    KC.N9,  KC.N0,     KC.MINUS,    KC.EQUAL,    KC.BSPACE, KC.APP,       KC.SPACE, #3
     KC.Y,  KC.T,     KC.R,   KC.E,      KC.W,        KC.Q,        KC.TAB,    KC.UP,        KC.LEFT,  #4
     KC.U,  KC.I,     KC.O,   KC.P,      KC.LBRACKET, KC.RBRACKET, KC.BSLASH, KC.DOWN,      KC.RIGHT, #5
     KC.H,  KC.G,     KC.F,   KC.D,      KC.S,        KC.A,        KC.CAPS,   KC.NO,        KC.NO,    #6
     KC.J,  KC.K,     KC.L,   KC.SCOLON, KC.QUOTE,    KC.ENTER,    KC.PGDOWN, KC.NO,        KC.NO,    #7
     KC.N,  KC.B,     KC.V,   KC.C,      KC.X,        KC.Z,        KC.LSHIFT, KC.NO,        KC.NO,    #8
     KC.M,  KC.COMMA, KC.DOT, KC.SLASH,  KC.RSHIFT,   KC.DELETE,   KC.END,    KC.NO,        KC.NO]    #9
]

rgb = RGB(pixel_pin=board.GP0, num_pixels=82,
          animation_mode=AnimationModes.SWIRL,
          animation_speed=3)
keyboard.extensions.append(rgb)

if __name__ == '__main__':
    keyboard.go()