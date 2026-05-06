// Interface defines a reusable object contract.
interface User {
	name: string;
	age: number;
	isEmployed: boolean;
	hobbies: string[];
	personalTraits: {
		eyeColor: string;
		hairColor: string;
	};
	// `?` means this property is optional.
	jobTitle?: string;
	// jobTitle: string | undefined
}

// Strongly typed object assignment.
let john: User = {
	name: 'John',
	age: 20,
	isEmployed: false,
	hobbies: ['tennis', 'go-kart', 'hiking'],
	personalTraits: {
		eyeColor: 'green',
		hairColor: 'Brown',
	},
};

// `satisfies` checks that `jane` matches User,
// while preserving the most specific inferred types in `jane`.
let jane = {
	name: 'Jane',
	age: 25,
	isEmployed: true,
	hobbies: ['painting', 'yoga'],
	personalTraits: {
		eyeColor: 'blue',
		hairColor: 'blonde',
	},
	jobTitle: 'Software Engineer',
} satisfies User;

// Interface inheritance:
// Dog includes all properties from Animal + its own fields.
interface Animal {
	name: string;
}

interface Dog extends Animal {
	breed: string;
}

// Type aliases are another way to model types.
// Great for unions, primitives, and complex compositions.
type Id = string | number;

type UserType = {
	name: string;
	age: number;
	isEmployed: boolean;
	hobbies: string[];
	personalTraits: {
		eyeColor: string;
		hairColor: string;
	};
	jobTitle?: string;
};

// Same shape as interface-based User, but via type alias.
let alice: UserType = {
	name: 'Alice',
	age: 30,
	isEmployed: true,
	hobbies: ['cooking', 'traveling'],
	personalTraits: {
		eyeColor: 'hazel',
		hairColor: 'red',
	},
	jobTitle: 'Graphic Designer',
};

// Discriminated union:
// `type` acts as a discriminator to know which fields exist.
type Shape =
	| { type: 'circle'; radius: number }
	| { type: 'square'; sideLength: number };

let myCircle: Shape = {
	type: 'circle',
	// sideLength: 5,
	radius: 10,
};

// Enums
// Numeric enums auto-increment from 0 by default.

enum Direction {
	North, // 0
	East, // 1
	South, // 2
	West, // 3
}

// enum DirectionBE {
// 	North, // 0
// 	East, // 1
// 	South, // 2
// 	West, // 3
// }

// enum DirectionFE {
// 	North, // 0
// 	East, // 1
// 	West, // 2
// 	South, // 3
// }

// String enum avoids numeric mismatch issues across systems.
enum DirectionFull {
	North = 'NORTH',
	East = 'EAST',
	South = 'SOUTH',
	West = 'WEST',
}

const DirectionAsConst = {
	North: 'NORTH',
	East: 'EAST',
	South: 'SOUTH',
	West: 'WEST',
};

// Literal union as a lightweight enum alternative.
type DirectionType = 'NORTH' | 'EAST' | 'SOUTH' | 'WEST';

// const north = DirectionType.North
const north: DirectionType = 'NORTH';
// const south: DirectionType = 'West'; // Error: must be uppercase literal.
const south: DirectionType = 'WEST';

// Example values to show everything compiles and is available.
const pet: Dog = { name: 'Rex', breed: 'Labrador' };
const userId: Id = 123;

console.log(
	Direction.North,
	DirectionFull.North,
	DirectionAsConst.North,
	north,
	south,
	john,
	jane,
	alice,
	myCircle,
	pet,
	userId,
);
