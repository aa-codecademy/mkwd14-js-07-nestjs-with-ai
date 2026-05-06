export default function primitives() {
	// Basic types
	// String
	let title: string = 'Hello World, welcome to TypeScript learning';
	// title = 20
	title = typeof 20 === 'number' ? '20' : '';

	// Symbol
	const tag: symbol = Symbol('userId');

	// Number
	let count: number = 52;
	// count = 'jdasdas'

	let bigNumber: bigint = 9_007_199_254_740_993n;

	// Boolean
	let isActive: boolean = false;
	// isActive = 'dasda'

	// Null
	let nothing: null = null;

	// Undefined
	let missing: undefined = undefined;

	// Never
	function throwError(): never {
		throw Error('Some error');
	}

	// Void
	function logSomething(): void {
		console.log('something');
	}

	// Any
	let something: any = 'something';
	something = 20;
	something = false;

	// Unknown
	const safe: unknown = 'totally a string';
	if (typeof safe === 'string') {
		console.log(safe.toUpperCase());
	}
}
