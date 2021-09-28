// HTML utilities for our fractal experiment
// (c) 2021 Bertrand Le Roy

'use strict';

import { createEl } from './html.js';
import { halfCircle } from './trigo.js';

/** Creates a function that appends an interpolation graph to the supplied element.
 * @param {HTMLElement} parentEl - The parent element to which the returned function will append the interpolation graph.
 * @returns {TestInterpolationGrapher} - A function that can append an interpolation graph to the provided parent element. */
 const interpolationTester = parentEl =>
    /** Graphs an interpolation function.
     * @callback TestInterpolationGrapher
     * @param {InterpolationAlgorithm} fn - The interpolation algorithm to graph.
     * @param {number} width - The width of the graph.
     * @param {number} height - The height of the graph.
     * @param {number} left - The height of the mountain on the left.
     * @param {number} right - The height ofthe mountain on the right.
     * @param {number} leftScreen - The screen y coordinate on the left.
     * @param {number} rightScreen - The screen y coordinate on the right.
     * @param {string} title - An optional title for the graph. If not provided, tha name of the function is used. */
     (fn, width, height, left, right, leftScreen = 0, rightScreen = 255, displacement = 63, title) => {
        createEl(parentEl, 'h1', {innerText: title || fn.name});
        const div = createEl(parentEl, 'div');
        const firstScreenInput = createEl(div, 'input', {
            type: 'number',
            value: leftScreen,
            required: true,
            title: "left screen Y"
        });
        const secondScreenInput = createEl(div, 'input', {
            type: 'number',
            value: rightScreen,
            required: true,
            title: "right screen Y"
        });
        const firstMountainInput = createEl(div, 'input', {
            type: 'number',
            min: 0,
            value: left,
            required: true,
            title: "left mountain Y"
        });
        const secondMountainInput = createEl(div, 'input', {
            type: 'number',
            min: 0,
            value: right,
            required: true,
            title: "right mountain Y"
        });
        const displacementInput = createEl(div, 'input', {
            type: 'number',
            min: 0,
            max: height - 1,
            value: displacement,
            required: true,
            title: "displacement"
        });
        const flipBitInput = createEl(div, 'input', {
            type: 'number',
            min: 0,
            step: 1,
            max: 15,
            value: 5,
            required: true,
            title: "flip bit"
        });
        const canvas = createEl(div, 'canvas', {
            width: width,
            height: height
        });
        const ctx = canvas.getContext('2d');
        const recurse = (yMountain1, yMountain2, x1, x2, y1, y2, displacement, bisections, flipBit) => {
            const midX = (x1 + x2) >> 1;
            if (x1 === midX || x2 === midX) return;
            const [midMountainY, midY] = fn(yMountain1, yMountain2, y1, y2, displacement, bisections, flipBit);
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'black';
            ctx.moveTo(midX, canvas.height);
            ctx.lineTo(midX, canvas.height - midY)
            ctx.stroke();
    
            recurse(yMountain1, midMountainY, x1, midX, y1, midY, displacement >> 1, bisections + 1, flipBit);
            recurse(midMountainY, yMountain2, midX, x2, midY, y2, displacement >> 1, bisections + 1, flipBit);
        };
        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            const one = parseFloat(firstScreenInput.value);
            const two = parseFloat(secondScreenInput.value);
            const oneMountain = parseFloat(firstMountainInput.value);
            const twoMountain = parseFloat(secondMountainInput.value);
            const disp = parseFloat(displacementInput.value);
            const flipBit = parseInt(flipBitInput.value, 10);
            recurse(oneMountain, twoMountain, 0, width, one, two, disp, flipBit);
        };
        draw();
        [
            firstScreenInput,
            secondScreenInput,
            firstMountainInput,
            secondMountainInput,
            displacementInput,
            flipBitInput
        ].forEach(el => el.addEventListener('change', draw));
    };

/** Creates a function that appends a graph to the supplied element.
 * @param {HTMLElement} parentEl - The parent element to which the returned function will append graphs.
 * @returns {TestGrapher} - A function that can append a graph to the provided parent element. */
const graphTester = parentEl =>
    /** Graphs a function.
     * @callback TestGrapher
     * @param {Function} fn - The function to graph.
     * @param {number[]} xRange - A two elements array containing the lower and higher ends of the x range to graph.
     * @param {number[]} yRange - A two elements array containing the lower and higher ends of the y range to graph.
     * @param {number} scaleX - The scale to apply on the X axis.
     * @param {number} scaleY - The scale to apply on the Y axis.
     * @param {string} title - An optional title for the graph. If not provided, tha name of the function is used. */
    (fn, xRange, yRange, scaleX, scaleY, title) => {
        createEl(parentEl, 'h1', {innerText: title || fn.name});
        const canvas = createEl(parentEl, 'canvas', {
            width: Math.ceil((xRange[1] - xRange[0]) * scaleX),
            height: Math.ceil((yRange[1] - yRange[0]) * scaleY)
        });
        const ctx = canvas.getContext('2d');
        const orgX = -xRange[0] * scaleX;
        const orgY = canvas.height + yRange[0] * scaleY;
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
        ctx.beginPath();
        ctx.strokeStyle = 'black';
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
    };

