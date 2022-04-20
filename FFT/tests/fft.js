// Tests for the FFT function
// (c) Bertrand Le Roy
// Licensed under MIT

'use strict';

import { describe, it, graph, assert } from '../lib/chicoryFunc.js';
import { range, cosine, gaussian } from '../lib/func.js';
import { spectrum, dft } from '../lib/fft.js';
import Complex from '../lib/complex.js';

export default describe('Fast Fourier Transform', () => {
    it("does the same as a slow Fourier transform", () => {
        function sft(signal) {
            const result = [];
            const N = signal.length;
            for (let k of range(N)) {
                let xk = Complex.zero;
                for (let n of range(N)) {
                    xk = xk.plus(Complex.fromPolar(1, -2 * Math.PI * k * n / N).times(signal[n]));
                }
                result[k] = xk;
            }
            return result;
        }
        const gauss = gaussian(255, 20, 1);
        const fastGaussian = dft(gauss);
        const slowGaussian = sft(gauss);
        assert.that(fastGaussian).approximates(slowGaussian, 1E-10);
    });

    it("shows the spectrum of a cosine to be a delta", () => {
        const precision = 1;
        const period = Math.PI / 2;
        function expected(x0) {
            return x => x.toPrecision(precision) !== x0.toPrecision(precision)
                ? 0 : 256;
        }
        const cosineSpectrum = spectrum(cosine(period));
        return graph(expected(2 * Math.PI / period), cosineSpectrum,
            [0, 255], [0, 260], 2, 0.5, 3);
    });

    // This test is not great, the transformed Gaussian diverges
    // substantially when farther than the standard deviation.
    it("changes a Gaussian to a Gaussian", () => {
        const sd = 0.1;
        function expected(sd) {
            const height = 1.07 / sd;
            const csd = 1.8 / sd;
            return k => height * Math.pow(Math.E, -k * k / csd / csd / 2);
        }
        const gauss = gaussian(0, sd, 1);
        const gaussianSpectrum = spectrum(gauss);
        return graph(expected(sd), gaussianSpectrum,
            [0, 255], [0, 130 * sd], 2, 2 / sd, 1.8);
    });
});