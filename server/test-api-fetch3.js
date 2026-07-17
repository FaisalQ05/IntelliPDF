import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const token = jwt.sign(
  { userId: 'fe4b5c0b-9df7-4047-bf0e-58fd68ba37fb', role: 'USER' },
  process.env.JWT_ACCESS_SECRET || 'secret',
  { expiresIn: '15m', issuer: 'auth-api' }
);
fetch('http://localhost:4000/api/v1/pdf-chat/chats/5bfd4718-c501-4ed7-b761-56e219d781b8/messages', { headers: { Authorization: `Bearer ${token}` } })
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(err => console.error(err));
