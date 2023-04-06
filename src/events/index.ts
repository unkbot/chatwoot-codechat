import mimeTypes from "mime-types";
import {
  createConversation,
  createMessage,
  findContact,
  updateContact,
} from "../providers/chatwoot";
import {
  getBase64FromMediaMessage,
  getConversationMessage,
  isMediaMessage,
  createInstancia,
  sendAttachment,
  sendText
} from "../providers/codechat"

export const eventChatWoot = async (body: any) => {

  //teste


  const ids = {
    accountId: body.id,
    inboxId: body.inbox.id,
  }

 

  if(!body?.conversation) return { message: 'bot' };
  const chatId = body.conversation.meta.sender.phone_number.replace('+', '');
  const messageReceived = body.content;

  if (chatId === '123456') {
    const command = messageReceived.replace("/", "");

    if (command === "iniciar") {
      await createInstancia(body.inbox.name);
    }
  }


  if (body.message_type === 'outgoing' && body?.conversation?.messages?.length) {
    for (const message of body.conversation.messages) {
      if (message.attachments && message.attachments.length > 0) {
        for (const attachment of message.attachments) {
          sendAttachment(chatId, attachment.data_url, messageReceived);
        }
      } else {
        sendText(messageReceived, chatId);
      }
    }
  }

  return { message: 'bot' };
}

export const eventCodeChat = async (body: any) => {
  if (body.event === "messages.upsert" && !body.data.key.fromMe) {
    const getConversion = await createConversation(body);

    if (!getConversion || !getConversion.id) {
      return;
    }

    const isMedia = isMediaMessage(body.data.message);
    const bodyMessage = getConversationMessage(body.data.message);

    if (isMedia) {
      const downloadBase64 = await getBase64FromMediaMessage(body.data.key.id);
      const random = Math.random().toString(36).substring(7);
      const nameFile = `${random}.${mimeTypes.extension(
        downloadBase64.data.mimetype
      )}`;
      const attachments = [
        {
          content: downloadBase64.data.base64,
          encoding: "base64",
          filename: downloadBase64.data?.fileName || nameFile,
        },
      ];
      return await createMessage(
        getConversion.id,
        bodyMessage,
        "incoming",
        attachments
      );
    } else {
      return await createMessage(getConversion.id, bodyMessage, "incoming");
    }
  }

  if (body.event === "qrcode.updated") {
    if (body.data.statusCode === 500) {
      const erroQRcode =
        "Limite de QRCode atingido, se deseja gerar um novo QRCode, digite o comando /iniciar";
      return await createMessage(6, erroQRcode, "incoming");
    } else {
      const attachments = [
        {
          content: body.data?.qrcode.base64.replace(
            "data:image/png;base64,",
            ""
          ),
          encoding: "base64",
          filename: `qr.png`,
        },
      ];
      await createMessage(6, "Qrcode", "incoming", attachments);

      const msgQrCode = `⚡️ QRCode gerado com sucesso! \n\nDigitalize este código QR nos próximos 40 segundos:`;
      await createMessage(6, msgQrCode, "incoming");
    }
  }

  if (body.event === "connection.update") {
    console.log("connection.update");
  }

  if (body.event === "contacts.update") {
    const { data } = body

    if (data.length) {
      for (const item of data) {
        const number = item.id.split('@')[0]
        const photo = item.profilePictureUrl || null
        const find = await findContact(number)

        if (find) {
          await updateContact(find.id, {
            avatar_url: photo
          })
        }
      }
    }
  }
};
