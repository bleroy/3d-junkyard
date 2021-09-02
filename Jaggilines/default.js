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
/** The power of two for the scale of the viewport from logical pixel to physical pixels on the page (2 -> x4 physical pixels). */
const viewportScalePowerOfTwo = 2;

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
const east = 0;

/** West direction in units of angle. */
const west = 180 << angleUnitPowerOfTwo;

/** South direction in units of angle. */
const south = 270 << angleUnitPowerOfTwo;

/** Number of units of angle in a quarter of a circle. */
const quarterCircle = 90 << angleUnitPowerOfTwo;

/** Number of units of angle in a half circle. */
const halfCircle = 180 << angleUnitPowerOfTwo;

/** Number of units of angle in a full circle. */
const fullCircle = 360 << angleUnitPowerOfTwo;

/** The color of the sky. */
let skyColor = {r: 243, g: 143, b: 101};

/** The color of mountains. */
let mountainColor = {r: 130, g: 60, b: 0};

/** The color of the separation between two mountains. */
let mountainEdgeColor = {r: 60, g: 0, b: 0}

/** Number of milliseconds between runs of the game loop. */
const tick = 32;

/** The number of ticks since the game started running. */
let frame = 0;

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
const vary = (val, varyBy = maxVariation, max = maxHeight) => clamp(val + Math.random() * 2 * varyBy - varyBy, max);

/** Adds a random variation around the average of the provided values, then clamps the result.
 * @param {number} val - The value to vary around.
 * @param {number} varyBy - The maximum variation around val.
 * @returns {number} A new integer value that is a random number equal to val +/- at most varyBy and clamped between 0 and maxHeight. */
 const varyFromAverage = (vals, varyBy = maxVariation) => vary(vals.reduce((acc, val) => acc + val, 0) / vals.length, varyBy);

/** A table of twelve bits of cos for each unit of angle. */
const cosTable = [...new Array(fullCircle).keys()].map(angle => Math.floor(Math.cos(angle * Math.PI / halfCircle) * (1 << bitsBetweenTops)));

/** The cosinus of an angle in local units, expressed as a signed 12-bit integer.
 * @param {number} angle - The angle in local units of angle.
 * @returns {number} the cosinus of the angle as a signed 12-bit integer. */
const cos = angle => cosTable[mod(angle, fullCircle)];

/** A table of twelve bits of sin for each unit of angle. */
const sinTable = [...new Array(fullCircle).keys()].map(angle => Math.floor(Math.sin(angle * Math.PI / halfCircle) * (1 << bitsBetweenTops)));

/** The sinus of an angle in local units, expressed as a signed 12-bit integer.
 * @param {number} angle - The angle in local units of angle.
 * @returns {number} the sinus of the angle as a signed 12-bit integer. */
 const sin = angle => sinTable[mod(angle, fullCircle)];

/** A table of fixed-point 16 bits of tangents for each unit of angle between west and north (north excluded, since tan is infinity there).
 * The fractional point is at 8 bits: [8 bits 15-8 integral part][8 bits 7-0 fractional part]. */
// The resulting table has 360 entries, meaning a binary search is at most 9 steps.
// The value of the highest finite tan angle with our precision of 1/4 degree is 89.75 degrees, and tan(89.75deg) = 229.18,
// requiring 8 bits to store the integral part. If we store the tan values over 16 bits, we can multiply by 256.
// Entries are then between 0 and 56871, requiring 16 bits to encode.
// Example: tan(45deg) = 1. 45 degrees are encoded as 180 (45 << 2), so the entry for index 180 should be close to the fixed-point
// value for 1, which is 1 << 8 = 256.
const tanTable = [...new Array(fullCircle >> 2).keys()].map(angle => Math.round(Math.tan(angle * Math.PI / halfCircle) * (1 << 8)));

/** The tangent of an angle in local units, expressed as a signed 16-bit integer.
 * @param {number} angle - The angle in local units of angle.
 * @returns {number} the sinus of the angle as a signed 12-bit integer. */
const tan = angle => {
    if ((angle - quarterCircle) % halfCircle === 0) {
        return undefined;
    }
    const clampedAngle = mod(angle, halfCircle); // The period of tan is π/2
    const tableIndex = (clampedAngle > quarterCircle ? halfCircle - clampedAngle : clampedAngle);
    const absResult = tanTable[tableIndex];
    return clampedAngle > quarterCircle ? - absResult : absResult;
}

