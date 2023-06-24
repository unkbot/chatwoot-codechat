import ChatwootClient from "@figuro/chatwoot-sdk";
import db from "../../db";
import { createReadStream, unlink, unlinkSync } from "fs";
import axios from "axios";
import FormData from 'form-data';


export const clientCw = async (accountId: number) => {
  const provider = await db.prepare(`SELECT * FROM providers WHERE account_id = ?`).get(accountId) as any;
  if (!provider) {
    throw new Error("Provider não encontrado");
  }

  const client = new ChatwootClient({
    config: {
      basePath: provider.url,
      with_credentials: true,
      credentials: "include",
      token: provider.token,
    }
  });

  return client;
};

export const getContact = async (id: number, accountId: number) => {
  const client = await clientCw(accountId);

  if (id && accountId) {
    const contact = await client.contact.getContactable({
      accountId: accountId,
      id
    });

    return contact;
  } else {
    return null;
  }
};

export const updateContact = async (id: number, data: any, accountId: number) => {
  const client = await clientCw(accountId);

  const contact = await client.contacts.update({
    accountId,
    id,
    data
  });

  return contact;
};

export const createContact = async (phoneNumber: string, inboxId: number, accountId: number, name?: string) => {
  const client = await clientCw(accountId);

  const create = await client.contacts.create({
    accountId,
    data: {
      "inbox_id": inboxId,
      "name": name || phoneNumber,
      "phone_number": `+${phoneNumber}`,
    }
  });

  return create;
};

export const findContact = async (phoneNumber: string, accountId: number) => {
  const client = await clientCw(accountId);

  const contact = await client.contacts.search({
    accountId,
    q: `+${phoneNumber}`
  });

  return contact.payload.find((contact) => contact.phone_number === `+${phoneNumber}`);
};

export const createConversation = async (body: any, accountId: number) => {
  try {
    const client = await clientCw(accountId);


    const chatId = body.data.key.remoteJid.split("@")[0];
    const nameContact = !body.data.key.fromMe ? body.data.pushName : chatId;

    const filterInbox = await getInbox(body.instance, accountId);

    const contact = await findContact(chatId, accountId) || await createContact(chatId, filterInbox.id, accountId, nameContact) as any;

    const contactId = contact.id || contact.payload.contact.id;

    if (!body.data.key.fromMe && contact.name === chatId && nameContact !== chatId) {
      await updateContact(contactId, {
        name: nameContact
      },
        accountId
      );
    }

    const contactConversations = await client.contacts.listConversations({
      accountId,
      id: contactId
    }) as any;

    if (contactConversations) {
      const conversation = contactConversations.payload.find(conversation => conversation.status !== "resolved" && conversation.inbox_id == filterInbox.id);
      if (conversation) {
        return conversation.id;
      }
    }

    const conversation = await client.conversations.create({
      accountId,
      data: {
        contact_id: `${contactId}`,
        inbox_id: `${filterInbox.id}`,
      },
    });

    return conversation.id;

  } catch (error) {
    console.log(error)
    throw new Error(error);
  }
};

export const getInbox = async (instance: any, accountId: number) => {
  const client = await clientCw(accountId);

  const inbox = await client.inboxes.list({
    accountId,
  }) as any;
  const findByName = inbox.payload.find((inbox) => inbox.name === instance);
  return findByName;
};

export const createMessage = async (accountId: number, conversationId: number, content: string, messageType: "incoming" | "outgoing" | undefined, attachments?: {
  content: unknown;
  encoding: string;
  filename: string;
}[]) => {
  const client = await clientCw(accountId);

  const message = await client.messages.create({
    accountId,
    conversationId: conversationId,
    data: {
      content: content,
      message_type: messageType,
      attachments: attachments
    }
  });

  return message;
};

export const createBotMessage = async (accountId: number, content: string, messageType: "incoming" | "outgoing" | undefined, instancia: string, attachments?: {
  content: unknown;
  encoding: string;
  filename: string;
}[]) => {

  const client = await clientCw(accountId);

  const contact = await findContact("123456", accountId)

  const filterInbox = await getInbox(instancia, accountId);

  const findConversation = await client.conversations.list({
    accountId,
    inboxId: filterInbox.id,
  });
  const conversation = findConversation.data.payload.find((conversation) => conversation?.meta?.sender?.id === contact.id && conversation.status === "open");

  const message = await client.messages.create({
    accountId,
    conversationId: conversation.id,
    data: {
      content: content,
      message_type: messageType,
      attachments: attachments
    }
  });

  return message;
};

export const sendData = async (accountId: number, conversationId: number, file: string, messageType: "incoming" | "outgoing" | undefined, content?: string) => {
  const data = new FormData();

  if (content) {
    data.append('content', content);
  }

  data.append('message_type', messageType);

  data.append('attachments[]', createReadStream(file));

  const provider = db.prepare(`SELECT * FROM providers WHERE account_id = ?`).get(accountId) as any;

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${provider.url}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
    headers: {
      'api_access_token': provider.token,
      ...data.getHeaders()
    },
    data: data
  };

  try {
    const { data } = await axios.request(config);
    unlinkSync(file);
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const createBotQr = async (accountId: number, content: string, messageType: "incoming" | "outgoing" | undefined, instancia: string, file?: string) => {

  const client = await clientCw(accountId);

  const contact = await findContact("123456", accountId)

  const filterInbox = await getInbox(instancia, accountId);

  const findConversation = await client.conversations.list({
    accountId,
    inboxId: filterInbox.id,
  });
  const conversation = findConversation.data.payload.find((conversation) => conversation?.meta?.sender?.id === contact.id && conversation.status === "open");

 
  const data = new FormData();

  if (content) {
    data.append('content', content);
  }

  data.append('message_type', messageType);

  if(file){

  data.append('attachments[]', createReadStream(file));

  }

  const provider = db.prepare(`SELECT * FROM providers WHERE account_id = ?`).get(accountId) as any;

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${provider.url}/api/v1/accounts/${accountId}/conversations/${conversation.id}/messages`,
    headers: {
      'api_access_token': provider.token,
      ...data.getHeaders()
    },
    data: data
  };

  try {
    const { data } = await axios.request(config);
    unlinkSync(file);
    return data;
  } catch (error) {
    console.log(error);
  }
};
