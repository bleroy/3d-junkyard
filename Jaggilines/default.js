'use strict';

// An experiment in rendering Rescue on Fractalus mountains on a web page
// (c) 2021 Bertrand Le Roy

// Self-imposed constraints:
// * The rendering algorithm must use only tools available to a 6502 processor, meaning avoiding
//   multiplications or floating point operations, preferring 16-bit addition, logical operations
//   and bitwise operations (The 6502 is 8-bit but 16-bit operations composition from 8-bit is easy enough).
// * Multiplication and division are acceptable if we strictly limit how many we do per frame.
//   See for example https://llx.com/Neil/a2/mult.html for 6502 multiplication and division implementations.
// * Valkyrie movement is also done using simple 16-bit arithmetic and lookup tables.
// * Math can be used to set-up the map and lookup tables.

/** Valkyrie 4 most-significant coordinate bits map to mountain summit map coordinates. */
const mapCoordinateBits = 4;

/** Number of bits of coordinates between mountain tops. */
const bitsBetweenTops = 12;

/** Valkyrie coordinates are 16-bit integers, with the 4 most-significant bits for map coordinates and the remaining 12 bits for in-cell coordinates. */
const coordinateBits = mapCoordinateBits + bitsBetweenTops;

/** The mountain summit map is 16 x 16. */
const mapSize = 1 << mapCoordinateBits;

/** The number of pixels on the map between peaks. */
const mapScale = 8;

/** The logical width of the viewport. */
const viewportWidth = 160;
/** The logical height of the viewport. */
const viewportHeight = 48;
/** The scale of the viewport from logical pixel to physical pixels on the page. */
const viewportScale = 4;

/** Vertically, mountains range up to 2^12 in height. */
const maxHeight = 1 << bitsBetweenTops;

/** Variations from summit to summit are at most maxHeight / 16. */
const maxVariation = maxHeight >> 4;

/** Default Valkyrie thrust, or number of distance units per tick. */
const defaultThrust = 1 << 5;

/** Base-2 log of the number of units of angle in a degree. For 2, the unit of angle is a fourth of a degree. */
const angleUnitPowerOfTwo = 2;

/** North direction in units of angle. */
const north = 90 << angleUnitPowerOfTwo;

/** East direction in units of angle. */
const east = 0 << angleUnitPowerOfTwo;

/** West direction in units of angle. */
const west = 180 << angleUnitPowerOfTwo;

/** South direction in units of angle. */
const south = 270 << angleUnitPowerOfTwo;

/** Number of units of angle in a half circle. */
const halfCircle = 180 << angleUnitPowerOfTwo;

/** Number of units of angle in a full circle. */
const fullCircle = 360 << angleUnitPowerOfTwo;

/** Number of milliseconds between runs of the game loop. */
const tick = 100;

// TODO: add a smoothness parameter that changes the probability distribution
// (rough is centered around 1, smooth is centered around 0)

/** Clamps the closest integer lower than the value between 0 and the max height
 * @param {number} val - The value to clamp.
 * @param {number} max - The maximum value.
 * @returns {number} The clamped value, between 0 and maxHeight. */
const clamp = (val, max = maxHeight) => val < 0 ? 0 : val > max ? max : Math.floor(val);

/** Adds a random variation to the value, then clamps the result.
 * @param {number} val - The value to vary around.
 * @param {number} varyBy - The maximum variation around val.
 * @returns {number} A new integer value that is a random number equal to val +/- at most varyBy and clamped between 0 and maxHeight. */
const vary = (val, varyBy = maxVariation) => clamp(val + Math.random() * 2 * varyBy - varyBy);

/** Adds a random variation around the average of the provided values, then clamps the result.
 * @param {number} val - The value to vary around.
 * @param {number} varyBy - The maximum variation around val.
 * @returns {number} A new integer value that is a random number equal to val +/- at most varyBy and clamped between 0 and maxHeight. */
 const varyFromAverage = (vals, varyBy = maxVariation) => vary(vals.reduce((acc, val) => acc + val, 0) / vals.length, varyBy);

/** A table of twelve bits of cos for each unit of angle */
const cos = [...new Array(fullCircle).keys()].map(angle => Math.floor(Math.cos(angle * Math.PI / halfCircle) * (1 << bitsBetweenTops)));

/** A table of twelve bits of sin for each unit of angle */
const sin = [...new Array(fullCircle).keys()].map(angle => Math.floor(Math.sin(angle * Math.PI / halfCircle) * (1 << bitsBetweenTops)));

/** Positive modulo.
 * @param {number} n - The number to get the modulo of.
 * @param {number} m - The modulo.
 * @returns {number} n modulo m (always between 0 and m). */
const mod = (n, m) => ((n % m) + m) % m;

/** Handler for map elevation changes.
 * @callback MapChangeHandler
 * @param {number} row - The row where the change happened.
 * @param {number} col - The column where the change happened.
 * @param {number} val - The new elevation value at (row, col). */

