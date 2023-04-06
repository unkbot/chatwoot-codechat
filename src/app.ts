import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { eventCodeChat, eventChatWoot } from './events';

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use(express.json());

app.post('/webhook/:provider', async (req: Request, res: Response) => {
  const provider = req.params.provider;
  let result = null;
  if (provider === 'chatwoot') {
    result = await eventChatWoot(req.body);
  }

  if (provider === 'codechat') {
    result = await eventCodeChat(req.body);
  }

  res.json({ message: 'ok', result });
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
