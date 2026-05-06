class BankAccount {
	public owner: string;
	private balance: number;
	// #balance: number;
	protected currency: string;

	constructor(owner: string, balance: number, currency = 'EUR') {
		this.owner = owner;
		this.balance = balance;
		this.currency = currency;
	}
}

const myAccount = new BankAccount('Ivo', 100);

myAccount.owner;
// myAccount.balance;
// myAccount.currency

abstract class CustomShape {
	abstract area(): number;

	describe(): string {
		return `area is ${this.area()}`;
	}
}

// const myShape = new CustomShape();

class Square extends CustomShape {
	constructor(public side: number) {
		super();
	}

	area(): number {
		return this.side * this.side;
	}
}

const mySquare = new Square(5);

mySquare.describe(); // 25

class IdGenerator {
	private static next = 1;

	static issue(): number {
		return IdGenerator.next++
	}
}

const myIdInstance = new IdGenerator()

// myIdInstance.next
// myIdInstance.issue()

const myId = IdGenerator.issue()
