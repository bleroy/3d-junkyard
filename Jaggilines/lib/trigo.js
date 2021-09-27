'use strict';

// The trigonometry library for our fractal experiment
// (c) 2021 Bertrand Le Roy

/** Base-2 log of the number of units of angle in a degree. For 2, the unit of angle is a fourth of a degree. */
const angleUnitPowerOfTwo = 2;

/** Number of bits of trigonometric function values. */
const significantBits = 12;

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

/** A table of twelve bits of cos for each unit of angle. */
const cosTable = [...new Array(fullCircle).keys()].map(angle => Math.floor(Math.cos(angle * Math.PI / halfCircle) * (1 << significantBits)));

/** The cosinus of an angle in local units, expressed as a signed 12-bit integer.
 * @param {number} angle - The angle in local units of angle.
 * @returns {number} the cosinus of the angle as a signed 12-bit integer. */
const cos = angle => cosTable[mod(angle, fullCircle)];

/** A table of twelve bits of sin for each unit of angle. */
const sinTable = [...new Array(fullCircle).keys()].map(angle => Math.floor(Math.sin(angle * Math.PI / halfCircle) * (1 << significantBits)));

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
    if (x == 0) return (y < 0) ? south : north;
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
  * @returns {number} The angle `a - b`. */
const angleSub = (a, b) => mod(a - b, fullCircle);
 
 /** An fast to evaluate approximation of the distance between two points.
  * See [https://www.flipcode.com/archives/Fast_Approximate_Distance_Functions.shtml](approximate distance functions).
  * @param {number} x1 - The x coordinate of the first point.
  * @param {number} y1 - The y coordinate of the first point.
  * @param {number} x2 - The x coordinate of the second point.
  * @param {number} y2 - The y coordinate of the second point.
  * @returns {number} The octagonal approximation of the distance between the two points. */
const distance = (x1, y1, x2, y2) => {
    const dx = x2 > x1 ? x2 - x1 : x1 - x2;
    const dy = y2 > y1 ? y2 - y1 : y1 - y2;
    const [max, min] = dx > dy ? [dx, dy] : [dy, dx];
    return (((max << 8) + (max << 3) - (max << 4) - (max << 1) + (min << 7) - (min << 5) + (min << 3) - (min << 1)) >> 8);
}
 
 /** Converts an angle from to [0, fullCircle] range to the [-halfCircle, halfCircle] range.
  * @param {number} angle - The angle to convert.
  * @returns {number} an angle between -halfCircle and halfCircle. */
const angleToAlgebraic = angle => angle > halfCircle ? angle - fullCircle : angle;
 
export {
    north, east, south, west, quarterCircle, halfCircle, fullCircle, angleUnitPowerOfTwo,
    cos, sin, tan, angleFromCoordinates, mod, angleSub, distance, angleToAlgebraic, findIndexOf
}