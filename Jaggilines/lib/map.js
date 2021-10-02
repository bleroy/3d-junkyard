// The map library for our fractal experiment
// (c) 2021 Bertrand Le Roy

'use strict';

import { rndEven, varyFromAverage } from './random.js';
import { bitsBetweenTops } from './settings.js';
import { mod, north, angleUnitPowerOfTwo } from './trigo.js';

/** Handler for map elevation changes.
 * @callback MapChangeHandler
 * @param {number} row - The row where the change happened.
 * @param {number} col - The column where the change happened.
 * @param {number} val - The new elevation value at (row, col). */

/** A random mountain map.
 * @property {number} size - The size of the map.
 */
class Map {
    /** The 2D array of elevations for this map.
     * First coordinate is the row, from north to south, the second the column, from west to east
     * 
     * 0 --> y
     * |
     * v
     * x
     * @type {Array<Array<number>>} */
    #map;

    /** The handlers to notify when elevation values change.
     * @type {MapChangeHandler[]} */
    #changeHandlers;

    /** Constructs a new map.
     * @param {number} size - The size of the map.
     * @param {number} maxHeight - The top height for mountains.
     * @param {InterpolationAlgorithm} interpolation - An interpolation algorithm to compute altitudes between summits. */
    constructor(size, maxHeight, interpolation) {
        this.size = size;
        this.maxHeight = maxHeight;
        this.interpolation = interpolation;
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

    /** Interpolates altitudes between summits.
     * @param {number} x - The x coordinate of the point.
     * @param {number} y - The y coordinate of the point.
     * @returns {number} The altitude at point (x, y). */
    interpolate(x, y) {
        // First find coordinates and altitudes of the map square surrounding (x, y).
        const row = x >> bitsBetweenTops;
        const col = y >> bitsBetweenTops;
        const tl = this.get(row, col);
        const tr = this.get(row, col + 1);
        const bl = this.get(row + 1, col);
        const br = this.get(row + 1, col + 1);
        // Then interpolate the altitude on both left and right sides of the square.
        const roundedX = row << bitsBetweenTops;
        const altL = this.#interpolate(x, roundedX, roundedX + 1 << bitsBetweenTops, tl, bl);
        const altR = this.#interpolate(x, roundedX, roundedX + 1 << bitsBetweenTops, tr, br);
        // Finally, interpolate between those two interpolated points to find the y altitude.
        const roundedY = col << bitsBetweenTops;
        return this.#interpolate(y, roundedY, roundedY + 1 << bitsBetweenTops, altL, altR);
    }

    /** Binary search a point's interpolation. */
    #interpolate(x, x1, x2, z1, z2, bisections = 0) {
        // Stop the recursion if x coincides with one of the bounds.
        if (x === x1) return z1;
        if (x === x2) return z2;
        
        // Otherwise, compute the interpolated altitude at the mid-point.
        const midX = (x1 + x2) >> 1;
        const midZ = this.interpolation(z1, z2, 0, 0, 0, bisections)[0];

        // And then bisect the interval further on the correct side.
        return x < midX ?
            this.#interpolate(x, x1, midX, z1, midZ, bisections + 1) :
            this.#interpolate(x, midX, x2, midZ, z2, bisections + 1);
    }