/** Maps coordinates to angles
 * @param {number} x - The horizontal coordinate.
 * @param {number} y - The vertical coordinate.
 * @returns {number} The angle corresponding to those coordinates. */
const angleFromCoordinates = (x, y) => {
    if (x == 0) return (y > 0) ? north : south;
    // We'll map the negative-x or negative-y quadrants by using the symmetries of the tan function when processing the resulting angle.
    const absX = Math.abs(x);
    const absY = Math.abs(y);
    // We need a fixed-point 16 bit ratio with 9 bits of fractional part to map. Anything above that is infinity.
    if (absY > absX << 8) return (y > 0) ? north : south; // |y| / |x| > 1 << 8
    // We have to divide here, but we'll do so a fixed number of times per frame: for mountain tops in the field of view.
    // The rest will be interpolated.
    // We could even optimize and compute angles for the leftmost and rightmost mountains in the field of view for each row from the ship,
    // and then interpolate the rest. Since we're not as resource-constrained as coders of the time, we can leave this as an exercise
    // to the reader and simplify the code, knowing that this optimization would be possible.
    const ratio = Math.round((absY << 8) / absX); // The result is a 16 bit integer: |y| / |x| <= 1 << 8 so |y| << 8 / |x| <= 1 << 16
    const angle = findIndexOf(ratio, tanTable);
    return x > 0 ?
        y > 0 ? angle : fullCircle - angle :
        y > 0 ? halfCircle - angle : halfCircle + angle;
};

/** Find the index of the value in the table that's closest to the provided value.
 * @param {number} val - The value to search for.
 * @param {number[]} table - The table in which to search. Values in the table must be in order.
 * @returns {number} The index of the closest value in the table. */
const findIndexOf = (val, table) => {
    let low = 0;
    let high = table.length - 1
    while (true) {
        if (high - low === 1) {
            return table[high] <= val ? high : low;
        }
        const mid = (low + high) >> 1;
        if (table[mid] === val) return mid;
        if (val < table[mid]) high = mid;
        else low = mid;
    }
};

/** Positive modulo.
 * @param {number} n - The number to get the modulo of.
 * @param {number} m - The modulo.
 * @returns {number} n modulo m (always between 0 and m). */
const mod = (n, m) => ((n % m) + m) % m;

/** Computes the difference between two angles.
 * @param {number} a - The first angle.
 * @param {number} b - The angle to subtract.
 * @returns {number} The angle `a - b`.
 */
const angleSub = (a, b) => mod(a - b, fullCircle);

/** Converts an angle from to [0, fullCircle] range to the [-halfCircle, halfCircle] range.
 * @param {number} angle - The angle to convert.
 * @returns {number} an angle between -halfCircle and halfCircle. */
const angleToAlgebraic = angle => angle > halfCircle ? angle - fullCircle : angle;

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
     * @type {Array<Array<number>>} */
    #map;

    /** The handlers to notify when elevation values change.
     * @type {MapChangeHandler[]} */
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

/** An overhead visualization of an elevation map with the ship's position over it.
 * @property {HTMLCanvasElement} canvas - The canvas element where to draw the map.
 * @property {HTMLImageElement} shipImg - The img element that represents the ship.
 * @property {number} scale - The distance in pixels between mountain tops on the map.
 * @property {Map} map - The map of the landscape to render.
 * @property {Valkyrie} ship - The ship object.
 * @property {ColorScale} colorScale - The color scale to use to render the map.
 */
class OverheadMap {
    #context;
    #pixelCanvas;
    #pixelContext;
    #shipEl;

