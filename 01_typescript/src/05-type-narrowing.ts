type Cat = { meow: () => void };
type Lion = { roar: () => void };

// animal starts as a union type: Cat | Lion.
// We cannot call meow/roar directly until we narrow the type.
function makeSound(animal: Cat | Lion) {
	// `in` checks if a property exists at runtime
	// and narrows the type for TypeScript.
	if ('meow' in animal) {
		// Inside this block, TypeScript knows `animal` is Cat.
		animal.meow();
	} else {
		// Inside this block, TypeScript knows `animal` is Lion.
		animal.roar();
	}
}

const homeCat: Cat = { meow: () => console.log('Meow!') };
const wildLion: Lion = { roar: () => console.log('Roar!') };

makeSound(homeCat);
makeSound(wildLion);
