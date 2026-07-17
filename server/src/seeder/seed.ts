import { seedUsers } from "./user.seeder";
import { PrismaService } from "../common/database/prisma";

const prisma = new PrismaService();

async function main() {
  await prisma.connect();
  await seedUsers(prisma);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.disconnect();
  });
