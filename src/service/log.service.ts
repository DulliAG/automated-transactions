import dotenv from 'dotenv';
dotenv.config();
import { PRODUCTION } from '../constants';
import { Client, Credentials, Database, LogVariant } from '@dulliag/logger.js';

const credentials: Credentials = {
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_DATABASE!,
};

const LOGGER = new Client(Database.PG, credentials, process.env.APPLICATION);

export const createLog = (variant: LogVariant, category: string, message: string) => {
  return PRODUCTION ? LOGGER.log(variant, category, message) : null;
};
