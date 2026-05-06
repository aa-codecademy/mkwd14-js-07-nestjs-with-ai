type Cat = { meow: () => void };
type Lion = { roar: () => void };

function makeSound(animal: Cat | Lion) {
	if ('meow' in animal) {
		animal.meow();
	} else {
		animal.roar();
	}
}
