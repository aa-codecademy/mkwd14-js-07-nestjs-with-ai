const fruits: string[] = ['apple', 'banana', 'pineapple'];
const numbers: Array<number> = [1, 2, 3];

const colors: readonly string[] = ['red', 'blue', 'yellow'];

// colors.push('green')

const values: (number | string | null | undefined)[] = [
	12,
	null,
	undefined,
	'13',
];

// Tuple
const coordinates: [number, number] = [8763172863, 32131213];
const [x, y] = coordinates;

const state: [string, () => void] = ['John', () => console.log('testing')];

type CustomRange = [start: number, end: number];
const visible: CustomRange = [1, 2];
