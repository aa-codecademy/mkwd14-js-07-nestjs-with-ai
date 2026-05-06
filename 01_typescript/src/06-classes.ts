class BankAccount {
	// public: accessible from everywhere.
	public owner: string;
	// private: accessible only inside BankAccount.
	private balance: number;
	// #balance: number;
	// protected: accessible in this class and subclasses.
	protected currency: string;

	constructor(owner: string, balance: number, currency = 'EUR') {
		this.owner = owner;
		this.balance = balance;
		this.currency = currency;
	}
}

const myAccount = new BankAccount('Ivo', 100);

myAccount.owner;
// myAccount.balance; // Error: private member.
// myAccount.currency; // Error: protected member.

// Abstract class: cannot be instantiated directly.
// It defines a contract that subclasses must implement.
abstract class CustomShape {
	abstract area(): number;

	describe(): string {
		return `area is ${this.area()}`;
	}
}

// const myShape = new CustomShape();

// Square must implement area() because it extends CustomShape.
class Square extends CustomShape {
	// constructor parameter with `public` auto-creates this.side property.
	constructor(public side: number) {
		super();
	}

	area(): number {
		return this.side * this.side;
	}
}

const mySquare = new Square(5);

mySquare.describe(); // "area is 25"

class IdGenerator {
	// static belongs to the class itself, not to instances.
	private static next = 1;

	static issue(): number {
		return IdGenerator.next++;
	}
}

const myIdInstance = new IdGenerator();

// myIdInstance.next
// myIdInstance.issue()

const myId = IdGenerator.issue();
const nextId = IdGenerator.issue();

console.log(myAccount, mySquare.describe(), myIdInstance, myId, nextId);
