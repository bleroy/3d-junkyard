/*
 * RGB LED controller for Decent keyboards
 * 
 * Copyright (c) 2026 Bertrand Le Roy

 * This is free software under the MIT license; see the license.txt file for more information.
 */

#include <stdlib.h>
#include <math.h>
#include <limits.h>
#include <Adafruit_NeoPixel.h>
#include <EEPROM.h>
#include <avr/pgmspace.h>

#define DECENTXE       // DecentXE Rainbow
// #define DECENTXE_LP     // DecentXE low-profile
// #define DECENTXL       // DecentXL Rainbow

// #define DIAGNOSTICS_MODE // Uncomment to get diagnostics on some of the LEDs

#define PIXEL_PIN           4
#define EFFECT_BTN_PIN      1
#define HUE_BTN_PIN         3

#define LONG_PRESS_DELAY    60
#define LONG_PRESS_INTERVAL 4
#define DEBOUNCE            2

enum effect
{
  OFF = 0,
  WHITE = 1,
  SOLID = 2,
  RAINBOW_GLOBAL = 3,
  RAINBOW_RTL = 4,
  RAINBOW_LTR = 5,
  RAINBOW_RADIAL = 6,
  BEACH_BALL = 7,
  GHOST_IN_THE_SHELL = 8,
  RANDOMIZED = 9
};
#define MAX_EFFECT 9

#define RED     0
#define YELLOW  6000
#define GREEN   12000
#define CYAN    18000
#define BLUE    24000
#define PURPLE  30000

#if defined DECENTXE
#define LED_COUNT 67
const uint8_t led_coords[LED_COUNT][2] PROGMEM = {
  { 255, 0 }, { 228, 0 }, { 201, 0 }, { 174, 0 }, { 148, 0 },
  { 0, 30 }, { 18, 30 }, { 36, 30 }, { 54, 30 }, { 72, 30 }, { 90, 30 }, { 107, 30 }, { 127, 30 }, { 143, 30 }, { 161, 30 }, { 179, 30 }, { 197, 30 }, { 215, 30 }, { 233, 30 }, { 251, 30 },
  { 246, 48 }, { 224, 48 }, { 206, 48 }, { 188, 48 }, { 170, 48 }, { 152, 48 }, { 134, 48 }, { 116, 48 }, { 99, 48 }, { 81, 48 }, { 63, 48 }, { 45, 48 }, { 27, 48 }, { 4, 48 },
  { 7, 66 }, { 31, 66 }, { 49, 66 }, { 67, 66 }, { 85, 66 }, { 103, 66 }, { 121, 66 }, { 139, 66 }, { 157, 66 }, { 175, 66 }, { 193, 66 }, { 210, 66 }, { 228, 66 }, { 249, 66 },
  { 251, 84 }, { 226, 84 }, { 202, 84 }, { 184, 84 }, { 166, 84 }, { 148, 84 }, { 130, 84 }, { 112, 84 }, { 94, 84 }, { 76, 84 }, { 58, 84 }, { 40, 84 }, { 16, 84 },
  { 76, 102 }, { 101, 102 }, { 125, 102 }, { 150, 102 }, { 175, 102 }, {180, 102}
};
#define CENTER_X 127
#define CENTER_Y 60
#define HEIGHT   102

#elif defined DECENTXE_LP
#define LED_COUNT 66
const uint8_t led_coords[LED_COUNT][2] PROGMEM = {
  { 255, 0 }, { 228, 0 }, { 201, 0 }, { 174, 0 }, { 148, 0 },
  { 0, 30 }, { 18, 30 }, { 36, 30 }, { 54, 30 }, { 72, 30 }, { 90, 30 }, { 107, 30 }, { 127, 30 }, { 143, 30 }, { 161, 30 }, { 179, 30 }, { 197, 30 }, { 215, 30 }, { 242, 30 },
  { 249, 57 }, {237, 46}, { 224, 48 }, { 206, 48 }, { 188, 48 }, { 170, 48 }, { 152, 48 }, { 134, 48 }, { 116, 48 }, { 99, 48 }, { 81, 48 }, { 63, 48 }, { 45, 48 }, { 27, 48 }, { 4, 48 },
  { 7, 66 }, { 31, 66 }, { 49, 66 }, { 67, 66 }, { 85, 66 }, { 103, 66 }, { 121, 66 }, { 139, 66 }, { 157, 66 }, { 175, 66 }, { 193, 66 }, { 210, 66 }, { 228, 66 },
  { 251, 84 }, { 226, 84 }, { 202, 84 }, { 184, 84 }, { 166, 84 }, { 148, 84 }, { 130, 84 }, { 112, 84 }, { 94, 84 }, { 76, 84 }, { 58, 84 }, { 40, 84 }, { 11, 84 },
  {57, 102}, {72, 102}, { 99, 102 }, { 125, 102 }, { 152, 102 }, { 178, 102 }, { 194, 102 }
};
#define CENTER_X 127
#define CENTER_Y 60
#define HEIGHT   102

#elif defined DECENTXL
// TODO Add DecentXL board LED layout
#endif

