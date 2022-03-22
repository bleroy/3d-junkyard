// ChicoryJS
// A simple test library that doesn't bring down all of npm with it when you import it.
// No dependency whatsoever in fact.
// (c) 2022 Bertrand Le Roy
// Licensed under MIT

'use strict';

let testStack = [];

const precision = 16;

function describe(description, fn) {
    function run() {
        if (describe.before) describe.before(description, testStack);
        testStack.push(description);
        const inner = fn();
        if (typeof(inner) === 'function') inner();
        testStack.pop();
        if (describe.after) describe.after(testStack);
    }

    return testStack.length > 0 ?
        // if we're already nested, immediately execute.
        run() :
        // Otherwise, return a function to be executed later.
        run;
}

function it(description, fn) {
    testStack.push(description);
    try {
        fn();
        if (it.callback) it.callback(description, testStack);
    } catch(err) {
        if (it.errorCallback) it.errorCallback(description, err, testStack); else throw err;
    } finally {
        testStack.pop();
    }
}

function equals(expected, actual, chain) {
    if (Array.isArray(expected)) {
        if (!Array.isArray(actual)) {
            throw new Error("The object is not an array.");
        }
        if (expected.length !== actual.length) {
            throw new Error(`The array has ${actual.length} elements whereas it should have ${expected.length}.`);
        }
        actual.forEach((val, i) => {
            try {
                equals(val, expected[i]);
            } catch(err) {
                throw new Error(`The item at index ${i} is not the value expected.`, { cause: err });
            }
        });
    } else if (expected instanceof Date) {
        if (!(actual instanceof(Date))) {
            throw new Error("Value should be a date.");
        }
        if (actual.valueOf() !== expected.valueOf()) {
            throw new Error(`Value is ${actual} whereas ${expected} was expected.`);
        }
    } else if (typeof(expected) === 'number') {
        if (actual.toPrecision(precision) !== expected.toPrecision(precision)) {
            throw new Error(`Value is ${actual} whereas ${expected} was expected.`);
        }
    } else if (typeof(expected) === 'object') {
        if (typeof(actual) !== 'object') {
            throw new Error("The value is not an object.");
        }
        for (const prop in expected) {
            try {
                equals(actual[prop], expected[prop]);
            } catch(err) {
                throw new Error(`Property ${prop} is not the expected value.`, { cause: err });
            }
        }
        for (const prop in actual) {
            if (!(prop in expected)) {
                throw new Error(`Unexpected property ${prop}.`);
            }
        }
    } else if (actual !== expected) {
        throw new Error(`Value is ${actual} whereas ${expected} was expected.`);
    }
    return chain;
}

function isNot(unexpected, actual, chain) {
    if (Array.isArray(unexpected)) {
        if (!Array.isArray(actual)) {
            return chain;
        }
        if (unexpected.length !== actual.length) {
            return chain;
        }
        for (let i = 0; i < actual.length; i++) {
            try {
                equals(actual[i], unexpected[i]);
            } catch(err) {
                return chain;
            }
        }
        throw new Error("The arrays should not be the same.");
    } else if (unexpected instanceof Date) {
        if (!(actual instanceof(Date))) {
            return chain;
        }
        if (actual.valueOf() === unexpected.valueOf()) {
            throw new Error(`Value should not be ${unexpected}.`);
        }
    } else if (typeof(unexpected) === 'number') {
        if (actual.toPrecision(precision) === unexpected.toPrecision(precision)) {
            throw new Error(`Value should not be ${unexpected}.`);
        }
    } else if (typeof(unexpected) === 'object') {
        if (typeof(actual) !== 'object') return chain;
        for (const prop in unexpected) {
            try {
                equals(actual[prop], unexpected[prop]);
            } catch(err) {
                return chain;
            }
        }
        for (const prop in actual) {
            if (!(prop in unexpected)) {
                return chain;
            }
        }
        throw new Error("The objects should not be the same.");
    } else if (actual === unexpected) {
        throw new Error(`Value should not be ${unexpected}.`);
    }
    return chain;
}

function throws(fun, handlerOrMessage, chain) {
    let ex = null;
    try {
        fun();
    } catch(exception) {
        ex = exception;
    } finally {
        if (!ex) {
            throw new Error('An exception was expected.');
        } else {
            if (typeof(handlerOrMessage) === 'string') {
                if (ex.message !== handlerOrMessage) {
                    throw new Error(`Expected error message "${handlerOrMessage}" but got "${ex.message}".`);
                }
            } else if (typeof(handlerOrMessage) === 'function') {
                if (!handlerOrMessage(ex))  {
                    throw new Error("Exception didn't meet the specified criteria.");
                }
            }
        }
        return chain;
    }
}

function contains(item, array, chain) {
    if (!Array.isArray(array)) {
        throw new Error("An array was expected.")
    }
    for (let i = 0; i < array.length; i++) {
        try {
            isNot(item, array[i]);
        }
        catch {
            // We have a match. Return.
            return chain;
        }
    }
    throw new Error("The array does not contain the item");
}

function doesntContain(item, array, chain) {
    if (!Array.isArray(array)) {
        throw new Error("An array was expected.")
    }
    for (let i = 0; i < array.length; i++) {
        try {
            isNot(item, array[i]);
        }
        catch {
            // We have a match. Throw.
            throw new Error("The array should not contain the item");
        }
    }
    return chain;
}

function check(condition, err, chain) {
    if (!condition) throw new Error(err);
    return chain;
}

const assert = {
    that: obj => {
        const chain = {
            isTrue: () => check(!!obj, "Expected true.", chain),
            isFalse: () => check(!obj, "Expected false.", chain),
            isNull: () => check(obj === null, "Expected null.", chain),
            isNotNull: () => check(obj !== null, "Expected not null.", chain),
            isUndefined: () => check(obj === undefined, "Expected undefined.", chain),
            isNotUndefined: () => check(obj !== undefined, "Expected not undefined.", chain),
            equals: expected => equals(expected, obj, chain),
            isNot: other => isNot(other, obj, chain),
            contains: item => contains(item, obj, chain),
            doesntContain: item => doesntContain(item, obj, chain),
            throws: handlerOrMessage => throws(obj, handlerOrMessage, chain)
        };
        chain.and = chain;
        return chain;
    }
};

export { assert, describe, it }