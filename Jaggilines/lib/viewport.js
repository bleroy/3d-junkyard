// Viewport component for our fractal experiment
// (c) 2021 Bertrand Le Roy

'use strict';

import { distance, angleFromCoordinates, angleFromMapCoordinates, angleToAlgebraic, angleSub, mod, quarterCircle, halfCircle } from './trigo.js';
import { skyColor, mountainColor, mountainEdgeColor } from './color.js';
import { seedRnd } from './random.js';

/** A viewport that can render the 3D subjective view from the ship.
 * @property {HTMLCanvasElement} canvas - The canvas element where to draw the view.
 * @property {number} width - The width of the viewport in logical pixels.
 * @property {number} height - The height of the viewport in logical pixels.
 * @property {number} verticalOffset - The vertical coordinate of the horizontal direction.
 * @property {number} viewDistance - the maximum distance for objects to be visible in the viewport.
 * @property {number} scalePowerOfTwo - The power of two that gives the physical pixel size of a logical viewport pixel.
 * @property {number} bitsBetweenTops - The power of two that gives the distance between mountain tops.
 * @property {number} maxHeight - The maximum height of mountains.
 * @property {number} displacementAttenuationPower - The power of two attenuation to use in the interpolation algorithm.
 * @property {Map} map - The map of the landscape to render.
 * @property {Valkyrie} ship - The ship object.
 * @property {InterpolationAlgorithm} interpolation - The interpolation algorithm to use to render the mountains.
 * @property {Shader} shader - A function that computes the colors to render a mountain column with.
 *  The default draws a solid shade of brown that doesn't change with distance.  */
 class Viewport {
    #context;
    #topHeights;
    #debugCache;

    /** Build a 3D viewport over the provided canvas element.
     * @param {HTMLCanvasElement} canvas - The canvas element where to draw the view.
     * @param {number} width - The width of the viewport in logical pixels.
     * @param {number} height - The height of the viewport in logical pixels.
     * @param {number} verticalOffset - The vertical coordinate of the horizontal direction.
     * @param {number} viewDistance - the maximum distance for objects to be visible in the viewport.
     * @param {number} scalePowerOfTwo - The power of two that gives the physical pixel size of a logical viewport pixel.
     * @param {number} angleUnitsPerPixelPowerOfTwo - The power of two that gives the number of angle units per screen pixel.
     * @param {number} bitsBetweenTops - The power of two that gives the distance between mountain tops.
     * @param {number} maxHeight - The maximum height of mountains.
     * @param {number} displacementAttenuationPower - The power of two attenuation to use in the interpolation algorithm.
     * @param {Map} map - The map of the landscape to render.
     * @param {Valkyrie} ship - The ship object.
     * @param {InterpolationAlgorithm} interpolation - The interpolation algorithm to use to render the mountains.
     * @param {Shader} shader - A function that computes the colors to render a mountain column with.
     *  The default draws a solid shade of brown that doesn't change with distance.  */
     constructor(
        canvas,
        width,
        height,
        verticalOffset,
        viewDistance,
        scalePowerOfTwo,
        angleUnitsPerPixelPowerOfTwo,
        bitsBetweenTops,
        maxHeight,
        displacementAttenuationPower,
        map,
        ship,
        interpolation,
        shader) {

        this.width = width;
        this.height = height;
        canvas.width = width << scalePowerOfTwo;
        canvas.height = height << scalePowerOfTwo;
        this.canvas = canvas;
        this.#context = canvas.getContext('2d');
        this.#context.imageSmoothingEnabled = false;
        this.verticalOffset = verticalOffset;
        this.viewDistance = viewDistance;
        this.scalePowerOfTwo = scalePowerOfTwo;
        this.angleUnitsPerPixelPowerOfTwo = angleUnitsPerPixelPowerOfTwo;
        this.bitsBetweenTops = bitsBetweenTops;
        this.maxHeight = maxHeight;
        this.displacementAttenuationPower = displacementAttenuationPower;
        this.map = map;
        this.ship = ship;
        this.interpolation = interpolation;
        this.shader = shader;
        
        // Trigger the first rendering
        this.draw();

        ship.addMoveListener(() => {
            this.draw();
        });
    }

    /** Draws a column of pixels representing a slice of mountain.
     * Can be called repeatedly for successive mountains from closest to farthest.
     * @param {number} xScreen - The logical pixel column to render.
     * @param {number} mountainTop - The height of the mountain in logical pixels from the bottom of the viewport.
     * @param {number} distance - The distance from the observer to the mountain column. */
    #drawMountainColumn(xScreen, mountainTop, distance) {
        if (xScreen < 0 || xScreen >= this.width) return;
        const topHeight = this.#topHeights[xScreen];
        const shadedColors = this.shader ? this.shader(distance) : [mountainColor, mountainEdgeColor];
        if (topHeight  === -1) { // First mountain we're drawing on this column.
            this.#context.fillStyle = `rgb(${skyColor.r},${skyColor.g},${skyColor.b})`;
            this.#context.fillRect(xScreen << this.scalePowerOfTwo, 0, 1 << this.scalePowerOfTwo, (this.height - mountainTop) << this.scalePowerOfTwo);
            this.#context.fillStyle = `rgb(${shadedColors[0].r},${shadedColors[0].g},${shadedColors[0].b})`;
            this.#context.fillRect(xScreen << this.scalePowerOfTwo, (this.height - mountainTop) << this.scalePowerOfTwo, 1 << this.scalePowerOfTwo, mountainTop << this.scalePowerOfTwo);
            this.#topHeights[xScreen] = mountainTop;
        }
        else if (mountainTop > topHeight) { // New mountain (that is farther) is taller -> extend previous.
            this.#context.fillStyle = `rgb(${shadedColors[1].r},${shadedColors[1].g},${shadedColors[1].b})`;
            this.#context.fillRect(xScreen << this.scalePowerOfTwo, (this.height - topHeight) << this.scalePowerOfTwo, 1 << this.scalePowerOfTwo, 1 << this.scalePowerOfTwo);
            this.#context.fillStyle = `rgb(${shadedColors[0].r},${shadedColors[0].g},${shadedColors[0].b})`;
            this.#context.fillRect(xScreen << this.scalePowerOfTwo, (this.height - mountainTop) << this.scalePowerOfTwo, 1 << this.scalePowerOfTwo, (mountainTop - topHeight) << this.scalePowerOfTwo);
            this.#topHeights[xScreen] = mountainTop;
        }
        // Otherwise, everything is hidden, do nothing.
    }

    #shift(val, bits) {
        if (bits === 0) return val;
        if (bits > 0) return val >> bits;
        return val << -bits;
    }

    #computeScreenCoordinatesFor(x, y, memo) {
        const dist = distance(this.ship.x, this.ship.y, x << this.bitsBetweenTops, y << this.bitsBetweenTops);
        const absAngle = angleFromMapCoordinates((x << this.bitsBetweenTops) - this.ship.x, (y << this.bitsBetweenTops) - this.ship.y);
        let azimuth = angleToAlgebraic(angleSub(absAngle, this.ship.heading));
        const altitude = angleToAlgebraic(angleFromCoordinates(dist, this.map.get(x, y) - this.ship.z));
        // Deal with points behind us, which may still interpolate to visible points
        let behind = false;
        if (azimuth > quarterCircle) {
            azimuth = halfCircle - azimuth;
            behind = true;
        }
        if (azimuth < -quarterCircle) {
            azimuth = -halfCircle - azimuth;
            behind = true;
        }
        const screenCol = (this.width >> 1) - this.#shift(azimuth,this.angleUnitsPerPixelPowerOfTwo);
        const screenRow = this.verticalOffset + this.#shift(altitude, this.angleUnitsPerPixelPowerOfTwo);
        // We compute the screen displacement corresponding to a 0-maxHeight amplitude at this point.
        // This will be used as a starting point for the amplitude later.
        const altitude0 = angleToAlgebraic(angleFromCoordinates(dist, - this.ship.z));
        const altitudeMax = angleToAlgebraic(angleFromCoordinates(dist, this.maxHeight - this.ship.z));
        const displacement = this.#shift(altitudeMax - altitude0, this.angleUnitsPerPixelPowerOfTwo + this.displacementAttenuationPower);
        // Remember the screen coordinates for the summits so we can reuse and interpolate between them.
        if (!memo[x]) memo[x] = [];
        memo[x][y] = {
            x: screenCol,
            y: screenRow,
            d: dist,
            displacement,
            xMap: mod(x, this.map.size),
            yMap: mod(y, this.map.size),
            behind
        };
    }

    /** Recursively interpolates mid-points until all screen columns have been evaluated. */
    #interpolate(yMountain1, yMountain2, x1, x2, y1, y2, dist, screenDisplacement, bisections = 0, debugData = {}) {
        // A lot more can be done to avoid doing calculations on summits that will not affect the viewport but
        // for this, we're only excluding interpolation for cases where both points are off-screen.
        // TODO: not so fast, parts of a line might still end up on the screen.
        // TODO: investigate weird additional mountains that show in high resolution.
        if (((x1 < 0) || (x1 >= this.width)) &&
            ((x2 < 0) || (x2 >= this.width))) return;

        const midX = (x1 + x2) >> 1;
        if (midX != x1 && midX != x2) { // Stop the recursion when the midpoint coincides with one of the bounds.
            const [midMountainY, midScreenY] = this.interpolation(yMountain1, yMountain2, y1, y2, screenDisplacement, bisections);
            // Keep some data around for debugging
            const columnCache = this.#debugCache[midX] || [];
            columnCache.push({top: midScreenY, summits: debugData});
            this.#debugCache[midX] = columnCache;
            // Draw the current column
            this.#drawMountainColumn(midX, midScreenY, dist);
            // Interpolate the new midpoints before and after the current one.
            this.#interpolate(yMountain1, midMountainY, x1, midX, y1, midScreenY, dist, screenDisplacement >> 1, bisections + 1, debugData);
            this.#interpolate(midMountainY, yMountain2, midX, x2, midScreenY, y2, dist, screenDisplacement >> 1, bisections + 1, debugData);
        }
    }

    #drawMountainColumnFromMemo(memo, xMap, yMap, dist) {
        const m = memo[xMap][yMap];
        if (!m.behind) this.#drawMountainColumn(m.x, m.y, dist);
    }

    #interpolateFromMemo(memo, xMap1, yMap1, xMap2, yMap2, dist) {
        const point1 = memo[xMap1][yMap1];
        const point2 = memo[xMap2][yMap2];
        if (point1.x !== point2.x && (!point1.behind || !point2.behind)) {
            // We use the average displacement amplitude between the two points
            // before bisecting recursively, and recursive displacements will just be bit operations.
            const screenDisplacement = (point1.displacement + point2.displacement) >> 1;
            // Introduce a determinic seed of chaos to the mountain heights to cause variations in mountain shapes
            // and so they don't all look the same.
            const chaos = seedRnd(xMap1, yMap1, yMap2, xMap2)() & 0xFF;
            this.#interpolate(
                this.map.get(xMap1, yMap1) - chaos,
                this.map.get(xMap2, yMap2),
                point1.x,
                point2.x,
                point1.y,
                point2.y,
                dist,
                screenDisplacement,
                0,
                { point1, point2 });
        }
    }

    #computeScreenCoordinateAndDrawColumn(memo, xMap, yMap, dist) {
        this.#computeScreenCoordinatesFor(xMap, yMap, memo);
        this.#drawMountainColumnFromMemo(memo, xMap, yMap, dist);
    }

    /** Draw a frame. */
    draw() {
        // Clear the canvas first, although this will no longer be necessary once rendering code is complete since the whole screen
        // gets redrawn on every frame.
        this.#context.clearRect(0, 0, this.width << this.scalePowerOfTwo, this.height << this.scalePowerOfTwo);
        this.#topHeights = new Array(this.width).fill(-1);
        const [xMap, yMap] = [(this.ship.x >> this.bitsBetweenTops) + 1, this.ship.y >> this.bitsBetweenTops];
        const memo = [];
        this.#debugCache = [];
        for (let dist = 0; dist < this.viewDistance; dist++) {
            // Bootstrap the new square by computing the screen coordinates on the perimeter of the square at this distance.
            // Also draw these columns.
            for (let i = -dist; i < dist + 1; i++) {
                this.#computeScreenCoordinateAndDrawColumn(memo, xMap + dist, yMap + i, dist);
                this.#computeScreenCoordinateAndDrawColumn(memo, xMap - dist - 1, yMap + i + 1, dist);
                this.#computeScreenCoordinateAndDrawColumn(memo, xMap - i - 1, yMap - dist, dist);
                this.#computeScreenCoordinateAndDrawColumn(memo, xMap - i, yMap + dist + 1, dist);
            }
            // Skip connecting with the previous square when there's no such thing
            if (dist > 0) {
                // Interpolate between the new summit square and the previous.
                for (let i = -dist + 1; i < dist + 1; i++) {
                    this.#interpolateFromMemo(memo, xMap + dist, yMap + i, xMap + dist - 1, yMap + i, dist);
                    this.#interpolateFromMemo(memo, xMap - dist - 1, yMap + i, xMap - dist, yMap + i, dist);
                    this.#interpolateFromMemo(memo, xMap - i, yMap - dist + 1, xMap - i, yMap - dist, dist);
                    this.#interpolateFromMemo(memo, xMap - i, yMap + dist, xMap - i, yMap + dist + 1, dist);
                }
            }
            // Interpolate between the new summits on the perimeter of the square at this distance.
            for (let i = -dist; i < dist + 1; i++) {
                this.#interpolateFromMemo(memo, xMap - dist - 1, yMap + i, xMap - dist - 1, yMap + i + 1, dist);
                this.#interpolateFromMemo(memo, xMap + dist, yMap + i, xMap + dist, yMap + i + 1, dist);
                this.#interpolateFromMemo(memo, xMap - i - 1, yMap - dist, xMap - i, yMap - dist, dist);
                this.#interpolateFromMemo(memo, xMap - i - 1, yMap + dist, xMap - i, yMap + dist, dist);
            }
        }
    }

    /** Gets debug information from screen coordinates.
     * @param {Numner} x - the x coordinate.
     * @param {Number} y - the y coordinate. */
    getDebugData(x, y) {
        const dataForX = this.#debugCache[x];
        if (!dataForX) return null;
        for (const cacheItem of dataForX) {
            if (y <= cacheItem.top) return cacheItem.summits;
        }
    }
}

export { Viewport }