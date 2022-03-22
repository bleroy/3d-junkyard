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

it.callback = (msg, testStack) => {
    count++;
    const path = testStack.join(' / ');
    appendEl(msg, 'li', 'succeeded');
    console.log('✅ %c' + msg, "color: green");
    successes++;
}
it.errorCallback = (description, err, testStack) => {
    const path = testStack.join(' : ');
    failures.push({path, message: err.message, error: err});
    appendEl(description, 'li', 'failed');
    console.error(description + ': ' + err.message);
    count++;
};

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
        appendEl(failure.message, 'div');
        appendEl(failure.error.stack.replace(/\n/g, '<br/>'), 'div', 'stack-trace');
    });
    popEl();
}