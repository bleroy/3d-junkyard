// Tests for the Chicory test framework
// (c) 2021 Bertrand Le Roy
// Licensed under MIT

'use strict';

import { assert, describe, it } from '../lib/chicory.js';

export default describe('Chicory', () => {
    describe("assert", () => {
        it('can assert that 1 + 1 = 2', () => assert.that(1 + 1).equals(2));
        it('throws when it tries to assert that 2 + 2 = 5', () => {
            assert.that(
                () => assert.that(2 + 2).equals(5)
            ).throws();
        });
        it("can chain checks", () =>
            assert.that(1)
                .equals(1)
                .and.isNot(2)
                .and.isNotNull()
                .and.isNotUndefined());
    });
    describe("throws", () => {
        it("throws when asserting something that doesn't throw does", () =>
            assert.that(
                () => assert.that(
                    () => assert.that(2 + 2).equals(4)
                ).throws()
            ).throws('An exception was expected.'));
        it("can check the exception message", () =>
            assert.that(
                () => { throw new Error('The message'); }
            ).throws('The message'));
        it("throws if the exception messages don't match", () =>
            assert.that(() =>
                assert.that(
                    () => { throw new Error('A different message'); }
                ).throws('A message')
            ).throws('Expected error message "A message" but got "A different message".'));
    });
    describe("descriptions", () => {
        it("can have nested descriptions", () => {});
        describe("deeply-nested descriptions", () => {
            it('can be deeply-nested', () => {});
            it('more than once', () => {});
        });
        it("and back up", () => {});
    });
    describe("isTrue", () => {
        it("can check a true condition", () => assert.that(true).isTrue());
        it("throws on a false condition", () => assert.that(() => assert(false).isTrue()).throws());
    });
    describe("isFalse", () => {
        it("can check a false condition", () => assert.that(false).isFalse());
        it("throws on a true condition", () => assert.that(() => assert(true).isFalse()).throws());
    });
    describe("isNull", () => {
        it("can check a null value", () => assert.that(null).isNull());
        it("throws on a non-null value", () => assert.that(() => assert({}).isNull()).throws());
    });
    describe("isNotNull", () => {
        it("can check a value is not null", () => assert.that({}).isNotNull());
        it("throws on a null value", () => assert.that(() => assert(null).isNotNull()).throws());
    });
    describe("isUndefined", () => {
        it("can check an undefined value", () => assert.that(undefined).isUndefined());
        it("throws on a non-undefined value", () => assert.that(() => assert({}).isUndefined()).throws());
    });
    describe("isNotUndefined", () => {
        it("can check a value is not undefined", () => assert.that({}).isNotUndefined());
        it("throws on an undefined value", () => assert.that(() => assert(undefined).isNotUndefined()).throws());
    });
    describe("equals", () => {
        it("can check numbers are equal", () => assert.that(1.0).equals(1.0));
        it("can check strings are equal", () => assert.that("foo").equals("foo"));
        it("can check Booleans are equal", () => {
            assert.that(false).equals(false);
            assert.that(true).equals(true);
        });
        it("can check dates are equal", () => assert.that(new Date(1970, 4, 21)).equals(new Date(1970, 4, 21)));
        it("can check arrays are equal", () => assert.that([1, 20, 300]).equals([1, 20, 300]));
        it("can check objects are equal", () => assert.that({foo: 'foo', bar: 42, baz: null}).equals({foo: 'foo', bar: 42, baz: null}));
        it("can check deep equality", () => assert
            .that({foo: 'foo', bar: [42, 1, {very: "deep"}], baz: {deep: true}})
            .equals({foo: 'foo', bar: [42, 1, {very: "deep"}], baz: {deep: true}}));
        it("throws when not equal", () => assert.that(() => assert.that(1).equals(2)).throws("Value is 1 whereas 2 was expected."));
        it("throws when dates are not equal", () => assert.that(
                () => assert.that(new Date(1970, 4, 21)).equals(new Date(1970, 5, 21))
            ).throws("Value is Thu May 21 1970 00:00:00 GMT-0700 (Pacific Daylight Time) whereas Sun Jun 21 1970 00:00:00 GMT-0700 (Pacific Daylight Time) was expected."));
        it("throws when comparing an int to an array", () =>
            assert.that(() =>
                assert.that(1).equals([1])
            ).throws("The object is not an array."));
        it("throws when arrays have different lengths", () =>
            assert.that(() =>
                assert.that([1, 2]).equals([1])
            ).throws("The array has 2 elements whereas it should have 1."));
        it("throws when arrays differ by one element", () =>
            assert.that(() =>
                assert.that([1, 2, 3, 4]).equals([1, 2, 4, 3])
            ).throws("The item at index 2 is not the value expected."));
        it("throws when comparing an int to a date", () =>
            assert.that(() =>
                assert.that(1).equals(new Date(1970, 4, 21))
            ).throws("Value should be a date."));
        it("throws when comparing an int to an object", () =>
            assert.that(() =>
                assert.that(1).equals({ foo: "bar" })
            ).throws("The value is not an object."));
        it("throws when objects differ by one deep property", () =>
            assert.that(() =>
                assert.that({foo: 'foo', bar: [42, 1, {very: "deep"}], baz: {deep: true}})
                    .equals({foo: 'foo', bar: [42, 1, {very: "doop"}], baz: {deep: true}})
            ).throws("Property bar is not the expected value."));
        it("throws when an object has an extra property", () =>
            assert.that(() =>
                assert.that({foo: 'foo', bar: "bar", baz: {deep: true}})
                    .equals({foo: 'foo', baz: {deep: true}})
            ).throws("Unexpected property bar."));
    });
    describe("isNot", () => {
        it("can check numbers are not equal", () => assert.that(1.0).isNot(3.0));
        it("can check strings are not equal", () => assert.that("foo").isNot("bar"));
        it("can check Booleans are not equal", () => {
            assert.that(false).isNot(true);
            assert.that(true).isNot(false);
        });
        it("can check dates are not equal", () => assert.that(new Date(1970, 4, 21)).isNot(new Date(1970, 5, 21)));
        it("can check an int is not equal to a date", () => assert.that(1).isNot(new Date(1970, 5, 21)));
        it("can check arrays are not equal", () => assert.that([1, 20, 300]).isNot([1, 42, 300]));
        it("can check arrays differ by length", () => assert.that([1, 2]).isNot([1]));
        it("can check arrays differ by one element", () => assert.that([1, 2, 3, 4]).isNot([1, 2, 4, 3]));
        it("can check objects are not equal", () => assert.that({foo: 'foo', bar: 43, baz: null}).isNot({foo: 'foo', bar: 42, baz: null}));
        it("can check objects differring by a deep difference are not equal", () => assert
            .that({foo: 'foo', bar: [42, 1, {very: "deep"}], baz: {deep: true}})
            .isNot({foo: 'foo', bar: [42, 1, {very: "doop"}], baz: {deep: true}}));
        it("can check an int and an array are different", () => assert.that(1).isNot([1]));
        it("can check an int and an object are different", () => assert.that(1).isNot({foo: "bar"}));
        it("throws when equal", () => assert.that(() => assert.that(1).isNot(1)).throws("Value should not be 1."));
        it("throws when comparing equal arrays", () =>
            assert.that(() =>
                assert.that([1, 42]).isNot([1, 42])
            ).throws("The arrays should not be the same."));
        it("can check objects differ by one deep property", () =>
            assert.that({foo: 'foo', bar: [42, 1, {very: "deep"}], baz: {deep: true}})
                .isNot({foo: 'foo', bar: [42, 1, {very: "doop"}], baz: {deep: true}}));
        it("can check an object has an extra property", () =>
            assert.that({foo: 'foo', bar: "bar", baz: {deep: true}})
                .isNot({foo: 'foo', baz: {deep: true}}));
    });
    describe("contains", () => {
        it("can find an item in an array", () =>
            assert.that([1, { foo: "bar" }, "baz"])
                .contains({ foo: "bar" })
                .and.contains(1)
                .and.contains("baz"));
        it("throws if it can't find an item", () => {
            assert.that(() =>
                assert.that([1, 2, 3]).contains(42)
            ).throws("The array does not contain the item");
        });
    });
    describe("doesntContain", () => {
        it("can check the absence of an item from an array", () =>
            assert.that([1, { foo: "bar" }, "baz"])
                .doesntContain(42));
        it("throws if it finds an item", () => {
            assert.that(() =>
                assert.that([1, 2, 3]).doesntContain(2)
            ).throws("The array should not contain the item");
        });
    });
});