uint8_t  base_wheel = 0;
uint32_t base_color = 0;
uint32_t frame = 0;
int effect_btn_pressed = -1;
int hue_btn_pressed = -1;

#define MAX_HUE         36000
#define MAX_SPEED       5
#define MAX_BRIGHTNESS  255

// Initial settings; these can be changed at runtime through the buttons and will be saved to EEPROM on change
struct Settings {
  uint16_t checksum;
  enum effect effect;
  uint8_t speed; // 1-8
  uint8_t brightness;
  uint16_t hue;
};

uint16_t settingsChecksum(Settings settings)
{
  return settings.hue + settings.brightness + settings.speed + settings.effect;
}

Settings settings = {0, RAINBOW_RADIAL, 3, MAX_BRIGHTNESS >> 3, PURPLE};

unsigned long lastSettingsUpdate = 0; // never
#define SETTINGS_PERISTENCE_DELAY 3000 // ms

Adafruit_NeoPixel pixels = Adafruit_NeoPixel(LED_COUNT, PIXEL_PIN);

// Converts a hue in hundredths of degrees (0-36000)) to an RGB pixel color
uint32_t hue(uint16_t hue) 
{
  return pixels.ColorHSV(((uint32_t)hue << 16) / MAX_HUE, 255, 255);
}

// Converts RGB components into a pixel color
uint32_t rgb(uint8_t r, uint8_t g, uint8_t b)
{
  return pixels.Color(r, g, b);
}

// Some global state used by animations
#define SPRITE_COUNT 8
uint16_t sprites_x[SPRITE_COUNT];
uint16_t sprites_y[SPRITE_COUNT];
uint32_t diag_state = hue(CYAN);

void setup() 
{
  srand(millis());
  // Set the pin modes and pullups
  pinMode(PIXEL_PIN, OUTPUT);
  pinMode(EFFECT_BTN_PIN, INPUT_PULLUP);
  pinMode(HUE_BTN_PIN, INPUT_PULLUP);

  // Start up the NeoPixels
  pixels.begin();
  pixels.setBrightness(settings.brightness);

  // Init the sprites;
  for (int i=0; i < SPRITE_COUNT; i++)
  {
    sprites_x[i] = INT_MIN;
    sprites_y[i] = INT_MIN;
  }

  // Read settings from EEPROM
  Settings epromSettings;
  EEPROM.get(0, epromSettings);
  if (epromSettings.checksum == settingsChecksum(epromSettings))
  {
    settings = epromSettings;
  }
  else
  {
    diag_state = hue(RED);
  }
}

