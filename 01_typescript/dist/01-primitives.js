"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = primitives;
function primitives() {
    // Basic types
    // String
    let title = 'Hello World, welcome to TypeScript learning';
    // title = 20
    title = typeof 20 === 'number' ? '20' : '';
    // Symbol
    const tag = Symbol('userId');
    // Number
    let count = 52;
    // count = 'jdasdas'
    let bigNumber = 9007199254740993n;
    // Boolean
    let isActive = false;
    // isActive = 'dasda'
    // Null
    let nothing = null;
    // Undefined
    let missing = undefined;
    // Never
    function throwError() {
        throw Error('Some error');
    }
    // Void
    function logSomething() {
        console.log('something');
    }
    // Any
    let something = 'something';
    something = 20;
    something = false;
    // Unknown
    const safe = 'totally a string';
    if (typeof safe === 'string') {
        console.log(safe.toUpperCase());
    }
}
//# sourceMappingURL=01-primitives.js.map