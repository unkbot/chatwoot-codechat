import dotenv from 'dotenv';
dotenv.config();

export const CODECHAT_BASE_URL = process.env.CODECHAT_BASE_URL;
export const CODECHAT_API_KEY = process.env.CODECHAT_API_KEY;
export const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
export const CHATWOOT_TOKEN = process.env.CHATWOOT_TOKEN;
export const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL;
export const TOSIGN = process.env.TOSIGN === 'true';
export const IMPORT_MESSAGES_SENT = process.env.IMPORT_MESSAGES_SENT === 'true';
