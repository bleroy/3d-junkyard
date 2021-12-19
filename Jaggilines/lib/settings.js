// Settings for our fractal experiment
// (c) 2021 Bertrand Le Roy

'use strict';

/** Number of bits for mountain summit map coordinates. */
const mapCoordinateBits = 4;

/** The mountain summit map is 16 x 16. */
const mapSize = 1 << mapCoordinateBits;

/** Number of bits of coordinates between mountain tops. */
const bitsBetweenTops = 12;

/** Valkyrie coordinates are 16-bit integers, with the 4 most-significant bits for map coordinates and the remaining 12 bits for in-cell coordinates. */
const coordinateBits = mapCoordinateBits + bitsBetweenTops;

/** The power of two of the number of pixels on the map between peaks. */
const overheadMapScalePowerOfTwo = 3;

/** The power of two for the scale of the viewport from logical pixel to physical pixels on the page (2 -> x4 physical pixels). */
const viewportScalePowerOfTwo = 0;

/** The physical width of the viewport. */
const viewportPhysicalWidth = 640;

/** The logical width of the viewport. */
const viewportWidth = viewportPhysicalWidth >> viewportScalePowerOfTwo;

/** The physical height of the viewport. */
const viewportPhysicalHeight = 192;

/** The logical height of the viewport. */
const viewportHeight = viewportPhysicalHeight >> viewportScalePowerOfTwo;

/** The physical vertical coordinate of the horizon on the viewport. */
const viewportPhysicalVerticalOffset = 150;

/** The vertical coordinate of the horizon on the viewport. */
const viewportVerticalOffset = viewportPhysicalVerticalOffset >> viewportScalePowerOfTwo;

/** The power of two that gives the number of viewport pixels per unit of angle. */
const viewportPowerOfTwoAngleUnitPerScreenPixel = viewportScalePowerOfTwo - 1;

/** Vertically, mountains range up to 2^12 in height. */
const maxHeightBits = 12;

/** Maximum mountain height */
const maxHeight = 1 << maxHeightBits;

/** Variations from summit to summit of the diamond-square algorithm maps are at most maxHeight / 16. */
const maxDiamondSquareVariation = maxHeight >> 2;

/** Determines the mountain density on the maze-algorithm-generated maps.
 * Values closer to 0 have more mountains, fewer valleys.
 * Higher values have fewer mountains.
 * 0.8 is a balanced value with mostly isolated mountains with a few chains
 * that are not too long. It seems to look closely like Fractalus landscapes. */
const mazeHoleiness = 0.8;

/** Clipping distance, how many rows of mountains away from the ship can the viewport show. */
const viewDistance = 5;

/** Default Valkyrie thrust, or number of distance units per tick. */
const defaultThrust = 1 << 5;

/** Minimum and maximum thrust values */
const minThrust = defaultThrust / 5;
const maxThrust = defaultThrust * 1.5;

/** Power of two used as attenuation of the fractal displacement used in the fractal interpolation algorithm. Fractalus uses 2, which maps to edge_length / 4. */
const displacementAttenuationPower = 2;

/** Which bit in the sum of heights flips the sign of the deviation of the fractal algorithm. */
const fractalFlipBit = 7;

/** Number of milliseconds between runs of the game loop. */
const tick = 32;

export { mapCoordinateBits, mapSize, bitsBetweenTops, coordinateBits, overheadMapScalePowerOfTwo, viewportScalePowerOfTwo,
    viewportPhysicalWidth, viewportPhysicalHeight, viewportWidth, viewportHeight, viewportPhysicalVerticalOffset, viewportVerticalOffset,
    viewportPowerOfTwoAngleUnitPerScreenPixel, maxHeightBits, maxHeight, maxDiamondSquareVariation, mazeHoleiness, viewDistance, defaultThrust,
    minThrust, maxThrust, displacementAttenuationPower, fractalFlipBit, tick }