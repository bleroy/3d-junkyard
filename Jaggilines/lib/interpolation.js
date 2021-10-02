// Interpolation algorithm library for our fractal experiment
// (c) 2021 Bertrand Le Roy

'use strict';

/** Interpolation algorithm.
 * @callback InterpolationAlgorithm
 * @param {number} yMountain1 - The altitude on the map of the first summit coordinate.
 * @param {number} yMountain2 - The altitude on the map of the second summit coordinate.
 * @param {number} yScreen1 - The first y screen coordinate.
 * @param {number} yScreen2 - The second y screen coordinate.
 * @param {number} screenDisplacement - The current displacement amplitude in screen pixels.
 * @param {number} bisections - The number of bisections that have been performed to get there.
 * @returns {number[]} An array containing the interpolated absolute altitude at the mid-point
 * as the first element and the interpolated y screen coordinate as the second element. */

/** A linear interpolation algorithm.
 * @type {InterpolationAlgorithm} */
const linearInterpolation = (yMountain1, yMountain2, yScreen1, yScreen2) =>
    [(yMountain1 + yMountain2) >> 1, (yScreen1 + yScreen2) >> 1];

/** Builds a fractal interpolation algorithm with the specified bits between tops and flip bit parameters.
 * @param {number} bitsBetweenTops - The power of two giving the distance between mountain tops.
 * @param {number} maxHeight - The maximum height of mountain tops.
 * @param {number} displacementAttenuationPower - The number of bits to drop from the displacement.
 * @param {number} flipBit - The index of the bit that flips the displacement.
 * @returns {InterpolationAlgorithm} */
const fractalInterpolation = (bitsBetweenTops, maxHeight, displacementAttenuationPower, flipBit) =>
    /** A fractal interpolation algorithm.
     * A deterministic but chaotic displacement is added to the linear interpolation.
     * This is our best attempt at interpreting the transcript of a letter from Loren Carpenter dated April 18, 1989.
     * @type {InterpolationAlgorithm} */
    (yMountain1, yMountain2, yScreen1, yScreen2, screenDisplacement, bisections) => {
        const sum = yMountain1 + yMountain2;
        // Absolute displacement is edge_length / 4 (the screen displacement amplitude gets divided by two on each subdivision).
        const absoluteDisplacement = 1 << (bitsBetweenTops - bisections - displacementAttenuationPower);
        // Depending on some flip bit on the sum of altitudes, we add or subtract the displacement.
        // We also subtract when the new value would go over the max height.
        if ((sum >> 1) + absoluteDisplacement <= maxHeight && sum & (1 << flipBit))
            return [
                (sum >> 1) + absoluteDisplacement,
                ((yScreen1 + yScreen2) >> 1) + screenDisplacement
            ];
        return [
            (sum >> 1) - absoluteDisplacement,
            ((yScreen1 + yScreen2) >> 1) - screenDisplacement
        ];
    };

export { linearInterpolation, fractalInterpolation }