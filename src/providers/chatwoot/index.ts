import ChatwootClient from "@figuro/chatwoot-sdk";
import { CHATWOOT_ACCOUNT_ID, CHATWOOT_BASE_URL, CHATWOOT_TOKEN } from "../../config";

const ACCOUNT_ID = CHATWOOT_ACCOUNT_ID;

const client = new ChatwootClient({
  config: {
    basePath: CHATWOOT_BASE_URL,
    with_credentials: true,
    credentials: "include",
    token: CHATWOOT_TOKEN,
  }
});

export const getContact = async (id: number) => {
  const contact = await client.contact.getContactable({
    accountId: +ACCOUNT_ID,
    id
  });

  return contact;
};

export const updateContact = async (id: number, data: any) => {
  const contact = await client.contacts.update({
    accountId: +ACCOUNT_ID,
    id,
    data
  });

  return contact;
};

export const createContact = async (phoneNumber: string, inboxId: number, name?: string) => {
  const create = await client.contacts.create({
    accountId: +ACCOUNT_ID,
    data: {
      "inbox_id": inboxId,
      "name": name || phoneNumber,
      "phone_number": `+${phoneNumber}`,
    }
  });

  return create;
};

export const findContact = async (phoneNumber: string) => {
  const contact = await client.contacts.search({
    accountId: +ACCOUNT_ID,
    q: `+${phoneNumber}`
  });

  return contact.payload.find((contact) => contact.phone_number === `+${phoneNumber}`);
};

export const createConversation = async (body: any) => {
  try {
    const chatId = body.data.key.remoteJid.split("@")[0];
    const nameContact = !body.data.key.fromMe ? body.data.pushName : chatId;

    const filterInbox = await getInbox(body.instance);

    const contact = await findContact(chatId) || await createContact(chatId, filterInbox.id, nameContact) as any;

    const contactId = contact.id || contact.payload.contact.id;

    if(!body.data.key.fromMe && contact.name === chatId && nameContact !== chatId) {
      await updateContact(contactId, {
        name: nameContact
      });
    }

    const contactConversations = await client.contacts.listConversations({
      accountId: +ACCOUNT_ID,
      id: contactId
    }) as any;
    
    if (contactConversations) {
      const conversation = contactConversations.payload.find(conversation => conversation.status !== "resolved");
      if (conversation) {
        return conversation.id;
      }
    }

    const conversation = await client.conversations.create({
      accountId: +ACCOUNT_ID,
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

export const getInbox = async (instance) => {
  const inbox = await client.inboxes.list({
    accountId: +ACCOUNT_ID,
  }) as any;
  const findByName = inbox.payload.find((inbox) => inbox.name === instance);
  return findByName;
};

export const createMessage = async (conversationId: number, content: string, messageType: "incoming" | "outgoing" | undefined, attachments?: {
  content: unknown;
  encoding: string;
  filename: string;
}[]) => {
  const message = await client.messages.create({
    accountId: +ACCOUNT_ID,
    conversationId: conversationId,
    data: {
      content: content,
      message_type: messageType,
      attachments: attachments
    }
  });

  return message;
};

export const createBotMessage = async (content: string, messageType: "incoming" | "outgoing" | undefined, instancia: string, attachments?: {
  content: unknown;
  encoding: string;
  filename: string;
}[]) => {


  const contact = await findContact("123456")

  const filterInbox = await getInbox(instancia);

  const findConversation = await client.conversations.list({
    accountId: +ACCOUNT_ID,
    inboxId: filterInbox.id,
  });
  const conversation = findConversation.data.payload.find((conversation) => conversation?.meta?.sender?.id === contact.id && conversation.status === "open");

  const message = await client.messages.create({
    accountId: +ACCOUNT_ID,
    conversationId: conversation.id,
    data: {
      content: content,
      message_type: messageType,
      attachments: attachments
    }
  });

  return message;
};