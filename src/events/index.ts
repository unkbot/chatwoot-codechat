import mimeTypes from "mime-types";
import {
  createBotMessage,
  createConversation,
  createMessage,
  findContact,
  getInbox,
  updateContact,
} from "../providers/chatwoot";
import {
  getBase64FromMediaMessage,
  getConversationMessage,
  isMediaMessage,
  createInstancia,
  sendAttachment,
  sendText,
  logoutInstancia,
  statusInstancia
} from "../providers/codechat"
import { TOSIGN } from "../config";

export const eventChatWoot = async (body: any) => {

  if (!body?.conversation) return { message: 'bot' };

  const chatId = body.conversation.meta.sender.phone_number.replace('+', '');
  const messageReceived = body.content;
  const senderName = body?.sender?.name;

  console.log(`🎉 Evento recebido de ${chatId}`, body);

  if (chatId === '123456' && body.message_type === 'outgoing') {
    const command = messageReceived.replace("/", "");    

    if (command === "iniciar") {
      try {
        const status = await statusInstancia(body.inbox.name);
        if (status.data.state !== "open") {
          await createInstancia(body.inbox.name);
        } else {
          await createBotMessage(`🚨 Instância ${body.inbox.name} já está conectada.`, "incoming", body.inbox.name);
        }
      }
      catch (error) {
        await createInstancia(body.inbox.name);
      }

    }

    if (command === "status") {
      console.log(`Status da instância ${body.inbox.name}: `)

      const status = await statusInstancia(body.inbox.name);

      await createBotMessage(`⚠️ Status da instância ${body.inbox.name}: *${status.data.state}*`, "incoming", body.inbox.name);
    }

    if (command === "desconectar") {
      console.log(`Desconectando Whatsapp ${body.inbox.name}: `)
      const msgLogout = `🚨 Desconectando Whatsapp da caixa de entrada *${body.inbox.name}*: `;
      await createBotMessage(msgLogout, "incoming", body.inbox.name);
      await logoutInstancia(body.inbox.name);
    }
  }
  
  if (body.message_type === 'outgoing' && body?.conversation?.messages?.length && chatId !== '123456') {

    let formatText: string;
    if (senderName === null || senderName === undefined) {
      formatText = messageReceived;
    } else {
      formatText = TOSIGN ? `*${senderName}*: ${messageReceived}` : messageReceived;
    }

    for (const message of body.conversation.messages) {

      if (message.attachments && message.attachments.length > 0) {

        for (const attachment of message.attachments) {
          console.log(attachment)
          sendAttachment(
            chatId,
            attachment.data_url,
            body.inbox.name,
            formatText
          );
        }
      } else {
        sendText(formatText, chatId, body.inbox.name);
      }
    }
  }

  return { message: 'bot' };
}

export const eventCodeChat = async (body: any) => {
  try {
    const instance = body.instance;

    console.log(`🎉 Evento recebido de ${instance}`, body);

    if (body.event === "messages.upsert" && !body.data.key.fromMe) {
      const getConversion = await createConversation(body);

      if (!getConversion) {
        console.log("🚨 Erro ao criar conversa");
        return;
      }

      const isMedia = isMediaMessage(body.data.message);
      const bodyMessage = getConversationMessage(body.data.message);

      if (isMedia) {
        const downloadBase64 = await getBase64FromMediaMessage(
          body.data.key.id,
          instance
        );
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
          getConversion,
          bodyMessage,
          "incoming",
          attachments
        );
      } else {
        return await createMessage(getConversion, bodyMessage, "incoming");
      }
    }

    if (body.event === "qrcode.updated") {
      if (body.data.statusCode === 500) {
        const erroQRcode = `🚨 Limite de geração de QRCode atingido, para gerar um novo QRCode, envie a mensagem /iniciar novamente.`;
        return await createBotMessage(
          erroQRcode,
          "incoming",
          instance
        );
      } else {
        const attachments = [
          {
            content: body.data?.qrcode.base64.replace(
              "data:image/png;base64,",
              ""
            ),
            encoding: "base64",
            filename: `${instance}.png`,
          },
        ];
        await createBotMessage("Qrcode", "incoming", instance, attachments);

        const msgQrCode = `⚡️ QRCode gerado com sucesso!\n\nDigitalize este código QR nos próximos 40 segundos:`;
        await createBotMessage(msgQrCode, "incoming", instance);
      }
    }

    if (body.event === "status.instance") {
      const { data } = body;
      const inbox = await getInbox(instance);
      const msgStatus = `⚡️ Status da instância ${inbox.name}: ${data.status}`;
      await createBotMessage(msgStatus, "incoming", instance);
    }

    if (body.event === "connection.update") {
      console.log("connection.update");

      if (body.data.state === "open") {
        const msgConnection = `🚀 Conexão realizada com sucesso!`;
        await createBotMessage(msgConnection, "incoming", instance);
      }
    }

    if (body.event === "contacts.update") {
      const { data } = body;

      if (data.length) {
        for (const item of data) {
          const number = item.id.split("@")[0];
          const photo = item.profilePictureUrl || null;
          const find = await findContact(number);

          if (find) {
            await updateContact(find.id, {
              avatar_url: photo,
            });
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

