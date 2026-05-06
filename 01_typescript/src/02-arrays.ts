// Array of strings using `type[]` syntax.
const fruits: string[] = ['apple', 'banana', 'pineapple'];
// Same idea, using generic `Array<T>` syntax.
const numbers: Array<number> = [1, 2, 3];

// readonly means we can read values, but we cannot mutate the array.
const colors: readonly string[] = ['red', 'blue', 'yellow'];

// colors.push('green') // Error: Property 'push' does not exist on readonly array.

// Union type array: each element can be one of several allowed types.
const values: (number | string | null | undefined)[] = [
	12,
	null,
	undefined,
	'13',
];

// Tuple: fixed length and fixed types by position.
const coordinates: [number, number] = [8763172863, 32131213];
// Destructuring keeps exact tuple positions.
const [x, y] = coordinates;

// Another tuple example:
// [stateValue, updaterFunction] similar to React's useState shape.
const state: [string, () => void] = ['John', () => console.log('testing')];

// Named tuple members improve readability in editors.
type CustomRange = [start: number, end: number];
const visible: CustomRange = [1, 2];

console.log(fruits, numbers, colors, values, x, y, state, visible);
