"use strict";
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
// Generic function:
// T is a placeholder type determined at call site.
// If we pass string[], T becomes string.
// If we pass number[], T becomes number.
function findOne(arr, theItem) {
    const item = arr.find(i => i === theItem);
    // We check `item === undefined` to avoid false positives
    // for valid values like 0, false, or empty string.
    if (item === undefined) {
        throw new Error("Item can't be found!");
    }
    return item;
}
let otherFruits = ['apple', 'orange', 'kiwi', 'banana'];
// fruitResult is inferred as string.
const fruitResult = findOne(otherFruits, 'apple');
let otherNumbers = [1, 2, 3, 4, 5, 6];
// result is inferred as number.
const result = findOne(otherNumbers, 2);
// Response where payload contains strings.
const response = {
    payload: ['one', 'two', 'three'],
    total: 100,
    limit: 10,
    offset: 0,
};
// Response where payload contains user-like objects.
const userResponse = {
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
console.log(fruitResult, result, response, userResponse);
//# sourceMappingURL=04-generics.js.map