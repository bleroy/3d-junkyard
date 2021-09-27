// HTML utilities for our fractal experiment
// (c) 2021 Bertrand Le Roy

'use strict';

/** Creates an element of the supplied tag type and with the specified attributes.
 * @param {HTMLElement} parentEl - A parent element to append the new element to.
 * @param {string} tag - The tag name.
 * @param {object} attr - An object containing all the attributes to set on the element.
 * @returns {HTMLElement} The new element. */
 const createEl = (parentEl, tag, attr) => {
    const el = parentEl.ownerDocument.createElement(tag);
    if (attr) {
        for (let option in attr) {
            if (option === '_') el.innerHTML = attr[option];
            else el[option] = attr[option];
        }
    }
    parentEl.appendChild(el);
    return el;
}

export { createEl };