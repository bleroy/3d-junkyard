'use strict';

// The random number library for our fractal experiment
// (c) 2021 Bertrand Le Roy

'use strict';

/** Clamps the closest integer lower than the value between 0 and the max height
 * @param {number} val - The value to clamp.
 * @param {number} max - The maximum value.
 * @returns {number} The clamped value, between 0 and maxHeight. */
const clamp = (val, max) => val < 0 ? 0 : val > max ? max : Math.floor(val);

/** Generates a random integer number in [0, top[
 * @param {number} top - The value under which the random number is.
 * @returns {number} A random number between 0 and top (non included). */
const rnd = top => Math.floor(Math.random() * top);
 
/** Generates an even random number smaller than top.
 * @param {number} top - The value under which the random number is.
 * @returns {number} A random even number between 0 and top (non included). */
const rndEven = top => rnd(top >> 1) << 1;
 
/** Adds a random variation to the value, then clamps the result.
 * @param {number} val - The value to vary around.
 * @param {number} varyBy - The maximum variation around val.
 * @param {number} max - The maximum value.
 * @returns {number} A new integer value that is a random number equal to val +/- at most varyBy and clamped between 0 and maxHeight. */
const vary = (val, varyBy, max) => clamp(val + Math.random() * 2 * varyBy - varyBy, max);
 
/** Adds a random variation around the average of the provided values, then clamps the result.
 * @param {number} val - The value to vary around.
 * @param {number} varyBy - The maximum variation around val.
 * @param {number} max - The maximum value.
 * @returns {number} A new integer value that is a random number equal to val +/- at most varyBy and clamped between 0 and maxHeight. */
const varyFromAverage = (vals, varyBy, max) => vary(vals.reduce((acc, val) => acc + val, 0) / vals.length, varyBy, max);
 
/** An integer hash function. */
const hash = n => {
    n = ((n >> 16) ^ n) * 0x45d9f3b;
    n = ((n >> 16) ^ n) * 0x45d9f3b;
    n = (n >> 16) ^ n;
    return n;
};
 
/**
 * Seeds a deterministic random number generator using sfc32.
 * See https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
 * This is not crypto or anything like that, just a convenient source of deterministic chaos.
 * @param {number} a - The first seed to create the random number genrator from.
 * @param {number} b - The second seed to create the random number genrator from.
 * @param {number} c - The third seed to create the random number genrator from.
 * @param {number} d - The fourth seed to create the random number genrator from.
 * @returns a random number generator that uses the provided seed. */
const seedRnd = (a, b, c, d) => () => {
    a = hash(a); b = hash(b); c = hash(c); d = hash(d);
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    d = d + 1 | 0;
    t = t + d | 0;
    c = c + t | 0;
    return t >>> 0;
};

export {
    rnd, rndEven, seedRnd, clamp, vary, varyFromAverage
}