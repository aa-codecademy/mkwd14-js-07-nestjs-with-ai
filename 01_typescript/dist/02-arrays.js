"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = arrays;
function arrays() {
    // Array of strings using `type[]` syntax.
    const fruits = ['apple', 'banana', 'pineapple'];
    // Same idea, using generic `Array<T>` syntax.
    const numbers = [1, 2, 3];
    // readonly means we can read values, but we cannot mutate the array.
    const colors = ['red', 'blue', 'yellow'];
    // colors.push('green') // Error: Property 'push' does not exist on readonly array.
    // Union type array: each element can be one of several allowed types.
    const values = [
        12,
        null,
        undefined,
        '13',
    ];
    // Tuple: fixed length and fixed types by position.
    const coordinates = [8763172863, 32131213];
    // Destructuring keeps exact tuple positions.
    const [x, y] = coordinates;
    // Another tuple example:
    // [stateValue, updaterFunction] similar to React's useState shape.
    const state = ['John', () => console.log('testing')];
    const visible = [1, 2];
    console.log(fruits, numbers, colors, values, x, y, state, visible);
}
//# sourceMappingURL=02-arrays.js.map