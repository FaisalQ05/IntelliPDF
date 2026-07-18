import { Prisma } from "../../../../generated/prisma/client";
import { UserRepository } from "../infrastructure/user.repository";
import { CreateUserParams } from "../domain/user.types";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(
    params: CreateUserParams,
    context?: Prisma.TransactionClient
  ) {
    return this.userRepository.create(params, context);
  }

  async getUsers() {
    return this.userRepository.getUsers();
  }

  async findByEmail(email: string, context?: Prisma.TransactionClient) {
    return this.userRepository.findByEmail(email, context);
  }

  async findByUserId(id: string, context?: Prisma.TransactionClient) {
    return this.userRepository.findById(id, context);
  }

  async upsertGoogleUser(
    params: { email: string; name?: string; providerId?: string },
    context?: Prisma.TransactionClient
  ) {
    return this.userRepository.upsertGoogleUser(params, context);
  }
}
