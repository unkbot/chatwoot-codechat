import ChatwootClient from "@figuro/chatwoot-sdk";

const ACCOUNT_ID = 76598;
const INBOX_ID = 26876;

const client = new ChatwootClient({
  config: {
    basePath: "https://app.chatwoot.com",
    with_credentials: true,
    credentials: "include",
    token: "LrN39bkVbbFRr5H3WBQUzRf3",
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

export const createContact = async (phoneNumber: string, name?: string) => {
  const create = await client.contacts.create({
    accountId: +ACCOUNT_ID,
    data: {
      "inbox_id": INBOX_ID,
      "name": name || phoneNumber,
      "phone_number": `+${phoneNumber}`,
      "avatar": null,
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
    const nameContact = body.data.pushName;

    const contact = await findContact(chatId) || await createContact(chatId, nameContact) as any;

    const contactId = contact.id || contact.payload.contact.id;

    const findConversation = await client.conversations.list({
      accountId: ACCOUNT_ID,
      inboxId: INBOX_ID,
    });
    const getOpen = findConversation.data.payload.find((conversation) => conversation?.meta?.sender?.id === contactId && conversation.status === "open");

    if (getOpen) {
      return getOpen;
    }

    const conversation = await client.conversations.create({
      accountId: +ACCOUNT_ID,
      data: {
        contact_id: `${contactId}`,
        inbox_id: `${INBOX_ID}`,
      },
    });

    return conversation;

  } catch (error) {
    throw new Error(error);
  }
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
