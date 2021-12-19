// The color library for our fractal experiment
// (c) 2021 Bertrand Le Roy

'use strict';

import { clamp } from './random.js';

/** A color
 * @typedef {object} Color
 * @property {number} r - The red component of the color.
 * @property {number} g - The green component of the color.
 * @property {number} b - The blue component of the color. */

const minInterpolatedAltitude = -2560;

/** A function that maps an elevation to a color.
 * @callback ColorScale
 * @param {number} val - The elevation.
 * @returns {Color} - The color. */

/** A function that returns a Fractalus color scale for the provided maximum height.
 * @param {number} maxHeight - The maximum height.
 * @returns {ColorScale} The color scale. */
const fractalusColorScale = maxHeight => val => {
    val = clamp(val - minInterpolatedAltitude, maxHeight - minInterpolatedAltitude) / (maxHeight - minInterpolatedAltitude);
    return {
        r: Math.floor(0x68 + 0x80 * val),
        g: Math.floor(0x60 + 0x40 * val),
        b: Math.floor(0 + 0x40 * val)
    };
}

/** The color of the sky. */
let skyColor = {r: 243, g: 143, b: 101};

/** The color of mountains. */
let mountainColor = {r: 130, g: 60, b: 0};

/** The color of the separation between two mountains. */
let mountainEdgeColor = {r: 60, g: 0, b: 0}

/** Compute a color intermediate between two colors.
 * @param {Color} color1 - The first color.
 * @param {Color} color2 - The second color.
 * @param {number} fadeFactor - A number between 0 and 1 that expresses how to mix the colors.
 * 0 means 100% of the first color, 1 means 100% of the second color, and numbers in between mix the two colors proportionally. */
const fadeColors = (color1, color2, fadeFactor) => {
    fadeFactor = Math.min(1, Math.max(0, fadeFactor));
    return {
        r: (1 - fadeFactor) * color1.r + fadeFactor * color2.r,
        g: (1 - fadeFactor) * color1.g + fadeFactor * color2.g,
        b: (1 - fadeFactor) * color1.b + fadeFactor * color2.b
    }
};

/** Shader algorithm.
 * @callback Shader
 * @param {number} distance - The distance from the observer to the mountain column.
 * @returns {Color[]} The colors for the mountain and mountain edge. */

/** A shader that fades the mountains to the sky color at the provided distance.
 * @param {number} viewDistance - The maximum distance at which objects are visible.
 * @returns {Shader} a fog shader for the provided vew distance. */
const fogShader = viewDistance => distance => {
    // Only start fading beyond distance 1
    if (distance <= 1) return [mountainColor, mountainEdgeColor];
    const fadeFactor = distance / viewDistance;
    return [
        fadeColors(mountainColor, skyColor, fadeFactor),
        fadeColors(mountainEdgeColor, skyColor, fadeFactor)
    ];
};

export { fractalusColorScale, skyColor, mountainColor, mountainEdgeColor, fadeColors, fogShader }