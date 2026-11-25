import { BadRequestException } from '@nestjs/common';
import type {
  BorrowableId,
  SearchCriteria,
  UserChanges,
  UserId,
} from './library.types.js';

export abstract class Borrowable {
  private static nextId = 1;
  readonly id: number;
  title: string;
  private totalCopies: number;
  private copiesNumber: number;

  constructor(title: string, totalCopies: number) {
    if (totalCopies < 0) {
      throw new BadRequestException('Total copies cannot be negative');
    }
    this.id = Borrowable.nextId++;
    this.title = title;
    this.totalCopies = totalCopies;
    this.copiesNumber = totalCopies;
  }

  set setTotalCopies(newTotal: number) {
    if (newTotal < 0) {
      throw new BadRequestException('Total copies cannot be negative');
    }
    const borrowedCount = this.totalCopies - this.copiesNumber;
    if (newTotal < borrowedCount) {
      throw new BadRequestException(
        `Cannot reduce total copies below currently borrowed count (${borrowedCount})`,
      );
    }
    this.copiesNumber = newTotal - borrowedCount;
    this.totalCopies = newTotal;
  }

  get getTotalCopies(): number {
    return this.totalCopies;
  }

  get getAvailableCopies(): number {
    return this.copiesNumber;
  }

  borrow(): void {
    if (this.copiesNumber === 0) {
      throw new BadRequestException(`${this.title} has no available copies`);
    }
    this.copiesNumber--;
    console.log(`${this.title} has been borrowed`);
  }

  returnItem(): void {
    if (this.copiesNumber >= this.totalCopies) {
      throw new BadRequestException(
        `All copies of ${this.title} are already in the library`,
      );
    }
    this.copiesNumber++;
    console.log(`${this.title} has been returned`);
  }

  getStatus(): string {
    return this.copiesNumber > 0
      ? `${this.title} is available`
      : `${this.title} is borrowed`;
  }
}

export class DVD extends Borrowable {
  constructor(
    title: string,
    totalCopies: number,
    public minutes: number,
  ) {
    super(title, totalCopies);
  }
}

export class Book extends Borrowable implements SearchCriteria {
  constructor(
    title: string,
    totalCopies: number,
    public pages: number,
    public author: string,
    public yearOfPublication: number | string,
    public release?: number,
  ) {
    super(title, totalCopies);
  }
}

export class Magazine extends Borrowable {
  constructor(
    title: string,
    totalCopies: number,
    public pages: number,
  ) {
    super(title, totalCopies);
  }
}

export class User {
  private static nextId = 1;
  public readonly id: UserId;
  private readonly borrowed = new Set<BorrowableId>();

  constructor(
    public name: string,
    private email: string,
  ) {
    this.id = User.nextId++;
  }

  update(changes: UserChanges): void {
    if (changes.name !== undefined) this.name = changes.name;
    if (changes.email !== undefined) this.email = changes.email;
  }

  get contactEmail(): string {
    return this.email;
  }

  addLoan(id: BorrowableId): void {
    this.borrowed.add(id);
  }

  removeLoan(id: BorrowableId): void {
    this.borrowed.delete(id);
  }

  hasActiveLoans(): boolean {
    return this.borrowed.size > 0;
  }

  hasLoan(id: BorrowableId): boolean {
    return this.borrowed.has(id);
  }
}