    /** Build an overhead visualization of an elevation map over the provided canvas element.
     * @param {HTMLCanvasElement} canvas - The canvas element where to draw the map.
     * @param {number} scale - The distance in pixels between mountain tops on the map.
     * @param {Map} map - The map of the landscape to render.
     * @param {Valkyrie} ship - The ship object.
     * @param {ColorScale} colorScale - The color scale to use to render the map. */
    constructor(canvas, shipImg, scale, map, ship, colorScale) {
        canvas.width = canvas.height = map.size * scale;
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

/** A viewport that can render the 3D subjective view from the ship.
 * @property {HTMLCanvasElement} canvas - The canvas element where to draw the view.
 * @property {number} width - The width of the viewport in logical pixels.
 * @property {number} height - The height of the viewport in logical pixels.
 * @property {number} scalePowerOfTwo - The power of two that gives the physical pixel size of a logical viewport pixel.
 * @property {Map} map - The map of the landscape to render.
 * @property {Valkyrie} ship - The ship object. */
class Viewport {
    #context;
    #skyPixel;
    #mountainPixel;
    #mountainEdgePixel;
    #topHeights;

    /** Build a 3D viewport over the provided canvas element.
     * @param {HTMLCanvasElement} canvas - The canvas element where to draw the view.
     * @param {number} width - The width of the viewport in logical pixels.
     * @param {number} height - The height of the viewport in logical pixels.
     * @param {number} scalePowerOfTwo - The power of two that gives the physical pixel size of a logical viewport pixel.
     * @param {Map} map - The map of the landscape to render.
     * @param {Valkyrie} ship - The ship object. */
     constructor(canvas, width, height, scalePowerOfTwo, map, ship) {
        this.width = width;
        this.height = height;
        canvas.width = width << scalePowerOfTwo;
        canvas.height = height << scalePowerOfTwo;
        this.canvas = canvas;
        this.#context = canvas.getContext('2d');
        this.#context.imageSmoothingEnabled = false;
        const doc = canvas.ownerDocument;
        this.scalePowerOfTwo = scalePowerOfTwo;
        this.map = map;
        this.ship = ship;

        // Prepare pixel data for each of the colors we need to render
        this.#skyPixel = this.#preparePixel(doc, skyColor);
        this.#mountainPixel = this.#preparePixel(doc, mountainColor);
        this.#mountainEdgePixel = this.#preparePixel(doc, mountainEdgeColor);
        
        // Trigger the first rendering
        this.draw();

        ship.addMoveListener(() => {
            this.draw();
        });
    }

    #preparePixel(doc, color) {
        const pixelCanvas = doc.createElement('canvas');
        pixelCanvas.width = pixelCanvas.height = 1;
        const pixelContext = pixelCanvas.getContext('2d');
        pixelContext.imageSmoothingEnabled = false;
        const pixelData = new Uint8ClampedArray([color.r, color.g, color.b, 255]);
        const pixelImageData = new ImageData(pixelData, 1, 1);
        pixelContext.putImageData(pixelImageData, 0, 0);
        return pixelCanvas;
    }

    /** Draws a column of pixels representing a slice of mountain.
     * Can be called repeatedly for successive mountains from closest to farthest.
     * @param {number} x - the logical pixel column to render.
     * @param {number} mountainTop - the height of the mountain in logical pixels from the bottom of the viewport.
     */
    drawMountainColumn(x, mountainTop) {
        if (this.#topHeights[x]  === -1) { // First mountain we're drawing on this column.
            this.#context.drawImage(this.#skyPixel, x << this.scalePowerOfTwo, 0, 1 << this.scalePowerOfTwo, (this.height - mountainTop) << this.scalePowerOfTwo);
            this.#context.drawImage(this.#mountainPixel, x << this.scalePowerOfTwo, (this.height - mountainTop) << this.scalePowerOfTwo, 1 << this.scalePowerOfTwo, mountainTop << this.scalePowerOfTwo);
            this.#topHeights[x] = mountainTop;
        }
        else if (mountainTop >= this.#topHeights[x] ) { // New mountain (that is farther) is taller -> extend previous.
            this.#context.drawImage(this.#mountainEdgePixel, x << this.scalePowerOfTwo, (this.height - this.#topHeights[x]) << this.scalePowerOfTwo, 1 << this.scalePowerOfTwo, 1 << this.scalePowerOfTwo);
            this.#context.drawImage(this.#mountainPixel, x << this.scalePowerOfTwo, (this.height - mountainTop) << this.scalePowerOfTwo, 1 << this.scalePowerOfTwo, (mountainTop - this.#topHeights[x]) << this.scalePowerOfTwo);
            this.#topHeights[x] = mountainTop;
        }
        // Otherwise, everything is hidden, do nothing.
    }

    #drawMapPointScreenColumn(x, y, dist)
    {
        // dist is a very rough approximation of the distance of the peaks we're drawing since we've
        // been drawing concentric squares around the ship rather than circles. The result is that the
        // calculated height of mountains will be less precise at 45 degree angles.
        const absAngle = angleFromCoordinates((x << bitsBetweenTops) - this.ship.x, this.ship.y - (y << bitsBetweenTops));
        const azimuth = angleToAlgebraic(angleSub(absAngle, this.ship.heading)) >> angleUnitPowerOfTwo;
        const screenCol = azimuth + (this.width >> 1);
        const altitude = angleToAlgebraic(angleFromCoordinates(dist << bitsBetweenTops, this.map.get(x, y) - this.ship.z)) >> angleUnitPowerOfTwo;
        const screenRow = (this.height >> 1) - altitude;
        if (screenCol >= 0 && screenCol < this.width) {
            this.drawMountainColumn(screenCol, screenRow);
        }
        // need to return the screen coordinates for the summits so we can reuse and interpolate between them.
        return { row: screenRow, col: screenCol };
    }

    /** Draw a frame. */
    draw() {
        // Clear the canvas first, although this will no longer be necessary once rendering code is complete since the whole screen
        // gets redrawn on every frame.
        this.#context.clearRect(0, 0, this.width << viewportScalePowerOfTwo, this.height << viewportScalePowerOfTwo);
        this.#topHeights = new Array(this.width).fill(-1);
        const [xMap, yMap] = [this.ship.x >> bitsBetweenTops, this.ship.y >> bitsBetweenTops];
        for (let dist = 1; dist < 5; dist++) {
            for (let i = -dist; i <= dist; i++) {
                this.#drawMapPointScreenColumn(xMap - dist, yMap + i, dist);
                this.#drawMapPointScreenColumn(xMap + dist, yMap + i, dist);
                this.#drawMapPointScreenColumn(xMap + i, yMap - dist, dist);
                this.#drawMapPointScreenColumn(xMap + i, yMap + dist, dist);
            }
        }
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
    constructor(x = (1 << coordinateBits) >> 1, y = (1 << coordinateBits) >> 1, z = maxHeight >> 1, thrust = defaultThrust, heading = north, pitch = 0, roll = 0, rollToAngle = 1) {
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
        this.x = mod(this.x + ((this.thrust * cosTable[this.heading] * cosTable[this.pitch]) >> bitsBetweenTops >> bitsBetweenTops), 1 << coordinateBits);
        this.y = mod(this.y - ((this.thrust * sinTable[this.heading] * cosTable[this.pitch]) >> bitsBetweenTops >> bitsBetweenTops), 1 << coordinateBits);
        this.z = clamp(this.z + (this.thrust * sinTable[this.pitch]) >> bitsBetweenTops, 1 << coordinateBits);
        this.#moveHandlers.forEach(handler => handler(this));
    }
}

/** Creates an element of the supplied tag type and with the specified attributes.
 * @param {HTMLElement} parentEl - A parent element to append the new element to.
 * @param {string} tag - The tag name.
 * @param {object} attr - An object containing all the attributes to set on the element.
 * @returns {HTMLElement} The new element. */
 const createEl = (parentEl, tag, attr) => {
    const el = parentEl.ownerDocument.createElement(tag);
    if (attr) {
        for (let option in attr) {
            if (option === '_') el.innerHTML = attr[option];
            else el[option] = attr[option];
        }
    }
    parentEl.appendChild(el);
    return el;
}

/** Creates a function that appends a graph to the supplied element.
 * @param {HTMLElement} parentEl - The parent element to which the returned function will append graphs.
 * @returns {TestGrapher} - A function that can append a graph to the provided parent element. */
const graphTester = parentEl =>
    /** Graphs a function.
     * @callback TestGrapher
     * @param {Function} fn - The function to graph.
     * @param {number[]} xRange - A two elements array containing the lower and higher ends of the x range to graph.
     * @param {number[]} yRange - A two elements array containing the lower and higher ends of the y range to graph.
     * @param {number} scaleX - The scale to apply on the X axis.
     * @param {number} scaleY - The scale to apply on the Y axis.
     * @param {string} title - An optional title for the graph. If not provided, tha name of the function is used. */
    (fn, xRange, yRange, scaleX, scaleY, title) => {
        createEl(parentEl, 'h1', {innerText: title || fn.name});
        const canvas = createEl(parentEl, 'canvas', {
            width: Math.ceil((xRange[1] - xRange[0]) * scaleX),
            height: Math.ceil((yRange[1] - yRange[0]) * scaleY)
        });
        const ctx = canvas.getContext('2d');
        const orgX = -xRange[0] * scaleX;
        const orgY = canvas.height + yRange[0] * scaleY;
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'blue';
        if (orgX > 0 && orgX < canvas.width) {
            ctx.moveTo(orgX, 0);
            ctx.lineTo(orgX, canvas.height);
        }
        if (orgY > 0 && orgY < canvas.height) {
            ctx.moveTo(0, orgY);
            ctx.lineTo(canvas.width, orgY);
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        let previousWasDefined = false;
        for (let x = xRange[0]; x <= xRange[1]; x += 1 / scaleX) {
            const y = fn(x);
            const screenX = x * scaleX + orgX;
            if (isNaN(y)) {
                ctx.stroke();
                ctx.beginPath();
                ctx.strokeStyle = 'red';
                ctx.moveTo(screenX, 0);
                ctx.lineTo(screenX, canvas.height);
                ctx.stroke();
                ctx.strokeStyle = 'black';
                previousWasDefined = false;
                continue;
            }
            const screenY = - y * scaleY + orgY;
            if (previousWasDefined) {
                ctx.lineTo(screenX, screenY);
            }
            else {
                ctx.moveTo(screenX, screenY);
            }
            previousWasDefined = true;
        }
        ctx.stroke();
    };

/** Creates a function that appends a table of expected vs. actual values of a function to the supplied element.
 * @param {HTMLElement} parentEl - The parent element to which the returned function will append tables.
 * @returns {RangeTester} - A function that can append a table to the provided parent element. */
 const rangeTester = parentEl =>
    /** Tests the values of a function and renders a table of expected vs. actual values.
     * @callback RangeTester
     * @param {Function} fn - The function to test.
     * @param {Array} data - The values to feed the function.
     * @param {Array} expected - The expected values of the function over the data, in the same order.
     * @param {string} title - An optional title for the test. If not provided, tha name of the function is used. */
     (fn, data, expected, title) => {
        createEl(parentEl, 'h1', {innerText: title || fn.name});
        const table = createEl(parentEl, 'table');
        const body = createEl(table, 'tbody');
        
        const expectedRow = createEl(body, 'tr');
        createEl(expectedRow, 'td', {_: '<b>Expected:</b>'});
        const actualRow = createEl(body, 'tr');
        createEl(actualRow, 'td', {_: '<b>Actual:</b>'});
        for (let i = 0; i < data.length; i++) {
            const actual = fn(data[i]);
            createEl(expectedRow, 'td', {_: expected[i]});
            createEl(actualRow, 'td', {
                _: actual,
                className: actual === expected[i] ? 'pass' : 'fail'
            });
        }
    };

/** A field value.
 * @typedef {object} FieldValue
 * @property {number} angle - The angle for the field value. Can be undefined for a scalar field.
 * @property {number} amplitude - The amplitude of the field value. May be undefined. */

/** A 2D scalar or vector field.
 * @callback Field
 * @param {number} x - The x coordinate.
 * @param {number} y - The y coordinate.
 * @returns {FieldValue} The value of the field at the point described by the coordinates. */

/** Creates a function that appends a 2D representation of a field to the supplied element.
 * @param {HTMLElement} parentEl - The parent element to which the returned function will append the field representation.
 * @returns {FieldTester} - A function that can append a field representation to the provided parent element. */
 const fieldTester = parentEl =>
    /** Tests the values of a function and renders a table of expected vs. actual values.
     * @callback FieldTester
     * @param {Field} fn - The field to test.
     * @param {Array} xRange - The lower and higher bounds of the x coordinate for the field representation.
     * @param {Array} yRange - The lower and higher bounds of the y coordinate for the field representation.
     * @param {number} scale - The scaling factor for the coordinates of the field representation on the screen.
     * @param {number} step - The step for the incrementation of the x and y coordinates, or the distance between the representations of two adjacent field values.
     * @param {string} title - An optional title for the test. If not provided, tha name of the function is used. */
     (fn, xRange, yRange, scale, step, title) =>{
        createEl(parentEl, 'h1', {innerText: title || fn.name});
        const canvas = createEl(parentEl, 'canvas', {
            width: Math.ceil((xRange[1] - xRange[0]) * scale),
            height: Math.ceil((yRange[1] - yRange[0]) * scale)
        });
        const ctx = canvas.getContext('2d');
        const orgX = -xRange[0] * scale;
        const orgY = canvas.height + yRange[0] * scale;
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'blue';
        if (orgX > 0 && orgX < canvas.width) {
            ctx.moveTo(orgX, 0);
            ctx.lineTo(orgX, canvas.height);
        }
        if (orgY > 0 && orgY < canvas.height) {
            ctx.moveTo(0, orgY);
            ctx.lineTo(canvas.width, orgY);
        }
        ctx.stroke();
        ctx.strokeStyle = 'black';
        for (let x = xRange[0]; x <= xRange[1]; x += step) {
            for (let y = yRange[0]; y <= yRange[1]; y += step) {
                ctx.beginPath();
                const screenX = x * scale + orgX;
                const screenY = - y * scale + orgY;
                const fieldValue = fn(x, y);
                if (fieldValue) {
                    if (fieldValue.angle) {
                        ctx.moveTo(screenX, screenY);
                        const amplitude = fieldValue.amplitude || (step * scale / 2);
                        const angleInRadians = fieldValue.angle * Math.PI / halfCircle;
                        ctx.lineTo(screenX + amplitude * Math.cos(angleInRadians), screenY - amplitude * Math.sin(angleInRadians));
                        ctx.stroke();
                    }
                    else if (fieldValue.amplitude) {
                        ctx.ellipse(screenX, screenY, fieldValue.amplitude, fieldValue.amplitude, 0, 0, 2 * Math.PI);
                        ctx.fill();
                    }
                }
            }
        }
    };

document.addEventListener('DOMContentLoaded', e => {
    const map = new Map(mapSize);
    const ship = new Valkyrie();
    const mapEl = document.getElementsByClassName('map')[0];
    const shipImg = document.getElementsByClassName('ship')[0];
    new OverheadMap(mapEl, shipImg, mapScale, map, ship,
        val => ({
            r: Math.floor(0x68 + 0x80 * val / maxHeight),
            g: Math.floor(0x60 + 0x40 * val / maxHeight),
            b: Math.floor(0 + 0x40 * val / maxHeight)
        }));
    map.generate();
    const viewportEl = document.getElementById('viewport');
    new Viewport(viewportEl, viewportWidth, viewportHeight, viewportScalePowerOfTwo, map, ship);

    // Tests
    const testSection = document.getElementById("testSection");
    const testGraph = graphTester(testSection);
    const testRange = rangeTester(testSection);
    const testField = fieldTester(testSection);
    const runTestsButton = document.getElementById("runTests");
    runTestsButton.addEventListener("click", () => {
        testSection.innerHTML = "";
        testGraph(sin, [-1440, 1440], [-1 << bitsBetweenTops, 1 << bitsBetweenTops], 1/4, 50 / (1 << bitsBetweenTops));
        testGraph(cos, [-1440, 1440], [-1 << bitsBetweenTops, 1 << bitsBetweenTops], 1/4, 50 / (1 << bitsBetweenTops));
        testGraph(tan, [-2880, 2880], [-1500, 1500], 1/8, 1/10);
        testGraph(x => clamp(x, 10), [-1, 15], [-1, 11], 5, 5, "clamp");
        testGraph(x => vary(x, 5, 40), [-10, 60], [-1, 56], 1, 1, "vary");
        testGraph(x => mod(x, 10), [-25, 25], [-1, 11], 5, 5, "mod");
        testRange(
            x => findIndexOf(x, [3, 7, 15, 15, 16, 18]),
            [...Array(20).keys()],
            [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 4, 4, 5, 5, 5, 5],
            "findIndexOf");
        testField(
            (x, y) => ({angle: angleFromCoordinates(x, y)}),
            [-10, 10], [-10, 10], 10, 1,
            "angleFromCoordinates");
        testField(
            (x, y) => ({amplitude: Math.sqrt(x * x + y * y) / 5}),
            [-10, 10], [-10, 10], 10, 1,
            "distanceFromCenter");
    });

    // To make the game smoother, we prefer dropped frames to uneven timing -> setInterval, not setTimeout
    setInterval(gameLoop, tick);

    var rendering = false;
    function gameLoop() {
        frame++;
        if (rendering) return; // Drop the frame if not done rendering but JS being single-threaded... this is not that useful. Then again, we could offset processing to a worker.
        rendering = true;
        ship.move();
        rendering = false;
    }
});
