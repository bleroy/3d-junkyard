// Function graphing & testing for ChicoryJS
// (c) Bertrand Le Roy

'use strict';

import { assert, describe, it } from './chicory.js';
import Complex from '../lib/complex.js';

assert.extend([
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
    },
    function approximates(expected, tolerance) {
        if (typeof(this) === 'number') {
            assert.that(Math.abs(this - expected) < tolerance)
                .isTrue(`${this} is more than ${tolerance} away from the expected ${expected}.`);
        } else if (this instanceof Complex) {
            assert.that(this.minus(expected).modulus < tolerance)
            .isTrue(`${this} is more than ${tolerance} away from the expected ${expected}.`);
        } else if (this.length !== expected.length) {
            throw new Error(`Expected ${expected.length} items but got ${this.length}.`);
        } else {
            for (let i = 0; i < this.length; i++) {
                assert.that(this[i]).approximates(expected[i], tolerance);
            }
        }
    }
]);

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
    const margin = 20;
    const canvas = createEl('canvas', {
        width: Math.ceil((xRange[1] - xRange[0]) * scaleX) + margin,
        height: Math.ceil((yRange[1] - yRange[0]) * scaleY) + margin
    });
    const ctx = canvas.getContext('2d');
    const orgX = -xRange[0] * scaleX;
    const orgY = canvas.height - margin + yRange[0] * scaleY;
    function toScreenX(x) { return x * scaleX + orgX + margin; }
    function toScreenY(y) { return -y * scaleY + orgY; }
    // Draw the axes
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'grey';
    if (orgX > 0 && orgX < canvas.width - margin) {
        ctx.moveTo(toScreenX(0), 0);
        ctx.lineTo(toScreenX(0), canvas.height - margin);
    }
    if (orgY > 0 && orgY < canvas.height - margin) {
        ctx.moveTo(margin, toScreenY(0));
        ctx.lineTo(canvas.width + margin, toScreenY(0));
    }
    ctx.stroke();
    const scaledTolerance = tolerance * scaleY;
    const errors = [];
    // Draw the samples
    for (let i = 0; i < samples.length; i++) {
        const x = (xRange[0] + i * (xRange[1] - xRange[0]) / (samples.length - 1))
        const screenX = toScreenX(x);
        const y = samples[i];
        if (!isNaN(y)) {
            const screenY = toScreenY(y);
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
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
        const screenX = toScreenX(x);
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
        const screenY = toScreenY(y);
        if (previousWasDefined) {
            ctx.lineTo(screenX, screenY);
        }
        else {
            ctx.moveTo(screenX, screenY);
        }
        previousWasDefined = true;
    }
    ctx.stroke();
    // Clear margins
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, margin, canvas.height);
    ctx.fillRect(0, canvas.height - margin, canvas.width, margin);
    // Draw the box
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'grey';
    ctx.moveTo(margin, 0);
    ctx.lineTo(canvas.width - 1, 0);
    ctx.lineTo(canvas.width - 1, canvas.height - margin);
    ctx.lineTo(margin, canvas.height - margin);
    ctx.lineTo(margin, 0);
    ctx.stroke();
    // Determine scales
    const horizontalScale = Math.pow(10, Math.floor(Math.log10(Math.abs(xRange[1] - xRange[0]))));
    const verticalScale = Math.pow(10, Math.floor(Math.log10(Math.abs(xRange[1] - xRange[0]))));
    // Draw scale ticks
    ctx.font = '10px sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    for (let x = Math.ceil(xRange[0] / horizontalScale) * horizontalScale; x <= xRange[1]; x += horizontalScale) {
        const screenX = toScreenX(x);
        ctx.moveTo(screenX, canvas.height - margin);
        ctx.lineTo(screenX, canvas.height - margin + 3);
        ctx.strokeText(x, screenX + 2, canvas.height - margin + 3);
        ctx.stroke();
    }
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'right';
    for (let y = Math.ceil(yRange[0] / verticalScale) * verticalScale; y <= yRange[1]; y += verticalScale) {
        const screenY = toScreenY(y);
        ctx.moveTo(margin, screenY);
        ctx.lineTo(margin - 3, screenY);
        ctx.strokeText(y, margin - 3, screenY);
        ctx.stroke();
    }
    const error = errors.length > 0
        ? new Error("Samples out of range.\r\n" + errors.join("\r\n"))
        : null;
    return {
        element: canvas,
        error
    };
};


export { assert, describe, it, graph };