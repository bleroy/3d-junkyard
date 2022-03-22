// Complex number extensions for ChicoryJS
// Import this instead of ChicoryJS, and it will give you a drop-in compatible patched version that can assert equality of complex numbers.
// (c) 2022 Bertrand Le Roy
// Licensed under MIT

'use strict';

import { assert, describe, it } from './chicory.js';
import Complex from '../complex.js';

const patchedAssert = {
    that: obj => {
        const chain = assert.that(obj);

        const vanillaEquals = chain.equals;
        chain.equals = function equals(expected) {
            if (obj instanceof Complex) {
                if (!obj.equals(expected))  {
                    throw new Error(`Value is ${obj} whereas ${expected} was expected.`);
                } else {
                    return chain;
                }
            }
            if (expected instanceof Complex) {
                if (!expected.equals(obj)) {
                    throw new Error(`Value is ${obj} whereas ${expected} was expected.`);
                } else {
                    return chain;
                }
            }
            return vanillaEquals(expected);
        };
        
        const vanillaIsNot = chain.isNot;
        chain.isNot = function isNot(unexpected) {
            if (obj instanceof Complex) {
                if (obj.equals(unexpected))  {
                    throw new Error(`Value should not be ${unexpected}.`);
                } else {
                    return chain;
                }
            }
            if (unexpected instanceof Complex) {
                if (unexpected.equals(obj)) {
                    throw new Error(`Value should not be ${unexpected}.`);
                } else {
                    return chain;
                }
            }
            return vanillaIsNot(expected);
        };
        
        return chain;
    }
};

export { patchedAssert as assert, describe, it }
