import express, { Express, Request, Response, json, urlencoded } from 'express';
import dotenv from 'dotenv';
import { eventCodeChat, eventChatWoot } from './events';
import db from './db';

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use(
  urlencoded({ extended: true, limit: '50mb' }),
  json({ limit: '50mb' }),
);

app.post('/webhook/:provider', async (req: Request, res: Response) => {
  try {
    const provider = req.params.provider;
    let result = null;
    if (provider === 'chatwoot') {
      result = await eventChatWoot(req.body);
    }

    if (provider === 'codechat') {
      result = await eventCodeChat(req.body);
    }

    res.json({ message: 'ok', result });
  } catch (error) {
    res.json({ message: 'error', error });
  }
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
