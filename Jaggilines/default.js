// An experiment in rendering Rescue on Fractalus mountains on a web page
// (c) 2021 Bertrand Le Roy

'use strict';

const mapSize = 16;
const maxHeight = 255;
const maxVariation = 15;
const defaultSpeed = 0.1;
const north = 90;
const east = 0;
const west = 180;
const south = 270;
const tick = 100;

// TODO: add a smoothness parameter that changes the probability distribution
// (rough is centered around 1, smooth is centered around 0)

const clamp = val => val < 0 ? 0 : val > maxHeight ? maxHeight : Math.floor(val);
const vary = (val, varyBy = maxVariation) => clamp(val + Math.random() * 2 * varyBy - varyBy);
const varyFromAverage = (vals, varyBy = maxVariation) => vary(vals.reduce((acc, val) => acc + val, 0) / vals.length, varyBy);
const cos = deg => Math.cos(deg * Math.PI / 180);
const sin = deg => Math.sin(deg * Math.PI / 180);
const mod = (n, m) => ((n % m) + m) % m;

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
        return this.#map[mod(row, this.size)][mod(col, this.size)];
    }

    set(row, col, val) {
        val = Math.floor(val);
        row = mod(row, this.size);
        col = mod(col, this.size);
        this.#map[row][col] = val;
        this.#changeHandlers.forEach(handler => handler(row, col, val));
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
            this.get(row, col - halfSize)], maxVariation * size));
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
            this.get(row + halfSize * 2, col + halfSize * 2)], maxVariation * size));
        this.#square(row + halfSize * 2, col + halfSize, size);
        this.#square(row + halfSize, col + halfSize * 2, size);
    }
}

class OverheadMap {
    #context;
    #pixelCanvas;
    #pixelContext;
    #shipEl;

    constructor(canvas, shipImg, scale, map, ship, colorScale) {
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
        this.ship = ship;
        this.#shipEl = shipImg;
        this.moveShip();

        map.addChangeListener((row, col, val) => {
            const color = this.colorScale(val);
            const pixelData = new Uint8ClampedArray([color.r, color.g, color.b, 255]);
            const pixelImageData = new ImageData(pixelData, 1, 1);
            this.#pixelContext.putImageData(pixelImageData, 0, 0);
            this.#context.drawImage(this.#pixelCanvas, row * scale, col * scale, scale, scale);
        });
        ship.addMoveListener(ship => {
            this.moveShip()
        });
    }

    moveShip() {
        console.log(this.ship.x, this.ship.y);
        this.#shipEl.style.top = (this.ship.y * this.scale - this.#shipEl.clientHeight / 2) + 'px';
        this.#shipEl.style.left = (this.ship.x * this.scale - this.#shipEl.clientWidth / 2) + 'px';
        this.#shipEl.style.transform = `rotate(${north - this.ship.heading}deg)`;
    }
}

class Valkyrie {
    #moveHandlers;

    constructor(x = mapSize / 2, y = mapSize / 2, z = 0, speed = defaultSpeed, heading = north, pitch = 0, roll = 0, rollToAngle = 0.1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.speed = speed;
        this.heading = heading;
        this.pitch = pitch;
        this.roll = roll;
        this.rollToAngle = rollToAngle;
        this.#moveHandlers = [];
    }

    addMoveListener(handler) {
        this.#moveHandlers.push(handler);
    }

    removeMoveListener(handler) {
        const i = this.#moveHandlers.indexOf(handler);
        if (i !== -1) {
            this.#moveHandlers.splice(i, 1);
        }
    }

    move() {
        // TODO: handle mountain collision and top altitude
        this.heading += this.roll * this.rollToAngle;
        this.x = mod(this.x + this.speed * cos(this.heading) * cos(this.pitch), mapSize);
        this.y = mod(this.y  -this.speed * sin(this.heading) * cos(this.pitch), mapSize);
        this.z += this.speed * sin(this.pitch);
        this.#moveHandlers.forEach(handler => handler(this));
    }
}

document.addEventListener('DOMContentLoaded', e => {
    const map = new Map(mapSize);
    const mapEl = document.getElementsByClassName('map')[0];
    const shipImg = document.getElementsByClassName('ship')[0];
    const ship = new Valkyrie();
    const overhead = new OverheadMap(mapEl, shipImg, 8, map, ship,
        val => ({
            r: Math.floor(0x68 + 0x80 * val / maxHeight),
            g: Math.floor(0x60 + 0x40 * val / maxHeight),
            b: Math.floor(0 + 0x40 * val / maxHeight)
        }));
    map.generate();
    setTimeout(gameLoop, tick);

    function gameLoop() {
        ship.move();
        setTimeout(gameLoop, tick);
    }
});