void loop() 
{
  uint16_t moment = frame * (1 << settings.speed);
  switch(settings.effect)
  {
    case OFF:
      paintSolid(rgb(0, 0, 0));
      break;
    case WHITE:
      paintSolid(rgb(255, 255, 255));
      break;
    case SOLID:
      paintSolid(hue(settings.hue));
      break;
    case RANDOMIZED:
      if (frame % (1 << (MAX_SPEED - settings.speed + 1)) == 0)
      {
        pixels.setPixelColor(rand() % LED_COUNT, hue(rand() % MAX_HUE));
      }
      break;
    case RAINBOW_GLOBAL:
      for(int i=0; i < LED_COUNT; i++) 
      {
        pixels.setPixelColor(i, hue(((moment >> 2) * MAX_HUE / 3600) % MAX_HUE));
      }
      break;
    case RAINBOW_RTL:
      for(int i=0; i < LED_COUNT; i++)
      {
        uint16_t x = fetchCoord(i, 0);
        pixels.setPixelColor(i, hue((((moment >> 2) + 255 + x) * MAX_HUE / 255) % MAX_HUE));
      }
      break;
    case RAINBOW_LTR:
      for(int i=0; i < LED_COUNT; i++)
      {
        uint8_t x = fetchCoord(i, 0);
        pixels.setPixelColor(i, hue((((moment >> 2) + 255 - x) * MAX_HUE / 255) % MAX_HUE));
      }
      break;
    case RAINBOW_RADIAL:
      for(int i=0; i < LED_COUNT; i++)
      {
        float x = fetchCoord(i, 0) - CENTER_X;
        float y = fetchCoord(i, 1) - CENTER_Y;
        uint8_t distFromCenter = sqrt(x*x + y*y);
        pixels.setPixelColor(i, hue((((moment >> 2) + 255 - distFromCenter) * MAX_HUE / 255) % MAX_HUE));
      }
      break;
    case BEACH_BALL:
      for(int i=0; i < LED_COUNT; i++)
      {
        float x = 0.0 + fetchCoord(i, 0) - CENTER_X;
        float y = 0.0 + fetchCoord(i, 1) - CENTER_Y;
        uint16_t angle = atan2f(y, x) * MAX_HUE / M_PI + MAX_HUE;
        pixels.setPixelColor(i, hue(((angle >> 1) + (moment << 4)) % MAX_HUE));
      }
      break;
    case GHOST_IN_THE_SHELL:
      // Look for a droplet that is not already falling every 5 cycles, move the others down
      bool foundEmpty = false;
      for (int i=0; i < SPRITE_COUNT; i++)
      {
        int sprite_x = sprites_x[i];
        int sprite_y = sprites_y[i];
        if (frame % 5 == 0 && !foundEmpty && sprite_x == INT_MIN)
        {
          sprite_x = sprites_x[i] = rand() % 2040;
          sprite_y = sprites_y[i] = -(rand() % 800);
          foundEmpty = true;
        }
        if (sprite_x != INT_MIN)
        {
          sprite_y = sprites_y[i] = sprite_y + (1 << settings.speed);
          if (sprite_y > (HEIGHT << 3) + 300)
          {
            sprites_x[i] = INT_MIN;
            sprites_y[i] = INT_MIN;
          }
        }
      }
      // Scan the LEDs and light them up depending on droplet proximity
      for(int i=0; i < LED_COUNT; i++)
      {
        int intensity = 10;
        int x = fetchCoord(i, 0) << 3;
        int y = fetchCoord(i, 1) << 3;
        for (int j=0; j < SPRITE_COUNT; j++)
        {
          int sprite_x = sprites_x[j];
          int sprite_y = sprites_y[j];
          if (abs(sprite_x - x) < 72 && y < sprite_y && y + 720 > sprite_y)
          {
            intensity += ((y - sprite_y) >> 1) + 240;
          }
        }
        pixels.setPixelColor(i, rgb(0, (uint8_t)(intensity > 255 ? 255 : intensity), 0));
      }
      break;
    default:
      paintSolid(rgb(0, 0, 0));
      break;
  }

  // Read the buttons
  int effect_btn_state = digitalRead(EFFECT_BTN_PIN);
  if (effect_btn_state == LOW)
  {
    effect_btn_pressed++;
    if (effect_btn_pressed > LONG_PRESS_DELAY)
    {
      // Long press -> cycle brightness
      if (effect_btn_pressed % LONG_PRESS_INTERVAL == 0)
      {
        settings.brightness = (settings.brightness + 1) % MAX_BRIGHTNESS;
        pixels.setBrightness(settings.brightness);
        lastSettingsUpdate = millis();
      }
    }
  }
  else
  {
    if (effect_btn_pressed > DEBOUNCE && effect_btn_pressed < LONG_PRESS_DELAY)
    {
      // Short press -> cycle effects
      settings.effect = (settings.effect + 1) % (MAX_EFFECT + 1);
      lastSettingsUpdate = millis();
    }
    effect_btn_pressed = -1;
  }
  
  int hue_btn_state = digitalRead(HUE_BTN_PIN);
  if (hue_btn_state == LOW)
  {
    hue_btn_pressed++;
    if (hue_btn_pressed > LONG_PRESS_DELAY)
    {
      // Long press -> cycle hue one degree at a time
      if (hue_btn_pressed % LONG_PRESS_INTERVAL == 0)
      {
        settings.hue = (settings.hue + MAX_HUE / 360) % MAX_HUE;
        lastSettingsUpdate = millis();
      }
    }
  }
  else
  {
    if (hue_btn_pressed > DEBOUNCE && hue_btn_pressed < LONG_PRESS_DELAY)
    {
      // Short press -> cycle speed
      settings.speed = (settings.speed + 1) % MAX_SPEED;
      lastSettingsUpdate = millis();
    }
    hue_btn_pressed = -1;
  }

  if (lastSettingsUpdate != 0)
  {
    diag_state = hue(YELLOW);
  }
  // Persist settings if there's been a change, after a delay, to avoid writing to the EEPROM too frequently
  if (lastSettingsUpdate != 0 && millis() - lastSettingsUpdate > SETTINGS_PERISTENCE_DELAY) {
    settings.checksum = settingsChecksum(settings);
    EEPROM.put(0, settings);
    lastSettingsUpdate = 0;
    diag_state = hue(GREEN);
  }

  #ifdef DIAGNOSTICS_MODE
  pixels.setPixelColor(0, diag_state);
  pixels.setPixelColor(1, hue(MAX_HUE * settings.effect / MAX_EFFECT));
  pixels.setPixelColor(2, hue(MAX_HUE * settings.brightness / MAX_BRIGHTNESS));
  pixels.setPixelColor(3, hue(settings.hue));
  pixels.setPixelColor(4, hue(MAX_HUE * settings.speed / MAX_SPEED));

  // Color refs on the top row
  pixels.setPixelColor(5, hue(RED));
  pixels.setPixelColor(6, hue(YELLOW));
  pixels.setPixelColor(7, hue(GREEN));
  pixels.setPixelColor(8, hue(CYAN));
  pixels.setPixelColor(9, hue(BLUE));
  pixels.setPixelColor(10, hue(PURPLE));
  #endif

  // Display the frame and advance it
  pixels.show();
  frame = frame < UINT16_MAX ? frame + 1 : 0;
}


void paintSolid(uint32_t c) 
{
  for(int i=0; i < LED_COUNT; i++) 
  {
      pixels.setPixelColor(i, c);
  }
}

uint8_t fetchCoord(int led, int coord) {
  return pgm_read_byte(&(led_coords[led][coord]));
}
