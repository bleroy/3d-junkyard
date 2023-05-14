// How to draw a circle with only integers, additions and bit shifts
// x = r.cosθ; y = r.sinθ; θ: 0-2π
// dx = -r.sinθ.dθ; dy = r.cosθ.dθ
// dx = -y.dθ; dy = x.dθ

// Binary decimal places, or how subpixel-precise we're getting.
// Screen coordinates are shifted right by that many bits from full-precision coords.
const bdp = 8;

function drawCircle(canvas, xc, yc, r) {
    const ctx = canvas.getContext("2d");
    // Let's draw some axes for reference
    ctx.fillStyle = "grey";
    ctx.moveTo(0, yc);
    ctx.lineTo(canvas.width, yc);
    ctx.moveTo(xc, 0);
    ctx.lineTo(xc, canvas.height);
    ctx.stroke();
    ctx.fillStyle = "black";
    // Find a good value for dθ:
    // If 2^(n - 1) < r <= 2^n, then 1/2 < (r / 2^n) <= 1
    // So using dθ = 1 / 2^n is a nice choice:
    // - the maximal step is slightly sub-pixel, so the circle will be continuous
    // - multiplying by dθ is the same as shifting n times to the right
    // Let's find n...
    // This, by the way, is also the simplest algorithm for integer logarithm of base 2
    let n = 0;
    for (let twopown = 1; twopown < r; n++, twopown <<= 1);

    // We'll need this later... Prepare arrays to receive sine and cosine values
    // as side effects of drawing a circle
    const sine = [], cosine = [];

    // Now we can start from (r, 0) and apply the differential equations at each step
    let x = r << bdp, y = 0, t = 0;
    while (x >= y) { // We only need draw 1/8th of the circle, symmetries will do the rest
        // Draw the current pixel and all its easily computable symmetries
        const [screenx, screeny] = [x >> bdp, y >> bdp];
        ctx.fillRect(xc + screenx, yc + screeny, 1, 1);
        ctx.fillRect(xc - screenx, yc + screeny, 1, 1);
        ctx.fillRect(xc + screenx, yc - screeny, 1, 1);
        ctx.fillRect(xc - screenx, yc - screeny, 1, 1);
        ctx.fillRect(xc + screeny, yc + screenx, 1, 1);
        ctx.fillRect(xc - screeny, yc + screenx, 1, 1);
        ctx.fillRect(xc + screeny, yc - screenx, 1, 1);
        ctx.fillRect(xc - screeny, yc - screenx, 1, 1);
        // Side effect: it's trivial to derive a table of sine and cosine values
        // from this algorithm while we're here...
        sine[t] = y;
        cosine[t] = x;
        t++;
        // Apply the differential equations
        [x, y] = [x - (y >> n), y + (x >> n)];
    }
    // Let's draw those sine and cosine graphs, since we have all the values
    const lenover2 = sine.length >> 1;
    const lenover4 = lenover2 >> 1;
    ctx.fillStyle = "orange";
    sine.forEach((sint, t) => {
        const tover4 = t >> 2;
        ctx.fillRect(xc + tover4, yc - (sint >> bdp), 1, 1);
        ctx.fillRect(xc - tover4, yc + (sint >> bdp), 1, 1);
        // sin(π/2 - θ) = cosθ
        ctx.fillRect(xc + lenover2 - tover4, yc - (cosine[t] >> bdp), 1, 1);
        ctx.fillRect(xc - lenover2 + tover4, yc + (cosine[t] >> bdp), 1, 1);
        // sin(π/2 + θ) = cosθ
        ctx.fillRect(xc + lenover2 + tover4, yc - (cosine[t] >> bdp), 1, 1);
        ctx.fillRect(xc - lenover2 - tover4, yc + (cosine[t] >> bdp), 1, 1);
        // sin(3π/4 + θ) = sin(π/4 - θ)
        ctx.fillRect(xc + lenover2 + lenover4 + tover4, yc - (sine[sine.length - t] >> bdp), 1, 1);
        ctx.fillRect(xc - lenover2 - lenover4 - tover4, yc + (sine[sine.length - t] >> bdp), 1, 1);
    });
    ctx.fillStyle = "blue";
    cosine.forEach((cost, t) => {
        const tover4 = t >> 2;
        ctx.fillRect(xc + tover4, yc - (cost >> bdp), 1, 1);
        ctx.fillRect(xc - tover4, yc - (cost >> bdp), 1, 1);
        // cos(π/2 - θ) = sinθ
        ctx.fillRect(xc + lenover2 - tover4, yc - (sine[t] >> bdp), 1, 1);
        ctx.fillRect(xc - lenover2 + tover4, yc - (sine[t] >> bdp), 1, 1);
        // cos(π/2 + θ) = -sinθ
        ctx.fillRect(xc + lenover2 + tover4, yc + (sine[t] >> bdp), 1, 1);
        ctx.fillRect(xc - lenover2 - tover4, yc + (sine[t] >> bdp), 1, 1);
        // cos(3π/4 + θ) = -cos(π/4 - θ)
        ctx.fillRect(xc + lenover2 + lenover4 + tover4, yc + (cosine[sine.length - t] >> bdp), 1, 1);
        ctx.fillRect(xc - lenover2 - lenover4 - tover4, yc + (cosine[sine.length - t] >> bdp), 1, 1);
    });
}