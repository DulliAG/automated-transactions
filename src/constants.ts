import dotenv from 'dotenv';
dotenv.config();

export const PRODUCTION = process.env.PRODUCTION === 'true';
