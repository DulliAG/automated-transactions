import dotenv from 'dotenv';
dotenv.config();
import { Client, Credentials } from '@dulliag/logger.js';

const credentials: Credentials = {
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_DATABASE!,
};

export const client = new Client('PostgreSQL', credentials, {
  application: process.env.APPLICATION!,
});
