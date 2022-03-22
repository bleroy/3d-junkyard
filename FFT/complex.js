// Complex numbers library
// (c) Bertrand Le Roy under MIT license

'use strict';

const precision = 16;

class Complex {
    constructor(real, imaginary) {
        this.real = real;
        this.imaginary = imaginary;
    }

    static FromReal(real) { return new Complex(real, 0); }
    static FromImaginary(imaginary) { return new Complex(0, imaginary); }
    static FromParts(real, imaginary) { return new Complex(real, imaginary); }
    static FromPolar(modulus, argument) { return new Complex(modulus * Math.cos(argument), modulus * Math.sin(argument)); }
    static i = new Complex(0, 1);
    static zero = new Complex(0, 0);
    static one = new Complex(1, 0);

    get modulus() { return Math.sqrt(this.real * this.real + this.imaginary * this.imaginary); }
    get argument() { return Math.atan2(this.imaginary, this.real); }
    get opposite() { return new Complex(-this.real, -this.imaginary); }
    get conjugate() { return new Complex(this.real, -this.imaginary); }

    toString() { return `(${this.real}, ${this.imaginary})`; }

    // Until JS has operator overload (https://github.com/tc39/proposal-operator-overloading)...
    equals(other) {
        if (typeof(other) === 'number') return this.real === other && this.imaginary === 0;
        return this.real.toPrecision(precision) === other.real.toPrecision(precision)
            && this.imaginary.toPrecision(precision) === other.imaginary.toPrecision(precision);
    }
    plus(other) {
        if (typeof(other) === 'number') return new Complex(other + this.real, this.imaginary);
        return new Complex(this.real + other.real, this.imaginary + other.imaginary);
    }
    minus(other) {
        if (typeof(other) === 'number') return new Complex(this.real - other, this.imaginary);
        return new Complex(this.real - other.real, this.imaginary - other.imaginary);
    }
    times(other) {
        if (typeof(other) === 'number')  return new Complex(other * this.real, other * this.imaginary);
        return new Complex(this.real * other.real - this.imaginary * other.imaginary, this.real * other.imaginary + this.imaginary * other.real);
    }
    over(other) {
        if (typeof(other) === 'number')  return new Complex(this.real / other, this.imaginary / other);
        const denominator = other.real * other.real + other.imaginary * other.imaginary;
        return new Complex(
            (this.real * other.real + this.imaginary * other.imaginary) / denominator,
            (this.imaginary * other.real - this.real * other.imaginary) / denominator
        );
    }
}

export default Complex;