// function findOne(
// 	arr: (string | number)[],
// 	theItem: string | number,
// ): string | number {
// 	const item = arr.find(i => i === theItem);

// 	if (!item) {
// 		throw new Error("Item can't be found!");
// 	}

// 	return item;
// }

function findOne<T>(arr: T[], theItem: T): T {
	const item = arr.find(i => i === theItem);

	if (!item) {
		throw new Error("Item can't be found!");
	}

	return item;
}

let otherFruits: string[] = ['apple', 'orange', 'kiwi', 'banana'];

const fruitResult = findOne(otherFruits, 'apple');

let otherNumbers: number[] = [1, 2, 3, 4, 5, 6];

const result = findOne(otherNumbers, 2);

// Example 2

interface CustomResponse<T> {
	payload: T[];
	total: number;
	limit: number;
	offset: number;
}

const response: CustomResponse<string> = {
	payload: ['one', 'two', 'three'],
	total: 100,
	limit: 10,
	offset: 0,
};

const userResponse: CustomResponse<{
	id: number;
	name: string;
	email: string;
}> = {
	payload: [
		{
			id: 1,
			name: 'John Doe',
			email: 'john.doe@example.com',
		},
		{
			id: 2,
			name: 'Jane Smith',
			email: 'jane.smith@example.com',
		},
	],
	total: 100,
	limit: 10,
	offset: 0,
};