/** Creates a function that appends a table of expected vs. actual values of a function to the supplied element.
 * @param {HTMLElement} parentEl - The parent element to which the returned function will append tables.
 * @returns {RangeTester} - A function that can append a table to the provided parent element. */
 const rangeTester = parentEl =>
    /** Tests the values of a function and renders a table of expected vs. actual values.
     * @callback RangeTester
     * @param {Function} fn - The function to test.
     * @param {Array} data - The values to feed the function.
     * @param {Array} expected - The expected values of the function over the data, in the same order.
     * @param {string} title - An optional title for the test. If not provided, tha name of the function is used. */
     (fn, data, expected, title) => {
        createEl(parentEl, 'h1', {innerText: title || fn.name});
        const table = createEl(parentEl, 'table');
        const body = createEl(table, 'tbody');
        
        const expectedRow = createEl(body, 'tr');
        createEl(expectedRow, 'td', {_: '<b>Expected:</b>'});
        const actualRow = createEl(body, 'tr');
        createEl(actualRow, 'td', {_: '<b>Actual:</b>'});
        for (let i = 0; i < data.length; i++) {
            const actual = fn(data[i]);
            createEl(expectedRow, 'td', {_: expected[i]});
            createEl(actualRow, 'td', {
                _: actual,
                className: actual === expected[i] ? 'pass' : 'fail'
            });
        }
    };

/** A field value.
 * @typedef {object} FieldValue
 * @property {number} angle - The angle for the field value. Can be undefined for a scalar field.
 * @property {number} amplitude - The amplitude of the field value. May be undefined. */

/** A 2D scalar or vector field.
 * @callback Field
 * @param {number} x - The x coordinate.
 * @param {number} y - The y coordinate.
 * @returns {FieldValue} The value of the field at the point described by the coordinates. */

/** Creates a function that appends a 2D representation of a field to the supplied element.
 * @param {HTMLElement} parentEl - The parent element to which the returned function will append the field representation.
 * @returns {FieldTester} - A function that can append a field representation to the provided parent element. */
 const fieldTester = parentEl =>
    /** Tests the values of a function and renders a table of expected vs. actual values.
     * @callback FieldTester
     * @param {Field} fn - The field to test.
     * @param {Array} xRange - The lower and higher bounds of the x coordinate for the field representation.
     * @param {Array} yRange - The lower and higher bounds of the y coordinate for the field representation.
     * @param {number} scale - The scaling factor for the coordinates of the field representation on the screen.
     * @param {number} step - The step for the incrementation of the x and y coordinates, or the distance between the representations of two adjacent field values.
     * @param {string} title - An optional title for the test. If not provided, tha name of the function is used. */
     (fn, xRange, yRange, scale, step, title) =>{
        createEl(parentEl, 'h1', {innerText: title || fn.name});
        const canvas = createEl(parentEl, 'canvas', {
            width: Math.ceil((xRange[1] - xRange[0]) * scale),
            height: Math.ceil((yRange[1] - yRange[0]) * scale)
        });
        const ctx = canvas.getContext('2d');
        const orgX = -xRange[0] * scale;
        const orgY = canvas.height + yRange[0] * scale;
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
        ctx.strokeStyle = 'black';
        for (let x = xRange[0]; x <= xRange[1]; x += step) {
            for (let y = yRange[0]; y <= yRange[1]; y += step) {
                ctx.beginPath();
                const screenX = x * scale + orgX;
                const screenY = - y * scale + orgY;
                const fieldValue = fn(x, y);
                if (fieldValue) {
                    if (fieldValue.angle) {
                        ctx.moveTo(screenX, screenY);
                        const amplitude = fieldValue.amplitude || (step * scale * 0.75);
                        const angleInRadians = fieldValue.angle * Math.PI / halfCircle;
                        ctx.lineTo(screenX + amplitude * Math.cos(angleInRadians), screenY - amplitude * Math.sin(angleInRadians));
                        ctx.stroke();
                    }
                    else if (fieldValue.amplitude) {
                        ctx.ellipse(screenX, screenY, fieldValue.amplitude, fieldValue.amplitude, 0, 0, 2 * Math.PI);
                        ctx.fill();
                    }
                }
            }
        }
    };

export { interpolationTester, graphTester, rangeTester, fieldTester };