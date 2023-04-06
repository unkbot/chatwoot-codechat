import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { eventCodeChat, eventChatWoot } from './events';

dotenv.config();


// teste remover

import ChatwootClient from "@figuro/chatwoot-sdk";

const ACCOUNT_ID = 76598
const INBOX_ID = 26876

const client = new ChatwootClient({
  config: {
    basePath: "https://app.chatwoot.com",
    with_credentials: true,
    credentials: "include",
    token: "LrN39bkVbbFRr5H3WBQUzRf3",
  }
});

const app: Express = express();
const port = process.env.PORT;

app.use(express.json());

app.post('/webhook/:provider', async (req: Request, res: Response) => {
  const provider = req.params.provider;
  let result = null;

  console.log(req.body)

  // console.log(req.body)


  // const findContact = await client.contacts.create({
  //   accountId: +ACCOUNT_ID,
  //   data: {
  //     "inbox_id": INBOX_ID,
  //     // "name": "string",
  //     // "email": "string",
  //     "name": "string",
  //     "phone_number": "+556484338175",
  //     "avatar": null,
  //     "avatar_url": "string",
  //     "identifier": "string",
  //     "custom_attributes": {}
  //   }
  // })

  // console.log(findContact)


  // console.log(req.body)


  // console.log(await client.contacts.search({
  //   accountId: +ACCOUNT_ID,
  //   q: "+5564843381752"
  // }))




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
