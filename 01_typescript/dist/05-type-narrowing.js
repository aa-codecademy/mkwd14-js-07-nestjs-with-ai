"use strict";
// animal starts as a union type: Cat | Lion.
// We cannot call meow/roar directly until we narrow the type.
function makeSound(animal) {
    // `in` checks if a property exists at runtime
    // and narrows the type for TypeScript.
    if ('meow' in animal) {
        // Inside this block, TypeScript knows `animal` is Cat.
        animal.meow();
    }
    else {
        // Inside this block, TypeScript knows `animal` is Lion.
        animal.roar();
    }
}
const homeCat = { meow: () => console.log('Meow!') };
const wildLion = { roar: () => console.log('Roar!') };
makeSound(homeCat);
makeSound(wildLion);
//# sourceMappingURL=05-type-narrowing.js.map