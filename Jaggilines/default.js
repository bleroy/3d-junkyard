// An experiment in rendering Rescue on Fractalus mountains on a web page
// (c) 2021 Bertrand Le Roy

// Self-imposed constraints:
// * The rendering algorithm must use only tools available to a 6502 processor, meaning avoiding
//   multiplications or floating point operations, preferring 16-bit addition, logical operations
//   and bitwise operations (The 6502 is 8-bit but 16-bit operations composition from 8-bit is easy enough).
// * Multiplication and division are acceptable if we strictly limit how many we do per frame.
//   See for example https://llx.com/Neil/a2/mult.html for 6502 multiplication and division implementations.
// * Valkyrie movement is also done using simple 16-bit arithmetic and lookup tables.
// * Math can be used to set-up the map and lookup tables.

'use strict';

import {
    mapSize, bitsBetweenTops, coordinateBits, overheadMapScalePowerOfTwo, viewportScalePowerOfTwo, viewportPowerOfTwoScreenPixelPerAngleUnit,
    viewportWidth, viewportHeight, viewportVerticalOffset, maxHeight, mazeHoleiness, viewDistance, defaultThrust,
    displacementAttenuationPower, fractalFlipBit, tick
} from './lib/settings.js';
import {
    sin, cos, tan, mod, distance, angleFromCoordinates, north, quarterCircle, halfCircle, fullCircle, findIndexOf
} from './lib/trigo.js';
import { clamp, vary } from './lib/random.js';
import { Map, OverheadMap } from './lib/map.js';
import { fractalusColorScale, fogShader } from './lib/color.js';
import { linearInterpolation, fractalInterpolation } from './lib/interpolation.js';
import { Viewport } from './lib/viewport.js';
import { Compass } from './lib/compass.js';
import { Valkyrie } from './lib/ship.js';
import { interpolationTester, graphTester, rangeTester, fieldTester } from './lib/test.js';

/** The number of ticks since the game started running. */
let frame = 0;

document.addEventListener('DOMContentLoaded', e => {
    const map = new Map(mapSize, maxHeight);
    const ship = new Valkyrie(
        bitsBetweenTops,
        coordinateBits,
        (1 << coordinateBits) >> 1,
        (1 << coordinateBits) >> 1,
        maxHeight + 10,
        defaultThrust,
        north, 0, 0, 1);
    const mapEl = document.getElementsByClassName('map')[0];
    const shipImg = document.getElementsByClassName('ship')[0];
    const coordContainer = document.getElementsByClassName('coord-container')[0];
    new OverheadMap(mapEl, shipImg, overheadMapScalePowerOfTwo, map, ship, coordContainer, fractalusColorScale(maxHeight), bitsBetweenTops);
    map.generateMaze(mazeHoleiness);
    const compassEl = document.getElementsByClassName('compass')[0];
    new Compass(compassEl, ship);
    const viewportEl = document.getElementById('viewport');
    new Viewport(
        viewportEl,
        viewportWidth,
        viewportHeight,
        viewportVerticalOffset,
        viewDistance,
        viewportScalePowerOfTwo,
        viewportPowerOfTwoScreenPixelPerAngleUnit,
        bitsBetweenTops,
        maxHeight,
        displacementAttenuationPower,
        map,
        ship,
        fractalInterpolation(bitsBetweenTops, maxHeight, displacementAttenuationPower, fractalFlipBit),
        fogShader(viewDistance));

    // Controls
    let paused = false;
    const playBtn = document.getElementsByClassName('play-btn')[0];
    playBtn.addEventListener('click', () => {
        paused = false;
    });
    const pauseBtn = document.getElementsByClassName('pause-btn')[0];
    pauseBtn.addEventListener('click', () => {
        paused = true;
    });

    // To make the game smoother, we prefer dropped frames to uneven timing -> setInterval, not setTimeout
    setInterval(gameLoop, tick);

    var rendering = false;
    function gameLoop() {
        if (!paused) {
            frame++;
            if (rendering) return; // Drop the frame if not done rendering but JS being single-threaded... this is not that useful. Then again, we could offset processing to a worker.
            rendering = true;
            ship.move();
            rendering = false;
        }
    }

    // Tests
    const testSection = document.getElementById("testSection");
    const testGraph = graphTester(testSection);
    const testRange = rangeTester(testSection);
    const testField = fieldTester(testSection);
    const testInterpolation = interpolationTester(testSection);
    const runTestsButton = document.getElementById("runTests");
    runTestsButton.addEventListener("click", () => {
        testSection.innerHTML = "";
        testGraph(sin, [-1440, 1440], [-1 << bitsBetweenTops, 1 << bitsBetweenTops], 1/4, 50 / (1 << bitsBetweenTops));
        testGraph(cos, [-1440, 1440], [-1 << bitsBetweenTops, 1 << bitsBetweenTops], 1/4, 50 / (1 << bitsBetweenTops));
        testGraph(tan, [-2880, 2880], [-1500, 1500], 1/8, 1/10);
        testGraph(x => clamp(x, 10), [-1, 15], [-1, 11], 5, 5, "clamp");
        testGraph(x => vary(x, 5, 40), [-10, 60], [-1, 56], 1, 1, "vary");
        testGraph(x => mod(x, 10), [-25, 25], [-1, 11], 5, 5, "mod");
        testRange(
            x => findIndexOf(x, [3, 7, 15, 15, 16, 18]),
            [...Array(20).keys()],
            [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 4, 4, 5, 5, 5, 5],
            "findIndexOf");
        testField(
            (x, y) => ({angle: angleFromCoordinates(x, y)}),
            [-10, 10], [-10, 10], 10, 1,
            "angleFromCoordinates");
        testField(
            (x, y) => ({amplitude: distance(0, 0, x, y) >> 2}),
            [-10, 10], [-10, 10], 10, 1,
            "distanceFromCenter");
        const lowScreenY = 64;
        const highScreenY = 255;
        const interpolationDisplacement = (highScreenY - lowScreenY) >> displacementAttenuationPower;
        const fractalAlgorithm = fractalInterpolation(bitsBetweenTops, maxHeight, displacementAttenuationPower, fractalFlipBit);
        testInterpolation(linearInterpolation, 512, 256, 0, maxHeight, lowScreenY, highScreenY, interpolationDisplacement, 'linear interpolation');
        testInterpolation(fractalAlgorithm, 512, 256, 0, maxHeight, lowScreenY, highScreenY, interpolationDisplacement, 'fractal interpolation 0-max');
        testInterpolation(fractalAlgorithm, 512, 256, 0, 0, lowScreenY, lowScreenY, interpolationDisplacement, 'fractal interpolation 0-0');
        testInterpolation(fractalAlgorithm, 512, 256, maxHeight, maxHeight, highScreenY, highScreenY, interpolationDisplacement, 'fractal interpolation max-max');
    });
});
