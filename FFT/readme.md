# Fun with Fourier Transforms

Nowadays all we hear about around digital image processing is machine learning. Yet there's another technique that's [been around forever](https://www.cis.rit.edu/class/simg716/Gauss_History_FFT.pdf), that's relatively simple to understand, and that can be used for a wide variety of applications such as Optical Character Recognition. That technique is Fourier analysis, and more precisely the [Fast Fourier Transform](https://en.wikipedia.org/wiki/Fast_Fourier_transform) (FFT).

FFT transforms a signal (amplitude variations over time and/or space) into its harmonic components. What does harmonic mean? Basically sine waves: instead of considering the direct variations in amplitude of the signal, we decompose these variations into a weighed sum of single frequency oscillations. We can then represent the same signal as a graph with the frequency on the X axis and the weight of each frequency as the Y axis.

This is also known under the name "spectrum". We're all familiar with the spectral decomposition of light by a prism, which is the decomposition of a color into pure colors. A pure color is just a light wave that is of one single frequency, a perfect electromagnetic sine wave.

![Astroskiandhike, CC BY-SA 4.0 <https://creativecommons.org/licenses/by-sa/4.0>, via Wikimedia Commons](https://upload.wikimedia.org/wikipedia/commons/5/5f/Triangular_prism_and_spectrum.svg)

## First, a short refresher on complex numbers

For the mathematical part of this article, we'll deal with complex numbers, because they are so much better when dealing with sine waves than real numbers. Don't be scared, complex arithmetic is not that complicated despite what you may remember from high school maths.

Feel free to skip all the maths part of this article however, we'll have enough fun stuff to play with that doesn't require any.

Complex numbers have two components: a real component and an "imaginary" component. A real number is just a complex number with a zero imaginary part. An imaginary number is a complex number with a zero real part.

The complex number with a $0$ real part and an imaginary part of $1$ is called $i$.

The most common notation for a complex number with a real part of $a$ and an imaginary part of $b$ is:

$$ a+ib $$

To add two complex numbers, just add the real parts together, and the imaginary parts together:

$$ (a+ib) + (c+id) = (a+c) + i(b+d) $$

Things get more interesting with multiplication, but are easy to derive from the axiom that $i \times i = -1$:

$$ (a+ib)\times(c+id) = (ac-bd) + i(ad+bc) $$

The real and imaginary parts of a complex number can be viewed as the $a$ and $b$ coordinates on a plane, which we call the complex plane. There is then an alternative notation for complex numbers that uses the distance $r$ from the origin (called the *modulus*) and the angle $\theta$ from the horizontal real axis to the line joining the origin to the complex number (called the *argument*). For reasons that are pretty neat, but that I won't get into, this can be efficiently represented as:

$$ re^{i\theta} $$

What's convenient about this notation is that the multiplication is a lot easier to compute. The amplitudes multiply as expected, and the angles *add up*:

$$ re^{i\theta} \times r'e^{i\theta'} = rr'e^{i(\theta+\theta')} $$

In this notation, it's addition that's trickier.

Here's an illustration of what we've learned so far about the angular notation:

![Adding and multiplyin complex numbers](assets/AngularComplexOperations.png)

So why do complex numbers work so well with sine waves? Well, simply because if you remember the simplest of trigonometry, the definitions of sine and cosine enable us to go easily from the angular notation back to the coordinate notation. The complex number on the plane forms a right triangle where $a$ and $b$ coordinates are the adjacent and opposed sides to the $\theta$ angle, and $r$ is the hypothenuse.

$$ 
    \begin{cases}
    a = rcos\theta \\
    b = rsin\theta
    \end{cases}
 $$

In other words, the cosine and sine of the angle are the coordinates of $e^{i\theta}$ on the complex plane. An exponential being easier to work with than sines and cosines, this explains why physicists use complex exponential notation so much when working with waves.

## Slow Fourier Transform

Let's start with the *reverse* Fourier transform, the one that gets you back the original wave from its spectral representation. The formula for the inverse discrete Fourier transform of an array of $N$ numbers is:

$$ x_n = \frac{1}{N}\sum_{k=0}^{N-1} X_k e^{i \frac{2\pi}{N}kn} $$

This is pretty straightforward, we're just multiplying harmonics of increasing frequency with their weights, and that gives us the wave form.

Interestingly, the direct Fourier transform looks almost exactly the same:

$$ X_k = \sum_{n=0}^{N-1} x_n e^{-i \frac{2\pi}{N}nk} $$

This is convenient as it means the algorithm for the direct and reverse transforms is going to be nearly identical.

Of course the complexity of a brute force implementation of this formula is $O(N^2)$, which is not great.

## Implementing one-dimensional Cooley-Tukey

Fast Fourier Transform really is a category of algorithms more than a single algorithm. All known FFT algorithms have $O(NlogN)$ complexity.

In this article, we'll use Cooley-Tukey, which is a simple divide and conquer implementation that takes advantage of the fact that the FFTs of the even-indexed samples and of the odd-indexed samples for the signal look very much the same, apart from a multiplicative factor, and are each smaller transforms that only require half the terms.

In other words, we can split a FFT into two smaller FFTs that each use half the data. Assuming we started with a sample size that's a power of two, we can keep doing that until we reach a size sample of 1 and the transform is trivial. Doing so requires $log_2(N)$ subdivisions, and then adding the results back up the recursion, which gives the $N$ multiplicator in the complexity.