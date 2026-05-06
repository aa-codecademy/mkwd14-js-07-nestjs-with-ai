"use strict";
// Strongly typed object assignment.
let john = {
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
};
// Same shape as interface-based User, but via type alias.
let alice = {
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
let myCircle = {
    type: 'circle',
    // sideLength: 5,
    radius: 10,
};
// Enums
// Numeric enums auto-increment from 0 by default.
var Direction;
(function (Direction) {
    Direction[Direction["North"] = 0] = "North";
    Direction[Direction["East"] = 1] = "East";
    Direction[Direction["South"] = 2] = "South";
    Direction[Direction["West"] = 3] = "West";
})(Direction || (Direction = {}));
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
var DirectionFull;
(function (DirectionFull) {
    DirectionFull["North"] = "NORTH";
    DirectionFull["East"] = "EAST";
    DirectionFull["South"] = "SOUTH";
    DirectionFull["West"] = "WEST";
})(DirectionFull || (DirectionFull = {}));
const DirectionAsConst = {
    North: 'NORTH',
    East: 'EAST',
    South: 'SOUTH',
    West: 'WEST',
};
// const north = DirectionType.North
const north = 'NORTH';
// const south: DirectionType = 'West'; // Error: must be uppercase literal.
const south = 'WEST';
// Example values to show everything compiles and is available.
const pet = { name: 'Rex', breed: 'Labrador' };
const userId = 123;
console.log(Direction.North, DirectionFull.North, DirectionAsConst.North, north, south, john, jane, alice, myCircle, pet, userId);
//# sourceMappingURL=03-objects.js.map