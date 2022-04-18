// Tests for the FFT function
// (c) Bertrand Le Roy
// Licensed under MIT

'use strict';

import { describe, it, graph } from '../lib/chicoryFunc.js';
import { cosine } from '../lib/func.js';
import { spectrum } from '../lib/fft.js';

export default describe('Fast Fourier Transform', () => {
    it("shows the spectrum of a cosine to be a delta", () => {
        const precision = 2;
        const scale = 1;
        function expected(x0) {
            return x => x.toPrecision(precision) !== x0.toPrecision(precision)
                ? 0 : 256;
        }
        const cosineSpectrum = spectrum(cosine);
        return graph(expected(2), cosineSpectrum, [0, 512], [0, 260], scale, scale, 1);
    });
});