function StudyLogger(): MethodDecorator {
	return (
		target: unknown,
		methodName: string | symbol,
		descriptor: PropertyDescriptor,
	) => {
		const original = descriptor.value as (...args: unknown[]) => unknown;

		descriptor.value = function (...args: unknown[]) {
			console.log(`Lesson stars: ${String(methodName)}`);
			const start = Date.now();
			const result = original.apply(this, args);
			setTimeout(() => {
				const elapsed = Date.now() - start;

				console.log(`Lesson ends: ${String(methodName)} (${elapsed}ms)`);
				return result;
			}, 1000);
		};

		console.log(`Decorator attached to method: ${String(methodName)}`);

		return descriptor;
	};
}

class StudentLesson {
	@StudyLogger()
	study(topic: string): string {
		return `Studying: ${topic}`;
	}
}

export default function runExamplesForMethodDecorator() {
	const lesson = new StudentLesson();

	lesson.study('TypeScript');
}
