import { PrismaClient } from './generated/prisma/client/index.js';
const prisma = new PrismaClient();
async function run() {
  const messages = await prisma.chatMessage.findMany({
    where: { chatId: '5bfd4718-c501-4ed7-b761-56e219d781b8' },
    orderBy: { createdAt: "asc" }
  });
  console.log("MESSAGES:", JSON.stringify(messages, null, 2));
}
run();
