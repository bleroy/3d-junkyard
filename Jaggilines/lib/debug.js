// Visual debugger component for our fractal experiment
// (c) 2021 Bertrand Le Roy

'use strict';

import { OverheadMap } from "./map.js";
import { Viewport } from "./viewport.js";

/** A visual debugging component for viewport rendering. */
class Debugger {
    /** Builds a new debugger.
     * @param {Viewport} viewport - The viewport to monitor
     * @param {OverheadMap} overheadmap - The overhead map that will display debug info. */
    constructor(viewport, overheadmap) {
        this.viewport = viewport;
        this.overheadmap = overheadmap;

        const parent = viewport.canvas.parentElement;
        parent.addEventListener('click', e => {
            const x = (e.clientX - parent.offsetLeft) >> this.viewport.scalePowerOfTwo;
            const y = (e.clientY - parent.offsetTop) >> this.viewport.scalePowerOfTwo;
            const debugData = this.viewport.getDebugData(x, this.viewport.height - y);
            this.overheadmap.highlight(debugData.xMap1, debugData.yMap1, debugData.xMap2, debugData.yMap2);
        });
    }
}

export { Debugger };