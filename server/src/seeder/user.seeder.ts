import { Role } from "../../generated/prisma/client";
import { PrismaService } from "../common/database/prisma";
import { HashService } from "../modules/auth";

export async function seedUsers(prisma: PrismaService) {
  const hashService = new HashService();
  const password = "Admin@123!";
  const passwordHash = await hashService.hash(password);

  const users = [
    {
      email: "admin@example.com",
      name: "Admin User",
      role: Role.ADMIN,
    },
    {
      email: "manager@example.com",
      name: "Manager User",
      role: Role.MANAGER,
    },
    {
      email: "user@example.com",
      name: "Normal User",
      role: Role.USER,
    },
  ];

  for (const user of users) {
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existingUser) {
      console.log(`${user.role} already exists: ${user.email}`);
      continue;
    }

    await prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
      },
    });

    console.log(`${user.role} created: ${user.email}`);
  }

  console.log("Seeding completed successfully");
}
