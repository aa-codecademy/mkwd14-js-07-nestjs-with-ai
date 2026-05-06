interface User {
	name: string;
	age: number;
	isEmployed: boolean;
	hobbies: string[];
	personalTraits: {
		eyeColor: string;
		hairColor: string;
	};
	jobTitle?: string;
	// jobTitle: string | undefined
}

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

interface Animal {
	name: string;
}

interface Dog extends Animal {
	breed: string;
}

// Types
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

type Shape =
	| { type: 'circle'; radius: number }
	| { type: 'square'; sideLength: number };

let myCircle: Shape = {
	type: 'circle',
	// sideLength: 5,
	radius: 10,
};

// Enums

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

type DirectionType = 'NORTH' | 'EAST' | 'SOUTH' | 'WEST';

// const north = DirectionType.North
const north: DirectionType = 'NORTH';
const south: DirectionType = 'West';

console.log(Direction.North);
