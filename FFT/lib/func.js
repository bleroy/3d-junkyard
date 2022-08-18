// Some function samples
// (c) Bertrand Le Roy under MIT license

'use strict';

/** Creates a range array
 * @param {Number} low the included lower end of the range, or its higher end if no value is provided for high.
 * @param {Number} high the excluded upper end of the range.
 * @returns {number[]} an array filled with the integers from 0 to n - 1 */
function* range(low, high) {
    if (typeof(high) === 'undefined') {
        high = low;
        low = 0;
    }
    for (let i = low; i < high; i++) {
        yield i;
    }
}

/** Samples a function over an intervalj
 * @param {Function} lambda the function to sample
 * @param {number} n the number of samples to generate
 * @param {number} low the lower bound of the coordinate range to sample
 * @param {number} high the higher bound of the coordinate range to sample
 * @returns {number[]} an array filled with the n sampled values of the function between low and high (included) */
const func = (lambda, n = 512, low = 0, high = n - 1) =>
    [...range(n)].map(x => lambda(low + x * (high - low) / (n - 1)));

/** 512 samples of a sine between 0 and 2π
 * @param {number} period the period of the function
 * @returns {number[]} an array filled with the n sampled values of the function between low and high (included) */
const sine = period => func(
    x => Math.sin(x * (Math.PI * 2) / period),
    512, 0, 2 * Math.PI);

/** 512 samples of a cosine between 0 and 2π
 * @param {number} period the period of the function
 * @returns {number[]} an array filled with the n sampled values of the function between low and high (included) */
const cosine = period => func(
    x => Math.cos(x * (Math.PI * 2) / period),
    512, 0, 2 * Math.PI);

/** Creates 512 samples of a function that's 1 for x0 and zero everywhere else
 * @param {Number} x0 the value of x where the function evaluates as 1
 * @returns an array filled with the 512 samples */
const delta = x0 => func(x => x === x0 ? 1 : 0);

/** Creates 512 samples of a step function of the given period
 * @param {number} period the period of the function
 * @returns {number[]} an array filled with the n sampled values of the function between low and high (included) */
const step = period => func(
    x => x % period > period / 2 ? -1 : 1,
    512, 0, 2 * Math.PI);

/** Creates 512 samples of a Gaussian function
 * @param {number} xp the x coordinate of the maximum
 * @param {number} sd the standard deviation
 * @param {number} height the y coordinate of the maximum
 * @returns {number[]} an array filled with the n sampled values of the function between low and high (included) */
 const gaussian = (xp, sd, height = 1) => func(
    x => height * Math.pow(Math.E, -(x - xp) * (x - xp) / (2 * sd * sd)),
    512, 0, 2 * Math.PI);

export { range, func, sine, cosine, delta, step, gaussian };