/** A random mountain map. */
class Map {
    /** The 2D array of elevations for this map.
     * @type {Array<Array<number>>} */
    #map;

    /** The handlers to notify when elevation values change.
     * @type {Array<MapChangeHandler>} */
    #changeHandlers;

    /** Constructs a new map.
     * @param {number} size - The size of the map. */
    constructor(size) {
        this.size = size;
        this.#changeHandlers = [];

        // Initialize empty map
        this.#map = Array(size).fill().map(_ => Array(size).fill(0));
    }

    /** Add a change listener.
     * @param {MapChangeHandler} handler - The change handler to add. */
    addChangeListener(handler) {
        this.#changeHandlers.push(handler);
    }

    /** Removes a change listener.
     * @param {MapChangeHandler} handler - The change handler to remove. */
     removeChangeListener(handler) {
        const i = this.#changeHandlers.indexOf(handler);
        if (i !== -1) {
            this.#changeHandlers.splice(i, 1);
        }
    }

    /** Gets the elevation at the specified coordinates.
     * @param {number} row - The row where to lookup the elevation.
     * @param {number} col - The column where to lookup the elevation.
     * @returns {number} The elevation at (row, col). */
    get(row, col) {
        return this.#map[mod(row, this.size)][mod(col, this.size)];
    }

    /** Sets the elevation at the specified coordinates and notifies listeners.
     * @param {number} row - The row where to set the elevation.
     * @param {number} col - The column where to set the elevation.
     * @param {number} val - The elevation to set at (row, col). */
    set(row, col, val) {
        val = Math.floor(val);
        row = mod(row, this.size);
        col = mod(col, this.size);
        this.#map[row][col] = val;
        this.#changeHandlers.forEach(handler => handler(row, col, val));
    }

    /** Generates a random elevation at each node on the map. */
    generate() {
        // Apply more or less [diamond-square algorithm](https://en.wikipedia.org/wiki/Diamond-square_algorithm)
        // There are better algorithms but that will do.
        // Seed the top-left corner
        this.set(0, 0, Math.random() * maxHeight);
        this.#diamond(0, 0, this.size);
    }

    #square(row, col, size) {
        if (size <= 1) return;
        const halfSize = size >> 1;
        this.set(row + halfSize, col + halfSize, varyFromAverage([
            this.get(row - halfSize, col),
            this.get(row + halfSize, col),
            this.get(row, col + halfSize),
            this.get(row, col - halfSize)], maxVariation * size));
            this.#diamond(row, col, halfSize);
            this.#diamond(row - halfSize, col, halfSize);
        }

    #diamond(row, col, size) {
        if (size <= 1) return;
        const halfSize = size >> 1;
        const halfSizex2 = halfSize << 1;
        this.set(row + halfSize, col + halfSize, varyFromAverage([
            this.get(row, col),
            this.get(row, col + halfSizex2),
            this.get(row + halfSizex2, col),
            this.get(row + halfSizex2, col + halfSizex2)], maxVariation * size));
        this.#square(row + halfSizex2, col + halfSize, size);
        this.#square(row + halfSize, col + halfSizex2, size);
    }
}

/** A color
 * @typedef {object} Color
 * @property {number} r - The red component of the color.
 * @property {number} g - The green component of the color.
 * @property {number} b - The blue component of the color. */

/** A function that maps an elevation to a color.
 * @callback ColorScale
 * @param {number} val - The elevation.
 * @returns {Color} - The color. */

/** An overhead visualization of an elevation map with the ship's position over it. */
class OverheadMap {
    #context;
    #pixelCanvas;
    #pixelContext;
    #shipEl;

    /** Build and overhead visualization of an elevation map over the provided canvas element.
     * @param {HTMLCanvasElement} canvas - The canvas element where to draw the map.
     * @param {HTMLImageElement} shipImg - The img element that represents the ship.
     * @param {number} scale - The distance in pixels between mountain tops on the map.
     * @param {Valkyrie} ship - The ship object.
     * @param {ColorScale} colorScale - The color scale to use to render the mape. */
    constructor(canvas, shipImg, scale, map, ship, colorScale) {
        this.canvas = canvas;
        this.#context = canvas.getContext('2d');
        this.#context.imageSmoothingEnabled = false;
        const doc = canvas.ownerDocument;
        this.#pixelCanvas = doc.createElement('canvas');
        this.#pixelCanvas.width = 1;
        this.#pixelCanvas.height = 1;
        this.#pixelContext = this.#pixelCanvas.getContext('2d');
        this.#pixelContext.imageSmoothingEnabled = false;
        this.scale = scale;
        this.map = map;
        this.colorScale = colorScale;
        this.ship = ship;
        this.#shipEl = shipImg;
        this.moveShip();

        map.addChangeListener((row, col, val) => {
            const color = this.colorScale(val);
            const pixelData = new Uint8ClampedArray([color.r, color.g, color.b, 255]);
            const pixelImageData = new ImageData(pixelData, 1, 1);
            this.#pixelContext.putImageData(pixelImageData, 0, 0);
            this.#context.drawImage(this.#pixelCanvas, row * scale, col * scale, scale, scale);
        });
        ship.addMoveListener(() => {
            this.moveShip();
        });
    }