    /** Generates a random elevation at each node on the map. */
    generateDiamondSquare(maxDiamondSquareVariation, binary = true) {
        // Apply more or less [diamond-square algorithm](https://en.wikipedia.org/wiki/Diamond-square_algorithm)
        // There are better algorithms but that will do.
        // Seed the top-left corner
        this.set(0, 0, Math.random() * this.maxHeight);
        this.#diamond(0, 0, this.size);
        if (binary) {
            // Post-process to round everything to top or zero:
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    this.set(i, j, this.get(i, j) > this.maxHeight * 0.3 ? this.maxHeight : 0);
                }
            }
        }
    }

    #square(row, col, size, maxDiamondSquareVariation) {
        if (size <= 1) return;
        const halfSize = size >> 1;
        const height = varyFromAverage(
            [
                this.get(row - halfSize, col),
                this.get(row + halfSize, col),
                this.get(row, col + halfSize),
                this.get(row, col - halfSize)
            ],
            maxDiamondSquareVariation * size,
            this.maxHeight);
        this.set(row + halfSize, col + halfSize, height);
        this.#diamond(row, col, halfSize, maxDiamondSquareVariation);
        this.#diamond(row - halfSize, col, halfSize, maxDiamondSquareVariation);
    }

    #diamond(row, col, size, maxDiamondSquareVariation) {
        if (size <= 1) return;
        const halfSize = size >> 1;
        const halfSizex2 = halfSize << 1;
        const height = varyFromAverage(
            [
                this.get(row, col),
                this.get(row, col + halfSizex2),
                this.get(row + halfSizex2, col),
                this.get(row + halfSizex2, col + halfSizex2)
            ],
            maxDiamondSquareVariation * size,
            this.maxHeight);
        this.set(row + halfSize, col + halfSize, height);
        this.#square(row + halfSizex2, col + halfSize, size, maxDiamondSquareVariation);
        this.#square(row + halfSize, col + halfSizex2, size, maxDiamondSquareVariation);
    }

    /** Generates a maze-like map */
    generateMaze(mazeHoleiness) {
        // Prepare the ground state
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.set(i, j, 0);
            }
        }
        // Then, recursively add walls
        this.#mazeCell(0, 0, this.size, this.size, mazeHoleiness);
    }

    #mazeCell(x, y, w, h, mazeHoleiness) {
        if (w < 2 || h < 2) return;
        // draw two random walls
        const randX = 1 + rndEven(w);
        const randY = 1 + rndEven(h);
        for (let i = 0; i < w; i++) {
            this.set(x + i, y + randY, this.maxHeight);
        }
        for (let i = 0; i < h; i++) {
            this.set(x + randX, y + i, this.maxHeight);
        }
        // Punch random holes in those walls
        for (let i = 0; i < w * mazeHoleiness; i++) {
            this.set(x + rndEven(w), y + randY, 0);
        }
        for (let i = 0; i < h * mazeHoleiness; i++) {
            this.set(x + randX, y + rndEven(h), 0);
        }
        // Recurse
        this.#mazeCell(x, y, randX, randY, mazeHoleiness);
        this.#mazeCell(x + randX + 1, y, w - randX - 1, randY, mazeHoleiness);
        this.#mazeCell(x, y + randY + 1, randX, h - randY - 1, mazeHoleiness);
        this.#mazeCell(x + randX + 1, y + randY + 1, w - randX - 1, h - randY - 1, mazeHoleiness);
    }

    /** Generates a test map that gently slopes down from west to east and from north to south. */
    generateWestToEastAndNorthToSouthSlope() {
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                this.set(x, y, Math.floor(this.maxHeight * ((this.size << 1) - x - y) / (this.size << 1)));
            }
        }
    }

    /** Generates a test map that gently slopes down from west to east. */
    generateWestToEastSlope() {
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                this.set(x, y, Math.floor(this.maxHeight * (this.size - x) / this.size));
            }
        }
    }

    generatePlateau(height = this.maxHeight >> 1) {
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                this.set(x, y, height);
            }
        }
    }
}

/** An overhead visualization of an elevation map with the ship's position over it.
 * @property {HTMLCanvasElement} canvas - The canvas element where to draw the map.
 * @property {HTMLImageElement} shipImg - The img element that represents the ship.
 * @property {number} scalePowerOfTwo - The power of two for the distance in pixels between mountain tops on the map.
 * @property {Map} map - The map of the landscape to render.
 * @property {Valkyrie} ship - The ship object.
 * @property {HTMLElement} coordContainer - The element that contains the coordinate display.
 * @property {ColorScale} colorScale - The color scale to use to render the map.
 * @property {number} bitsBetweenTops - The power of two for the number of distance units between mountain tops.
 * @property {InterpolationAlgorithm} interpolation - An interpolation algorithm to compute altitudes between summits. */
class OverheadMap {
    #context;
    #pixelCanvas;
    #pixelContext;
    #shipEl;

    /** Build an overhead visualization of an elevation map over the provided canvas element.
     * @param {HTMLCanvasElement} canvas - The canvas element where to draw the map.
     * @param {HTMLImageElement} shipImg - The img element that represents the ship.
     * @param {number} scalePowerOfTwo - The power of two for the distance in pixels between mountain tops on the map.
     * @param {Map} map - The map of the landscape to render.
     * @param {Valkyrie} ship - The ship object.
     * @param {HTMLElement} coordContainer - The element that contains the coordinate display.
     * @param {ColorScale} colorScale - The color scale to use to render the map.
     * @param {number} bitsBetweenTops - The power of two for the number of distance units between mountain tops.
     * @param {InterpolationAlgorithm} interpolation - An interpolation algorithm to compute altitudes between summits. */
    constructor(canvas, shipImg, scalePowerOfTwo, map, ship, coordContainer, colorScale, bitsBetweenTops, interpolation) {
        canvas.width = canvas.height = map.size << scalePowerOfTwo;
        this.canvas = canvas;
        this.#context = canvas.getContext('2d');
        this.#context.imageSmoothingEnabled = false;
        const doc = canvas.ownerDocument;
        this.#pixelCanvas = doc.createElement('canvas');
        this.#pixelCanvas.width = 1;
        this.#pixelCanvas.height = 1;
        this.#pixelContext = this.#pixelCanvas.getContext('2d');
        this.#pixelContext.imageSmoothingEnabled = false;
        this.scalePowerOfTwo = scalePowerOfTwo;
        this.map = map;
        this.ship = ship;
        this.colorScale = colorScale;
        this.bitsBetweenTops = bitsBetweenTops;
        this.interpolation = interpolation;
        this.#shipEl = shipImg;
        this.coordContainer = coordContainer;
        this.moveShip();

        map.addChangeListener((row, col, val) => {
            this.#renderAround(row, col);
        });
        ship.addMoveListener(() => {
            this.moveShip();
        });
    }

