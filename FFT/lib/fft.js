// Fast Fourier Transform library using the Cooley–Tukey algorithm
// There are more efficient implementations that minimize auxiliary storage
// requirements and data copying, but this for teaching FFT, not optimal perf.
// (c) Bertrand Le Roy under MIT license

'use strict';

import Complex from './complex.js';

function dft(signal, start = 0, N = signal.length, step = 1) {
    if (N <= 1) {
        return [signal[start]];
    }
    const X = [
        ...dft(signal, start, N / 2, step * 2),
        ...dft(signal, start + step, N / 2, step * 2)
    ];
    for (let k = 0; k < N / 2; k++) {
        const p = new Complex(X[k]);
        const q = Complex.fromPolar(1, -2 * k * Math.PI / N).times(X[k + N / 2]);
        X[k] = p.plus(q);
        X[k + N / 2] = p.minus(q);
    }
    return X;
}

function idft(signal) {
    return dft(signal.map(xk => new Complex(xk).conjugate))
        .map(Xk => Xk.conjugate.over(signal.length));
}

function spectrum(signal) {
    const full = dft(signal).map(sample => sample.modulus);
    return full.slice(0, full.length / 2);
}

export { dft, idft, spectrum };