// An experiment in rendering Rescue on Fractalus mountains on a web page
// (c) 2021 Bertrand Le Roy

'use strict';

const mapSize = 16;
const maxHeight = 255;
const maxVariation = 5;

const clamp = val => val < 0 ? 0 : val > maxHeight ? maxHeight : Math.floor(val);
const vary = val => clamp(val + (Math.random() * 2 * maxVariation - maxVariation));
const varyFromAverage = vals => vary(vals.reduce((acc, val) => acc + val, 0) / vals.length);

class Map {
    #map;
    #changeHandlers;

    constructor(size) {
        this.size = size;
        this.#changeHandlers = [];

        // Initialize empty map
        this.#map = Array(size).map(_ => Array(size));
    }

    addChangeListener(handler) {
        this.#changeHandlers.push(handler);
    }

    removeChangeListener(handler) {
        const i = this.#changeHandlers.indexOf(handler);
        if (i !== -1) {
            this.#changeHandlers.splice(i, 1);
        }
    }

    get(row, col) {
        return this.#map[row % this.size, col % this.size];
    }

    set(row, col, val) {
        this.#map[row % this.size][col % this.size] = val;
        this.#changeHandlers.forEach(handler => handler(row % this.size, col % this.size, val));
    }

    generate() {
        // Apply more or less [diamond-square algorithm](https://en.wikipedia.org/wiki/Diamond-square_algorithm)
        // There are better algorithms but that will do.
        // Seed the top-left corner
        this.set(0, 0, Math.random() * maxHeight);
        this.#square(0, 0, this.size);
    }

    #square(row, col, size) {
        if (size <= 1) return;
        const halfSize = Math.floor(size / 2);
        this.set(row + halfSize, col + halfSize, varyFromAverage([
            this.get(row, col + halfSize),
            this.get(row + halfSize, col),
            this.get(row + halfSize, col + halfSize * 2),
            this.get(row + halfSize * 2, col + halfSize)]));
        this.#diamond(row + halfSize, col + halfSize, halfSize);
    }

    #diamond(row, col, size) {
        if (size <= 1) return;
        this.set(row + halfSize, col + halfSize, varyFromAverage([
            this.get(row, col + halfSize),
            this.get(row, col - halfSize),
            this.get(row + halfSize, col),
            this.get(row - halfSize, col)]));
        this.#square(row, col, halfSize);
        this.#square(row + halfSize, col, halfSize);
        this.#square(row, col + halfSize, halfSize);
        this.#square(row + halfSize, col + halfSize, halfSize);
    }
}

class OverheadMap {
    #context;
    #pixel;

    constructor(canvas, scale, map, colorScale) {
        this.canvas = canvas;
        this.#context = canvas.getContext('2d');
        this.#context.imageSmoothingEnabled = false;
        const pixelCanvas = document.createElement('canvas');
        pixelCanvas.width = 1;
        pixelCanvas.height = 1;
        const pixelContext = pixelCanvas.getContext('2d');
        this.#pixel = pixelContext.createImageData(1, 1);
        this.scale = scale;
        this.map = map;
        this.colorScale = colorScale;

        map.addChangeListener((row, col, val) => {
            const pixel = this.#pixel;
            const color = this.colorScale(val);
            pixel[0] = color.r;
            pixel[1] = color.g;
            pixel[2] = color.b;
            this.#context.putImageData(pixel, row, col, 0, 0, this.scale, this.scale);
        });
    }
}

document.addEventListener('DOMContentLoaded', e => {
    const map = new Map(mapSize);
    const mapEl = document.getElementsByClassName('map')[0];
    const overhead = new OverheadMap(mapEl, 4, map,
        val => ({
            r: Math.floor(255 * val / maxHeight),
            g: Math.floor(255 * (maxHeight - val) / maxHeight),
            b: Math.floor(255 * (maxHeight - val) / maxHeight)
        }));
    map.generate();
});
