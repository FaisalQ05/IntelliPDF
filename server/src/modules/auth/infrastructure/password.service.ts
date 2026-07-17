import bcrypt from "bcrypt";

export class HashService {
  private readonly salt: number;

  constructor(salt?: number) {
    this.salt = salt || 12;
  }

  async hash(value: string): Promise<string> {
    return bcrypt.hash(value, this.salt);
  }

  async compare(value: string, hash: string): Promise<boolean> {
    return bcrypt.compare(value, hash);
  }
}
