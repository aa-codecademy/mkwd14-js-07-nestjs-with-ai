const MARKED_KEY = Symbol('marked-properties');

type MarkablePrototype = {
	[MARKED_KEY]?: string[];
};

function Mark(target: object, propertyName: string): void {
	const proto = target as MarkablePrototype;
	const current = proto[MARKED_KEY] ?? [];
	proto[MARKED_KEY] = [...current, propertyName];
}

class StudentProfile {
	@Mark
	name: string;

	@Mark
	grade: number;

	age: number;

	// @Column('eye_color')
	// eyeColor: string

	constructor(name: string, grade: number, age: number) {
		this.name = name;
		this.grade = grade;
		this.age = age;
	}
}

export default function runPropertyDecorator() {
	const nikola = new StudentProfile('Nikola', 5, 20);

	console.log('student:', nikola);

	const proto = Object.getPrototypeOf(nikola) as MarkablePrototype;
	const markedProperties = proto[MARKED_KEY] ?? [];

	console.log('Marked Properties:', markedProperties);
}
