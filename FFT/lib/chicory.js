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
    let result = null;
    try {
        result = fn();
        if (result && result.error) {
            throw result.error;
        }
        for(let callback of it.callback || []) {
            callback(description, testStack, result);
        }
    } catch(err) {
        if (it.errorCallback && it.callback.length > 0) {
            for (let errorCallback of it.errorCallback) {
                errorCallback(description, err, testStack, result);
            }
        } else throw err;
    } finally {
        testStack.pop();
    }
}
it.callback = [];
it.errorCallback = [];

function check(condition, err) {
    if (!condition) throw new Error(err);
}

function isTrue() { check(!!this, "Expected true.") }
function isFalse() { check(!this, "Expected false.") }
function isNull() { check(this === null, "Expected null.") }
function isNotNull() { check(this !== null, "Expected not null.") }
function isUndefined() { check(this === undefined, "Expected undefined.") }
function isNotUndefined() { check(this !== undefined, "Expected not undefined.") }

function equals(expected) {
    if (expected === null) {
        if (this !== null) {
            throw new Error(`Value was expected to be null but is ${this}.`);
        }
        return;
    }
    if (expected === undefined) {
        if (this !== undefined) {
            throw new Error(`Value was expected to be undefined but is ${this}.`);
        }
        return;
    }
    if (expected.equals) {
        if (!expected.equals(this)) {
            throw new Error(`Value is ${this} whereas ${expected} was expected.`);
        }
        return;
    }
    if (Array.isArray(expected)) {
        if (!Array.isArray(this)) {
            throw new Error("The object is not an array.");
        }
        if (expected.length !== this.length) {
            throw new Error(`The array has ${this.length} elements whereas it should have ${expected.length}.`);
        }
        this.forEach((val, i) => {
            try {
                equals.bind(val)(expected[i]);
            } catch(err) {
                throw new Error(`The item at index ${i} is ${val} instead of the expected value ${expected[i]}.`, { cause: err });
            }
        });
        return;
    }
    if (expected instanceof Date) {
        if (!(this instanceof(Date))) {
            throw new Error("Value should be a date.");
        }
        if (this.valueOf() !== expected.valueOf()) {
            throw new Error(`Value is ${this} whereas ${expected} was expected.`);
        }
        return;
    }
    if (typeof(expected) === 'number') {
        if (this.toPrecision(precision) !== expected.toPrecision(precision)) {
            throw new Error(`Value is ${this} whereas ${expected} was expected.`);
        }
        return;
    }
    if (typeof(expected) === 'object') {
        if (typeof(this) !== 'object') {
            throw new Error("The value is not an object.");
        }
        for (const prop in expected) {
            try {
                equals.bind(this[prop])(expected[prop]);
            } catch(err) {
                throw new Error(`Property ${prop} is not the expected value.`, { cause: err });
            }
        }
        for (const prop in this) {
            if (!(prop in expected)) {
                throw new Error(`Unexpected property ${prop}.`);
            }
        }
        return;
    }
    if (this !== expected) {
        throw new Error(`Value is ${this} whereas ${expected} was expected.`);
    }
}

function isNot(unexpected) {
    if (unexpected === null) {
        if (this === null) {
            throw new Error(`Value was expected to not be null but was ${this}.`);
        }
        return;
    }
    if (unexpected === undefined) {
        if (this === undefined) {
            throw new Error(`Value was expected to be undefined but wasn't.`);
        }
        return;
    }
    if (this.equals) {
        if (this.equals(unexpected)) {
            throw new Error(`Value should not be ${unexpected}.`);
        }
        return;
    }
    if (Array.isArray(unexpected)) {
        if (!Array.isArray(this)) {
            return;
        }
        if (unexpected.length !== this.length) {
            return;
        }
        for (let i = 0; i < this.length; i++) {
            try {
                equals.bind(this[i])(unexpected[i]);
            } catch(err) {
                return;
            }
        }
        throw new Error("The arrays should not be the same.");
    }
    if (unexpected instanceof Date) {
        if (!(this instanceof(Date))) {
            return;
        }
        if (this.valueOf() === unexpected.valueOf()) {
            throw new Error(`Value should not be ${unexpected}.`);
        }
        return;
    }
    if (typeof(unexpected) === 'number') {
        if (this.toPrecision(precision) === unexpected.toPrecision(precision)) {
            throw new Error(`Value should not be ${unexpected}.`);
        }
        return;
    }
    if (typeof(unexpected) === 'object') {
        if (typeof(this) !== 'object') return;
        for (const prop in unexpected) {
            try {
                equals.bind(this[prop])(unexpected[prop]);
            } catch(err) {
                return;
            }
        }
        for (const prop in this) {
            if (!(prop in unexpected)) {
                return;
            }
        }
        throw new Error("The objects should not be the same.");
    }
    if (this === unexpected) {
        throw new Error(`Value should not be ${unexpected}.`);
    }
}

function throws(fun, handlerOrMessage) {
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
    }
}

function contains(item) {
    if (!Array.isArray(this)) {
        throw new Error("An array was expected.")
    }
    for (let i = 0; i < this.length; i++) {
        try {
            isNot.bind(item)(this[i]);
        }
        catch {
            // We have a match. Return.
            return;
        }
    }
    throw new Error("The array does not contain the item");
}

function doesntContain(item) {
    if (!Array.isArray(this)) {
        throw new Error("An array was expected.")
    }
    for (let i = 0; i < this.length; i++) {
        try {
            isNot.bind(item)(this[i]);
        }
        catch {
            // We have a match. Throw.
            throw new Error("The array should not contain the item");
        }
    }
}

const assert = {
    extend: extension => {
        if (typeof(extension) === 'function') {
            extension = [extension];
        }
        for (let fun of extension) {
            assert.extensions.push(fun);
        }
    },
    extensions: [],
    that: obj => {
        const chain = {};
        for (let fun of assert.extensions) {
            chain[fun.name] = function() {
                fun.apply(obj, arguments);
                return chain;
            }
        }
        chain.and = chain;
        return chain;
    }
};

assert.extend([
    isTrue,
    isFalse,
    isNull,
    isNotNull,
    isUndefined,
    isNotUndefined,
    equals,
    isNot,
    contains,
    doesntContain,
    throws
]);

export { assert, describe, it }