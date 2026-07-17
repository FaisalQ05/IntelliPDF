import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

async function run() {
  const token = jwt.sign({ userId: 'e1d13fc6-f00e-4361-b0be-d2243888371f' }, process.env.JWT_SECRET || 'secret');
  try {
    const res = await axios.get('http://localhost:4000/api/v1/pdf-chat/chats/5bfd4718-c501-4ed7-b761-56e219d781b8/messages', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(res.data);
  } catch (e) {
    console.error(e.response?.data || e.message);
  }
}
run();
