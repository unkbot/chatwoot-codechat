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


app.post('/create-provider', async (req: Request, res: Response) => {

  const { account_id, token, url, nameInbox } = req.body;

  if (!account_id || !token || !url) {
    return res.json({ message: 'error', error: 'Dados inválidos' });
  }

  try {

    db.exec(`CREATE TABLE IF NOT EXISTS providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER,
      token TEXT,
      url TEXT,
      nameInbox TEXT
    )`);

    const stmtExist = db.prepare(`SELECT * FROM providers WHERE account_id = ?`);
    const exist = stmtExist.get(account_id);

    if (exist) {
      return res.json({ message: 'error', error: 'Já existe um provider com esse account_id' });
    }

    const stmt = db.prepare(`INSERT INTO providers (account_id, token, url, nameInbox) VALUES (?, ?, ?, ?)`);
    const info = stmt.run(account_id, token, url, nameInbox);

    res.json({ message: 'ok', info });


  } catch (error) {
    res.json({ message: 'error', error });
  }
});

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
