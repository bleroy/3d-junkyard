// Tests for the Complex class
// (c) Bertrand Le Roy
// Licensed under MIT

'use strict';

import { assert, describe, it } from '../lib/chicory.js';
import Complex from '../lib/complex.js';
const they = it;

export default describe('Complex numbers', () => {
    they("can be obtained from a real number", () => {
        assert.that(Complex.fromReal(2.4)).equals(new Complex(2.4, 0));
    });

    they("can be obtained from an imaginary number", () => {
        assert.that(Complex.fromImaginary(4.2)).equals(new Complex(0, 4.2));
    });

    they("can be obtained from real and imaginary parts", () => {
        assert.that(Complex.fromParts(1.2, 4.3)).equals(new Complex(1.2, 4.3));
    });

    they("can be obtained from their polar representation", () => {
        assert.that(Complex.fromPolar(2, Math.PI / 3))
            .equals(new Complex(1, Math.sqrt(3)));
    });

    they("have i, 0 and 1 static values defined", () => {
        assert.that(Complex.i).equals(new Complex(0, 1));
        assert.that(Complex.zero).equals(new Complex(0, 0));
        assert.that(Complex.one).equals(new Complex(1, 0));
    });

    they("have a modulus", () => {
        assert.that(new Complex(1, Math.sqrt(3)).modulus)
            .equals(2);
    });

    they("have an argument", () => {
        assert.that(new Complex(1, Math.sqrt(3)).argument)
            .equals(Math.PI / 3);
    });

    they("have an opposite", () => {
        assert.that(new Complex(1.2, 3.4).opposite)
            .equals(new Complex(-1.2, -3.4));
    });

    they("have a conjugate", () => {
        assert.that(new Complex(1.2, 3.4).conjugate)
            .equals(new Complex(1.2, -3.4));
    });

    they("have a string representation", () => {
        assert.that(new Complex(2.3, 4.5).toString()).equals("(2.3, 4.5)");
    });

    they("can be compared", () => {
        assert.that(new Complex(1.2, 3.4)).equals(new Complex(1.2, 3.4));
        assert.that(new Complex(1.2, 3.4)).isNot(new Complex(1.3, 3.4));
        assert.that(new Complex(1.2, 3.4)).isNot(new Complex(1.2, 3.3));
        assert.that(new Complex(1.2, 3.4)).isNot(new Complex(12, 34));
        assert.that(new Complex(1.2, 3.4).equals(new Complex(1.2, 3.4))).isTrue();
        assert.that(new Complex(1.2, 3.4).equals(new Complex(12, 34))).isFalse();
    });

    they("can be added together", () => {
        assert.that(new Complex(2.3, 4.5).plus(new Complex(3.7, 9.4)))
            .equals(new Complex(6, 13.9));
    });

    they("can be added to real numbers", () => {
        assert.that(new Complex(2.3, 4.5).plus(3.7))
            .equals(new Complex(6, 4.5));
    });

    they("can be subtracted from one another", () => {
        assert.that(new Complex(2.3, 4.5).minus(new Complex(3.7, 9.4)))
            .equals(new Complex(-1.4, -4.9));
    });

    they("can have real numbers subtracted from them", () => {
        assert.that(new Complex(2.3, 4.5).minus(3.7))
            .equals(new Complex(-1.4, 4.5));
    });

    they("can be multiplied together", () => {
        assert.that(new Complex(2, 4).times(new Complex(3, 9)))
            .equals(new Complex(-30, 30));
    });

    they("can be multiplied by real numbers", () => {
        assert.that(new Complex(2, 4).times(3))
            .equals(new Complex(6, 12));
    });

    they("can be divided by one another", () => {
        assert.that(new Complex(9, 12).over(new Complex(2, 1)))
            .equals(new Complex(6, 3));
    });

    they("can be divided by real numbers", () => {
        assert.that(new Complex(9, 12).over(3))
            .equals(new Complex(3, 4));
    });
});