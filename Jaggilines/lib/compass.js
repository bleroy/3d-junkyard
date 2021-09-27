// Compass component for our fractal experiment
// (c) 2021 Bertrand Le Roy

'use strict';

import { mod, fullCircle, quarterCircle } from './trigo.js';

/** A compass showing what direction the ship is headed. */
class Compass {
    #el;
    #elWidth;

    /** Constructs a compass targeted at an element and for a ship.
     * @param {HTMLElement} el - The element for the compass.
     * @param {Valkyrie} ship - The ship. */
    constructor(el, ship) {
        this.#el = el;
        this.#elWidth = el.scrollWidth / 5;
        this.ship = ship;

        ship.addMoveListener(() => {
            this.update();
        });
    }

    /** Updates the compass from the current state of the ship. */
    update() {
        const offset = this.#elWidth * (mod((fullCircle - this.ship.heading) / quarterCircle - 3, 4) + 0.5);
        this.#el.style.left = -offset + 'px';
    }
}

export { Compass };