// Some function samples
// (c) Bertrand Le Roy under MIT license

'use strict';

/** Creates a range array
 * @param {Number} n the number of samples
 * @returns an array filled with the integers from 0 to n - 1 */
const range = n => [...Array(n).keys()];

/** Samples a function over an intervalj
 * @param {Function} lambda the function to sample
 * @param {Number} n the number of samples to generate
 * @param {Number} low the lower bound of the coordinate range to sample
 * @param {Number} high the higher bound of the coordinate range to sample
 * @returns an array filled with the n sampled values of the function between low and high (included) */
const func = (lambda, n = 512, low = 0, high = n - 1) =>
    range(n).map(x => lambda(low + x * (high - low) / (n - 1)));

/** 512 samples of a sine between 0 and 2π */
const sine = func(x => Math.sin(x), 512, 0, 2 * Math.PI);

/** 512 samples of a cosine between 0 and 2π */
const cosine = func(x => Math.cos(x), 512, 0, 2 * Math.PI);

/** Creates 512 samples of a function that's 1 for x0 and zero everywhere else
 * @param {Number} x0 the value of x where the function evaluates as 1
 * @returns an array filled with the 512 samples */
const delta = x0 => func(x => x === x0 ? 1 : 0);

const step = freq => func(x => x % freq > freq / 2 ? -1 : 1);

export { range, func, sine, cosine, delta, step as square };