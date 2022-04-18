// Tests for func utils
// (c) Bertrand Le Roy
// Licensed under MIT

'use strict';

import { assert, describe, it, graph } from '../lib/chicoryFunc.js';
import { range, func, sine, delta } from '../lib/func.js';

export default describe('Function samples', () => {
    describe('Range', () => {
        it("creates ranges from zero to the parameter", () => {
            assert.that(range(5)).equals([0, 1, 2, 3, 4]);
        });
    });

    describe('Func', () => {
        it("creates function samples from a Lambda", () => {
            assert.that(func(x => x * x, 5)).equals([0, 1, 4, 9, 16]);
        });

        it("creates function samples for the values of a Lambda over a coordinate interval", () => {
            assert.that(func(x => x * x, 5, 2, 10))
                .equals([4, 16, 36, 64, 100]);
        });
    });

    describe('Sine', () => {
        const sin = x => Math.sin(x);
        it("samples the sine function", () => {
            const scale = 512 / 2 / Math.PI;
            assert.that(sine).samples(sin, 0, 2 * Math.PI);
            return graph(sin, sine, [0, 2 * Math.PI], [-1.1, 1.1], scale, scale);
        });
    });

    describe('Delta', () => {
        const precision = 3;
        function expected(x0) {
            return x => x.toPrecision(precision) !== x0.toPrecision(precision)
                ? 0 : 1;
        }
        it("samples the delta function", () => {
            const scale = 1;
            const x0 = 255;
            assert.that(delta(x0)).samples(expected(x0), 0, 511);
            return graph(expected(x0), delta(x0), [0, 512], [-0.1, 1.1], scale, 50);
        });
    });
});
