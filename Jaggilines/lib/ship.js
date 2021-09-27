// Spaceship component for our fractal experiment
// (c) 2021 Bertrand Le Roy

'use strict';

import { clamp } from './random.js';
import { mod, cos, sin, fullCircle } from './trigo.js';

/** Handler for ship movement.
 * @callback ShipMovementHandler
 * @param {number} row - The row where the change happened.
 * @param {number} col - The column where the change happened.
 * @param {number} val - The new elevation value at (row, col). */

/** Our ship.
 * @property {number} x - The x coordinate.
 * @property {number} y - The y coordinate.
 * @property {number} z - The z coordinate.
 * @property {number} thrust - The thrust.
 * @property {number} heading - The direction the ship is heading.
 * @property {number} pitch - The pitch angle of the ship. 0 means horizontal, positive values point up.
 * @property {number} roll - The roll angle of the ship. 0 means horizontal, positive values roll to the left.
 * @property {number} rollToAngle - The number of units of angle the ship's heading turns by on each tick per roll unit of angle.
 * This determines how quickly the ship turns when rolling. */
class Valkyrie {
    #moveHandlers;

    /** Create a new ship
     * @param {number} x - The initial x coordinate.
     * @param {number} y - The initial y coordinate.
     * @param {number} z - The initial z coordinate.
     * @param {number} thrust - The initial thrust.
     * @param {number} heading - The initial direction the ship is heading.
     * @param {number} pitch - The initial pitch angle of the ship. 0 means horizontal, positive values point up.
     * @param {number} roll - The initial roll angle of the ship. 0 means horizontal, positive values roll to the left.
     * @param {number} rollToAngle - The number of units of angle the ship's heading turns by on each tick per roll unit of angle.
     * This determines how quickly the ship turns when rolling.
     */
    constructor(
        bitsBetweenTops,
        coordinateBits,
        x = (1 << coordinateBits) >> 1,
        y = (1 << coordinateBits) >> 1,
        z = maxHeight,
        thrust = defaultThrust,
        heading = north,
        pitch = 0,
        roll = 0,
        rollToAngle = 1) {

        this.bitsBetweenTops = bitsBetweenTops;
        this.coordinateBits = coordinateBits;
        this.x = x;
        this.y = y;
        this.z = z;
        this.thrust = thrust;
        this.heading = heading;
        this.pitch = pitch;
        this.roll = roll;
        this.rollToAngle = rollToAngle;
        this.#moveHandlers = [];
    }

    /** Add a listener for move events from this ship.
     * @param {ShipMovementHandler} handler - The event handler to add. */
    addMoveListener(handler) {
        this.#moveHandlers.push(handler);
    }

    /** Remove a move event listener.
     * @param {ShipMovementHandler} handler - The event handler to remove. */
     removeMoveListener(handler) {
        const i = this.#moveHandlers.indexOf(handler);
        if (i !== -1) {
            this.#moveHandlers.splice(i, 1);
        }
    }

    /** Perform the changes in ship state for the next tick. */
    move() {
        // TODO: handle mountain collision and top altitude
        this.heading = mod(this.heading + this.roll * this.rollToAngle, fullCircle);
        this.x = mod(this.x + (this.thrust * cos(this.heading) * cos(this.pitch) >> this.bitsBetweenTops >> this.bitsBetweenTops), 1 << this.coordinateBits);
        this.y = mod(this.y - (this.thrust * sin(this.heading) * cos(this.pitch) >> this.bitsBetweenTops >> this.bitsBetweenTops), 1 << this.coordinateBits);
        this.z = clamp(this.z + (this.thrust * sin(this.pitch) >> this.bitsBetweenTops), 1 << this.coordinateBits);
        this.#moveHandlers.forEach(handler => handler(this));
    }
}

export { Valkyrie }