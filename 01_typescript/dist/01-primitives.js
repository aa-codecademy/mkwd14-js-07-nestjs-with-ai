"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = primitives;
function primitives() {
    // A string can hold text values.
    let title = 'Hello World, welcome to TypeScript learning';
    // title = 20 // Error: number is not assignable to string.
    // Here we convert a number to a string instead of assigning it directly.
    title = typeof 20 === 'number' ? '20' : '';
    // Symbol creates a unique value, often used for ids/keys.
    const tag = Symbol('userId');
    // Number represents integers and floating point values.
    let count = 52;
    // count = 'jdasdas' // Error: string is not assignable to number.
    // BigInt is used for very large integers beyond Number safe range.
    let bigNumber = 9007199254740993n;
    // Boolean can be true or false.
    let isActive = false;
    // isActive = 'dasda' // Error: string is not assignable to boolean.
    // Null explicitly means "no value".
    let nothing = null;
    // Undefined means "value not set yet".
    let missing = undefined;
    // never means this function never completes normally.
    // It always throws or enters an infinite loop.
    function throwError() {
        throw Error('Some error');
    }
    // void means the function does not return a useful value.
    function logSomething() {
        console.log('something');
    }
    // any disables type safety for this variable.
    // Useful only as a temporary fallback when migrating old JS code.
    let something = 'something';
    something = 20;
    something = false;
    // unknown is safer than any:
    // we must narrow the type before using it as a specific type.
    const safe = 'totally a string';
    if (typeof safe === 'string') {
        console.log(safe.toUpperCase());
    }
    // Avoid "unused variable" warnings in teaching snippets.
    console.log(title, tag, count, bigNumber, isActive, nothing, missing, something);
    logSomething();
    // throwError(); // Uncomment to see how a `never` function behaves.
}
//# sourceMappingURL=01-primitives.js.map