    #paint(x, y, z) {
        const color = this.colorScale(z);
        this.#context.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
        this.#context.fillRect(y >> (bitsBetweenTops - this.scalePowerOfTwo), x >> (bitsBetweenTops - this.scalePowerOfTwo), 1, 1);
    }

    #renderAround(row, col) {
        const x = row << bitsBetweenTops;
        const y = col << bitsBetweenTops;

        const rowp1 = mod(row + 1, this.map.size);
        const colp1 = mod(col + 1, this.map.size);
        const rowm1 = mod(row - 1, this.map.size);
        const colm1 = mod(col - 1, this.map.size);

        const xm1 = rowm1 << bitsBetweenTops;
        const ym1 = colm1 << bitsBetweenTops;

        const center = this.map.get(row, col);
        const right = this.map.get(row, colp1);
        const left = this.map.get(row, colm1);
        const top = this.map.get(rowm1, col);
        const bottom = this.map.get(rowp1, col);
        const tl = this.map.get(rowm1, colm1);
        const tr = this.map.get(rowm1, colp1);
        const bl = this.map.get(rowp1, colm1);
        const br = this.map.get(rowp1, colp1);

        this.#paint(x, y, center);

        const peakDist = 1 << bitsBetweenTops;
        const halfPeakDist = peakDist >> 1;
        this.#square(tl, top, left, center, xm1 + halfPeakDist, ym1 + halfPeakDist, peakDist);
        this.#square(top, tr, center, right, xm1 + halfPeakDist, y + halfPeakDist, peakDist);
        this.#square(left, center, bl, bottom, x + halfPeakDist, ym1 + halfPeakDist, peakDist);
        this.#square(center, right, bottom, br, x + halfPeakDist, y + halfPeakDist, peakDist);
    }

    /** Draws mid-points for all sides of the square centered at (x, y) and of size size,
     * then recurses into the inner diamond. */
    #square(tl, tr, bl, br, x, y, size = 1 << bitsBetweenTops, bisections = 0) {
        if (bisections >= this.scalePowerOfTwo) return;
        const halfSize = size >> 1;
        const top = this.interpolation(tl, tr, 0, 0, 0, bisections)[0];
        this.#paint(x - halfSize, y, top);
        const left = this.interpolation(tl, bl, 0, 0, 0, bisections)[0];
        this.#paint(x, y - halfSize, left);
        const bottom = this.interpolation(br, bl, 0, 0, 0, bisections)[0];
        this.#paint(x + halfSize, y, bottom);
        const right = this.interpolation(br, tr, 0, 0, 0, bisections)[0];
        this.#paint(x, y + halfSize, right);
        this.#diamond(tl, tr, bl, br, top, left, bottom, right, x, y, size, bisections);
    }

    /** Draws the center of the diamond, then recurses into the inner squares. */
    #diamond(tl, tr, bl, br, top, left, bottom, right, x, y, size = 1 << bitsBetweenTops, bisections) {
        const halfSize = size >> 1;
        const quarterSize = halfSize >> 1;
        const center = this.interpolation(left, right, 0, 0, 0, bisections)[0];
        this.#paint(x, y, center);
        this.#square(tl, top, left, center, x - quarterSize, y - quarterSize, halfSize, bisections + 1);
        this.#square(top, tr, center, right, x - quarterSize, y + quarterSize, halfSize, bisections + 1);
        this.#square(left, center, bl, bottom, x + quarterSize, y - quarterSize, halfSize, bisections + 1);
        this.#square(center, right, bottom, br, x + quarterSize, y + quarterSize, halfSize, bisections + 1);
    }

    /** Update the position of the ship on the map. */
    moveShip() {
        this.#shipEl.style.top = ((this.ship.x << this.scalePowerOfTwo >> this.bitsBetweenTops) - (this.#shipEl.clientHeight >> 1)) + 'px';
        this.#shipEl.style.left = ((this.ship.y << this.scalePowerOfTwo >> this.bitsBetweenTops) - (this.#shipEl.clientWidth >> 1)) + 'px';
        this.#shipEl.style.transform = `rotate(${(north - this.ship.heading) >> angleUnitPowerOfTwo}deg)`;
        if (this.coordContainer) {
            const xEl = this.coordContainer.getElementsByClassName('coord-x')[0];
            const yEl = this.coordContainer.getElementsByClassName('coord-y')[0];
            if (xEl) xEl.innerHTML = (this.ship.x / (1 << this.bitsBetweenTops)).toFixed(2);
            if (yEl) yEl.innerHTML = (this.ship.y / (1 << this.bitsBetweenTops)).toFixed(2);
        }
}
}

export { Map, OverheadMap }