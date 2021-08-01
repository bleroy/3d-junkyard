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
        this.#map = Array(size).fill().map(_ => Array(size).fill(0));
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
        return this.#map[row % this.size][col % this.size];
    }

    set(row, col, val) {
        val = Math.floor(val);
        this.#map[row % this.size][col % this.size] = val;
        this.#changeHandlers.forEach(handler => handler(row % this.size, col % this.size, val));
    }

    generate() {
        // Apply more or less [diamond-square algorithm](https://en.wikipedia.org/wiki/Diamond-square_algorithm)
        // There are better algorithms but that will do.
        // Seed the top-left corner
        this.set(0, 0, Math.random() * maxHeight);
        this.#diamond(0, 0, this.size);
    }

    #square(row, col, size) {
        if (size <= 1) return;
        const halfSize = Math.floor(size / 2);
        this.set(row + halfSize, col + halfSize, varyFromAverage([
            this.get(row - halfSize, col),
            this.get(row + halfSize, col),
            this.get(row, col + halfSize),
            this.get(row, col - halfSize)]));
            this.#diamond(row, col, halfSize);
            this.#diamond(row - halfSize, col, halfSize);
        }

    #diamond(row, col, size) {
        if (size <= 1) return;
        const halfSize = Math.floor(size / 2);
        this.set(row + halfSize, col + halfSize, varyFromAverage([
            this.get(row, col),
            this.get(row, col + halfSize * 2),
            this.get(row + halfSize * 2, col),
            this.get(row + halfSize * 2, col + halfSize * 2)]));
        this.#square(row + halfSize * 2, col + halfSize, size);
        this.#square(row + halfSize, col + halfSize * 2, size);
    }
}

class OverheadMap {
    #context;
    #pixelCanvas;
    #pixelContext;

    constructor(canvas, scale, map, colorScale) {
        this.canvas = canvas;
        this.#context = canvas.getContext('2d');
        this.#context.imageSmoothingEnabled = false;
        const doc = canvas.ownerDocument;
        this.#pixelCanvas = doc.createElement('canvas');
        this.#pixelCanvas.width = 1;
        this.#pixelCanvas.height = 1;
        this.#pixelContext = this.#pixelCanvas.getContext('2d');
        this.#pixelContext.imageSmoothingEnabled = false;
        this.scale = scale;
        this.map = map;
        this.colorScale = colorScale;

        map.addChangeListener((row, col, val) => {
            const color = this.colorScale(val);
            const pixelData = new Uint8ClampedArray([color.r, color.g, color.b, 255]);
            const pixelImageData = new ImageData(pixelData, 1, 1);
            this.#pixelContext.putImageData(pixelImageData, 0, 0, 0, 0);
            this.#context.drawImage(this.#pixelCanvas, row * scale, col * scale, scale, sccale);
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
