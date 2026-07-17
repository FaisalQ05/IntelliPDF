import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });
const token = jwt.sign({ userId: 'fe4b5c0b-9df7-4047-bf0e-58fd68ba37fb' }, process.env.JWT_SECRET || 'secret');
axios.get('http://localhost:4000/api/v1/pdf-chat/chats/5bfd4718-c501-4ed7-b761-56e219d781b8/messages', { headers: { Authorization: `Bearer ${token}` } })
  .then(res => console.log(JSON.stringify(res.data, null, 2)))
  .catch(err => console.error(err.response?.data || err.message));
