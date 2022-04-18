// Function graphing & testing for ChicoryJS
// (c) Bertrand Le Roy

'use strict';

import { assert, describe, it } from './chicory.js';
import Complex from '../lib/complex.js';

assert.extend(
    function samples(expected, lower, higher) {
        for (let i = 0, x = lower;
            i < this.length;
            i++, x = lower + (higher - lower) * i / (this.length - 1)) {
            const expectedX = expected(x);
            if (!(expectedX instanceof Complex
                ? expectedX.equals(this[i])
                : Complex.fromReal(expectedX)).equals(this[i])) {
                throw new Error(`Value at index ${i} (x = ${x}) should be ${expected(x)} but was ${this[i]}.`);
            }
        }
    }
);

/** Creates an element of the supplied tag type and with the specified attributes.
 * @param {string} tag - The tag name.
 * @param {object} attr - An object containing all the attributes to set on the element.
 * @returns {HTMLElement} The new element. */
 const createEl = (tag, attr) => {
    const el = document.createElement(tag);
    if (attr) {
        for (let option in attr) {
            if (option === '_') el.innerHTML = attr[option];
            else el[option] = attr[option];
        }
    }
    return el;
}

/** Graphs a function (expected sampled behavior) and a set of sample values
 *  to check against the reference function.
 * @param {Function} fn - The reference function to graph.
 * @param {number[]} samples - Sample values to compare with the referene function.
 * @param {number[]} xRange - A two elements array containing the lower and higher ends of the x range to graph.
 * @param {number[]} yRange - A two elements array containing the lower and higher ends of the y range to graph.
 * @param {number} scaleX - The scale to apply on the X axis.
 * @param {number} scaleY - The scale to apply on the Y axis.
 * @param {number} tolerance - The allowed deviation for each sample from the reference function.
 * @returns {HTMLCanvasElement} a canvas containing the graph of the function. */
const graph = (fn, samples, xRange, yRange, scaleX, scaleY, tolerance = 0) => {
    const canvas = createEl('canvas', {
        width: Math.ceil((xRange[1] - xRange[0]) * scaleX),
        height: Math.ceil((yRange[1] - yRange[0]) * scaleY)
    });
    const ctx = canvas.getContext('2d');
    const orgX = -xRange[0] * scaleX;
    const orgY = canvas.height + yRange[0] * scaleY;
    // Draw the axes
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
    const scaledTolerance = tolerance * scaleY;
    const errors = [];
    // Draw the samples
    for (let i = 0; i < samples.length; i++) {
        const x = (xRange[0] + i * (xRange[1] - xRange[0]) / (samples.length - 1))
        const screenX = x * scaleX + orgX;
        const y = samples[i];
        if (!isNaN(y)) {
            const screenY = - y * scaleY + orgY;
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgb(240, 240, 240, 80)';
            ctx.moveTo(screenX, screenY - scaledTolerance);
            ctx.lineTo(screenX, screenY + scaledTolerance);
            ctx.stroke();
            ctx.strokeStyle = 'black';
            ctx.fillRect(screenX, screenY, 1, 1);
            ctx.stroke();

            const fny = fn(x);
            const diff = Math.abs(fny - samples[i]);
            if (tolerance >= 0 && diff > tolerance) {
                errors.push(new Error(`Sample at index ${i} (x = ${x}) is ${y} but function value is ${fny}. Difference is ${diff}.`));
            }
        }
    }
    // Draw the function's graph
    ctx.beginPath();
    ctx.strokeStyle = 'red';
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
    const error = errors.length > 0
        ? new Error("Samples out of range.\r\n" + errors.join("\r\n"))
        : null;
    return {
        element: canvas,
        error
    };
};


export { assert, describe, it, graph };