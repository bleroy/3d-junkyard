// Copyright 2026 B. Le Roy
// SPDX-License-Identifier: GPL-2.0-or-later

#include "quantum.h"

static void render_logo(void) {
    static const char PROGMEM qmk_logo[] = {
        // 0     1     2     3     4     5     6     7     8     9    10    11    12    13    14    15    16    17    18    19    20
        0x20, 0x81, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8A, 0x8B, 0x8C, 0x8D, 0x8E, 0x8F, 0x90, 0x91, 0x92, 0x93, 0x94,
        0xA0, 0xA1, 0xA2, 0xA3, 0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xAB, 0xAC, 0xAD, 0xAE, 0xAF, 0xB0, 0xB1, 0xB2, 0xB3, 0x20,
        0x20, 0x20, 0x20, 0x20, 0x20, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9, 0xCA, 0xCB, 0xCC, 0xCD, 0xCE, 0xCF, 0xD0, 0xD1, 0xD2, 0x20, 0x20,
        0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0xBC, 0xBD, 0xBE, 0xBF,
        0x00
    };

   oled_write_P(qmk_logo, false);
   oled_write_pixel(126, 0, 1);
   oled_write_pixel(127, 0, 1);
   oled_write_pixel(126, 1, 1);
}

static const char PROGMEM caps_on[] = { 0x9C, 0x9D, 0x9E, 0x9F };
static const char PROGMEM caps_off[] = { 0xBC, 0xBD, 0xBE, 0xBF };

static int frame = 0;

bool process_record_kb(uint16_t keycode, keyrecord_t *record) {
    const uint8_t mods = get_mods();
    if ((mods & MOD_MASK_CG) && record->event.pressed) {
        switch (keycode) {
            case KC_1:
                rgb_matrix_toggle();
                return false;
            case KC_W:
                rgb_matrix_increase_val();
                return false;
            case KC_S:
                rgb_matrix_decrease_val();
                return false;
            case KC_X:
                rgb_matrix_increase_hue();
                return false;
            case KC_UP:
                rgb_matrix_step();
                return false;
            case KC_DOWN:
                rgb_matrix_step_reverse();
                return false;
            case KC_LEFT:
                rgb_matrix_increase_speed();
                return false;
            case KC_RIGHT:
                rgb_matrix_decrease_speed();
                return false;
            default:
                return true;
        }
    }
    return true;
}

bool oled_task_kb(void) {
    if (!oled_task_user()) {
        return false;
    }

    render_logo();

    bool caps = host_keyboard_led_state().caps_lock;

    if (caps) {
        oled_set_cursor(17, 3);
        oled_write_P(caps ? caps_on : caps_off, false);
    }
    return false;
}

bool rgb_matrix_indicators_advanced_kb(uint8_t led_min, uint8_t led_max) {
    if (!rgb_matrix_indicators_advanced_user(led_min, led_max)) {
        return false;
    }

    // Power LED
    rgb_matrix_set_color(5, 13, 1, 21);

    // Logo LED animation
    for(int i = 0; i < 5; i++) {
        rgb_t rgb = hsv_to_rgb((hsv_t){(i * 32 + (frame >> 2)) % 255, 255, 64});
        rgb_matrix_set_color(i, rgb.r, rgb.g, rgb.b);
    }
    frame++;
    if (frame > 1024) frame = 0;

    // Paint the keyboard red if caps is active
    bool caps = host_keyboard_led_state().caps_lock;

    if (caps) {
        for (uint8_t i = led_min; i < led_max; i++) {
            if (g_led_config.flags[i] & LED_FLAG_KEYLIGHT) {
                rgb_matrix_set_color(i, RGB_RED);
            }
        }
    }

    return false;
}