    /** Update the position of the ship on the map. */
    moveShip() {
        // This isn't part of the reverse-engineering, so any math will do
        this.#shipEl.style.top = (this.ship.y / (1 << bitsBetweenTops) * this.scale - this.#shipEl.clientHeight / 2) + 'px';
        this.#shipEl.style.left = (this.ship.x / (1 << bitsBetweenTops) * this.scale - this.#shipEl.clientWidth / 2) + 'px';
        this.#shipEl.style.transform = `rotate(${(north - this.ship.heading) >> angleUnitPowerOfTwo}deg)`;
    }
}

/** Handler for ship movement.
 * @callback ShipMovementHandler
 * @param {number} row - The row where the change happened.
 * @param {number} col - The column where the change happened.
 * @param {number} val - The new elevation value at (row, col). */

/** Our ship.
 * @property {number} x - The x coordinate.
 * @property {number} y - The y coordinate.
 * @property {number} z - The z coordinate.
 * @property {number} thrust - The thrust.
 * @property {number} heading - The direction the ship is heading.
 * @property {number} pitch - The pitch angle of the ship. 0 means horizontal, positive values point up.
 * @property {number} roll - The roll angle of the ship. 0 means horizontal, positive values roll to the left.
 * @property {number} rollToAngle - The number of units of angle the ship's heading turns by on each tick per roll unit of angle.
 * This determines how quickly the ship turns when rolling. */
class Valkyrie {
    #moveHandlers;

    /** Create a new ship
     * @param {number} x - The initial x coordinate.
     * @param {number} y - The initial y coordinate.
     * @param {number} z - The initial z coordinate.
     * @param {number} thrust - The initial thrust.
     * @param {number} heading - The initial direction the ship is heading.
     * @param {number} pitch - The initial pitch angle of the ship. 0 means horizontal, positive values point up.
     * @param {number} roll - The initial roll angle of the ship. 0 means horizontal, positive values roll to the left.
     * @param {number} rollToAngle - The number of units of angle the ship's heading turns by on each tick per roll unit of angle.
     * This determines how quickly the ship turns when rolling.
     */
    constructor(x = (1 << coordinateBits) >> 1, y = (1 << coordinateBits) >> 1, z = maxHeight, thrust = defaultThrust, heading = north, pitch = 0, roll = 0, rollToAngle = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.thrust = thrust;
        this.heading = heading;
        this.pitch = pitch;
        this.roll = roll;
        this.rollToAngle = rollToAngle;
        this.#moveHandlers = [];
    }

    /** Add a listener for move events from this ship.
     * @param {ShipMovementHandler} handler - The event handler to add. */
    addMoveListener(handler) {
        this.#moveHandlers.push(handler);
    }

    /** Remove a move event listener.
     * @param {ShipMovementHandler} handler - The event handler to remove. */
     removeMoveListener(handler) {
        const i = this.#moveHandlers.indexOf(handler);
        if (i !== -1) {
            this.#moveHandlers.splice(i, 1);
        }
    }

    /** Perform the changes in ship state for the next tick. */
    move() {
        // TODO: handle mountain collision and top altitude
        this.heading = mod(this.heading + this.roll * this.rollToAngle, fullCircle);
        this.x = mod(this.x + ((this.thrust * cos[this.heading] * cos[this.pitch]) >> bitsBetweenTops >> bitsBetweenTops), 1 << coordinateBits);
        this.y = mod(this.y - ((this.thrust * sin[this.heading] * cos[this.pitch]) >> bitsBetweenTops >> bitsBetweenTops), 1 << coordinateBits);
        this.z = clamp(this.z + (this.thrust * sin[this.pitch]) >> bitsBetweenTops, 1 << coordinateBits);
        this.#moveHandlers.forEach(handler => handler(this));
    }
}

document.addEventListener('DOMContentLoaded', e => {
    const map = new Map(mapSize);
    const mapEl = document.getElementsByClassName('map')[0];
    mapEl.width = mapEl.height = mapSize * mapScale;
    const shipImg = document.getElementsByClassName('ship')[0];
    const ship = new Valkyrie();
    const overhead = new OverheadMap(mapEl, shipImg, mapScale, map, ship,
        val => ({
            r: Math.floor(0x68 + 0x80 * val / maxHeight),
            g: Math.floor(0x60 + 0x40 * val / maxHeight),
            b: Math.floor(0 + 0x40 * val / maxHeight)
        }));
    map.generate();

    const viewportEl = document.getElementById('viewport');
    viewportEl.width = viewportWidth * viewportScale;
    viewportEl.height = viewportHeight * viewportScale;

    setTimeout(gameLoop, tick);

    function gameLoop() {
        ship.move();
        setTimeout(gameLoop, tick);
    }
});
