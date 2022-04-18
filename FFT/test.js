// An in-browser test runner for Chicory
// (c) 2022 Bertrand Le Roy
// Licensed under MIT

'use strict';

import { describe, it } from './lib/chicory.js';
import tests from './tests/index.js';

const failures = [];
let successes = 0;
let count = 0;
const resultsEl = document.getElementById('results');
const elStack = [resultsEl];

function pushEl(tag, className) {
    const el = document.createElement(tag || 'div');
    if (className) el.className = className;
    elStack[elStack.length - 1].append(el);
    elStack.push(el);
}

function appendEl(content, tag, className) {
    const el = document.createElement(tag || 'div');
    if (className) el.className = className;
    if (content) el.innerHTML = content;
    elStack[elStack.length - 1].append(el);
}

function popEl() {
    elStack.pop();
}

appendEl(`Running ${tests.length} test suite${(tests.length > 1 ? 's' : '')}`, 'h2');

describe.before = msg => {
    appendEl(msg, 'div', 'label');
    pushEl('ul');
    console.group(msg);
}

describe.after = () => {
    popEl();
    console.groupEnd();
}

it.callback.push((msg, testStack, result) => {
    count++;
    const path = testStack.join(' / ');
    appendEl(msg, 'li', 'succeeded');
    if (result && result.element instanceof HTMLElement) {
        elStack[elStack.length - 1].append(result.element);
    }
    console.log('✅ %c' + msg, "color: green");
    successes++;
});

it.errorCallback.push((description, err, testStack, result) => {
    const path = testStack.join(' : ');
    failures.push({path, message: err.message, error: err});
    appendEl(description, 'li', 'failed');
    if (result && result.element instanceof HTMLElement) {
        elStack[elStack.length - 1].append(result.element);
    }
    console.error(description + ': ' + err);
    count++;
});

tests.forEach(test => {
    test();
});

appendEl('Summary', 'h3');
appendEl(`${successes} / ${count} tests passed.`, 'div', failures.length > 0 ? 'failed' : 'succeeded');
console.log(`${failures.length > 0 ? '❌' : '✅'} %c${successes} / ${count} tests passed.`, failures.length > 0 ? 'color: red' : 'color: green');

if (failures.length > 0) {
    pushEl('ol');
    failures.forEach(failure => {
        pushEl('li');
        appendEl(failure.path, 'h4');
        appendEl(failure.message.replace(/\n/g, '\n<br/>'), 'div');
        appendEl(failure.error.stack.replace(/\n/g, '\n<br/>'), 'div', 'stack-trace');
    });
    popEl();
}