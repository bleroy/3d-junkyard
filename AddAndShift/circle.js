// How to draw a circle with only integers, additions and bit shifts
// x = r.cosθ; y = r.sinθ; θ: 0-2π
// dx = -r.sinθ.dθ; dy = r.cosθ.dθ
// dx = -y.dθ; dy = x.dθ

// Binary decimal places, or how subpixel-precise we're getting.
// Screen coordinates are shifted right by that many bits from full-precision coords.
const bdp = 8;

function drawCircle(canvas, xc, yc, r,
    drawWithCanvas = true,
    drawWithDifferentialEquation = true,
    drawSineAndCosine = true,
    drawWithDiscriminatingFunction = true,
    loops = 1) {

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Let's draw some axes for reference
    ctx.fillStyle = "grey";
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.moveTo(0, yc);
    ctx.lineTo(canvas.width, yc);
    ctx.moveTo(xc, 0);
    ctx.lineTo(xc, canvas.height);
    ctx.stroke();

    let tCanvas = 0, tDiff = 0, tDisc = 0;
    if (drawWithCanvas) {
        // Draw the circle using tthe browser's implementation of arc.
        ctx.strokeStyle = "darkgreen";
        const before = performance.now();
        for (let i = 0; i < loops; i++) {
            ctx.beginPath();
            ctx.arc(xc, yc, r, 0, Math.PI * 2, true);
            ctx.stroke();
        }
        tCanvas = performance.now() - before;
    }

    if (drawWithDifferentialEquation) {
        ctx.fillStyle = "black";
        const before = performance.now();

        // We'll need this later... Prepare arrays to receive sine and cosine values
        // as side effects of drawing a circle
        const sine = [], cosine = [];

        for (let i = 0; i < loops; i++) {
            // This algorithm relies on the differential equation system for a circle.
            // From:
            // | x = r.cosθ
            // | y = r.sinθ
            // We can derive:
            // | dx = -r.sinθ.dθ = -y.dθ
            // | dy = r.cosθ.dθ = x.dθ
            // Find a good value for dθ:
            // If 2^(n - 1) < r <= 2^n, then 1/2 < (r / 2^n) <= 1
            // So using dθ = 1 / 2^n is a nice choice:
            // - the maximal step is slightly sub-pixel, so the circle will be continuous
            // - multiplying by dθ is the same as shifting n times to the right
            // Let's find n...
            // This, by the way, is also the simplest algorithm for integer logarithm of base 2
            let n = 0;
            for (let twopown = 1; twopown < r; n++, twopown <<= 1);

            // Now we can start from (r, 0) and apply the differential equations at each step
            let x = r << bdp, y = 0, t = 0;
            while (x >= y) { // We only need draw 1/8th of the circle, symmetries will do the rest
                const [screenx, screeny] = [x >> bdp, y >> bdp];
                drawPointAndSymmetries(ctx, xc, screenx, yc, screeny);
                // Side effect: it's trivial to derive a table of sine and cosine values
                // from this algorithm while we're here...
                sine[t] = y;
                cosine[t] = x;
                t++;
                // Apply the differential equations
                [x, y] = [x - (y >> n), y + (x >> n)];
            }
        }
        tDiff = performance.now() - before;

        if (drawSineAndCosine) {
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
    }

    if (drawWithDiscriminatingFunction) {
        ctx.fillStyle = "red";
        const before = performance.now();

        for (let i = 0; i < loops; i++) {
            // This algorithm is like walking the circle in the dark: make a step to the east,
            // evaluate if you're still inside the circle after that, and if not, make one step to the south.
            // The circle equation being x^2 + y^2 = r^2, f(x, y) = x^2 + y^2 - r^2 is a function that
            // evaluates as zero only if a (x, y) is on the circle, as a positive number outside of
            // the circle, and as a negative number inside the circle.
            // When we add 1 to x, the difference for the value of the function is:
            // f(x + 1, y) - f(x, y) = (x + 1)^2 - x^2 = 2x + 1
            // That means that every time we make a step to the east, the function changes by 2x + 1,
            // which is easily computed by shifting x one bit to the left and then adding 1.
            // If we determine that the new value is positive, we've stepped outside the circle,
            // so we must take a step to the south, and evaluate the new value for that pixel:
            // f(x, y - 1) - f(x, y) = 1 - 2y
            
            // Start with a value half a pixel inside the circle: f(0, r - 1/2) = 1/4 - r and 1/4 falls below precision.
            let x = 0, y = r, f = -r;
            drawPointAndSymmetries(ctx, xc, x, yc, y);
            while (x <= y) { // We only need draw 1/8th of the circle, symmetries will do the rest
                // Draw the current pixel and all its easily computable symmetries
                f += 1 + x << 1;
                x++;
                drawPointAndSymmetries(ctx, xc, x, yc, y);
                if (f > 0) {
                    f += 1 - y << 1;
                    y--;
                    drawPointAndSymmetries(ctx, xc, x, yc, y);
                }
            }
        }
        tDisc = performance.now() - before;
    }

    return [tCanvas / loops, tDiff / loops, tDisc / loops];
}

function drawPointAndSymmetries(ctx, xc, screenx, yc, screeny) {
    // Draw the current pixel and all its easily computable symmetries
    ctx.fillRect(xc + screenx, yc + screeny, 1, 1);
    ctx.fillRect(xc - screenx, yc + screeny, 1, 1);
    ctx.fillRect(xc + screenx, yc - screeny, 1, 1);
    ctx.fillRect(xc - screenx, yc - screeny, 1, 1);
    ctx.fillRect(xc + screeny, yc + screenx, 1, 1);
    ctx.fillRect(xc - screeny, yc + screenx, 1, 1);
    ctx.fillRect(xc + screeny, yc - screenx, 1, 1);
    ctx.fillRect(xc - screeny, yc - screenx, 1, 1);
}
