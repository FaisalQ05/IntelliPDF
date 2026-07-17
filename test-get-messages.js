import { PrismaClient } from './server/generated/prisma/client/index.js';
import { ChatRepository } from './server/dist/modules/pdf-chat/infrastructure/chat.repository.js';
import { DbClient } from './server/dist/common/database/index.js';

const prisma = new PrismaClient();
const dbClient = new DbClient();
const chatRepo = new ChatRepository(dbClient);

async function run() {
  const msgs = await chatRepo.findMessagesByChatId("5bfd4718-c501-4ed7-b761-56e219d781b8");
  console.log("Found:", msgs.length, "messages");
  console.log(JSON.stringify(msgs, null, 2));
}

run();
