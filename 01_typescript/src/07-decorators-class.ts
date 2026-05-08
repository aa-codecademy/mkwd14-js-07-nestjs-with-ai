function ZooSection(sectionName: string): ClassDecorator {
	return target => {
		(target as { zooSection?: string }).zooSection = sectionName;
	};
}

@ZooSection('Mammals Zone')
class LionKing {
	name = 'Simba';
}

@ZooSection('Birds Zone')
class Parrot {
	name = 'Kiwi';
}

@ZooSection('Lizards Zone')
class Gecko {
	name = 'Khaleesi';
}

// Asserting types
const dogs: unknown = JSON.parse(`[{"name":"Murdzo"}, {"name":"Blacky"}]`);
const dogsAsProperTypes = dogs as { name: string }[];
