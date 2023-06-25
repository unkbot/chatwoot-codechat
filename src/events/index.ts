import mimeTypes from "mime-types";
import {
  createBotMessage,
  createBotQr,
  createConversation,
  createMessage,
  findContact,
  getInbox,
  sendData,
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
  statusInstancia,
} from "../providers/codechat";
import { IMPORT_MESSAGES_SENT, TOSIGN, CHATWOOT_TOKEN, CHATWOOT_BASE_URL } from "../config";
import { writeFileSync } from "fs";
import db from "../db";
import path from "path";

const messages_sent: string[] = [];

export const eventChatWoot = async (body: any): Promise<{ message: string }> => {
  if (!body?.conversation || body.private) return { message: 'bot' };
  const chatId = body.conversation.meta.sender.phone_number.replace('+', '');
  const messageReceived = body.content;
  const senderName = body?.sender?.name;
  const accountId = body.account.id as number;

  console.log(`🎉 Evento recebido de ${chatId}`);

  if (chatId === '123456' && body.message_type === 'outgoing') {
    const command = messageReceived.replace("/", "");
    if (command === "iniciar") {
      try {

        db.exec(`CREATE TABLE IF NOT EXISTS providers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          account_id INTEGER,
          token TEXT,
          url TEXT,
          nameInbox TEXT
        )`);
    
        const stmtExistId = db.prepare('SELECT * FROM providers WHERE account_id = ?');
        const stmtExistName = db.prepare('SELECT * FROM providers WHERE nameInbox = ?');
        const instanceDbId = stmtExistId.get(accountId);
        const instanceDbName = stmtExistName.get(body.inbox.name);
        
        if (!instanceDbId || !instanceDbName) {
          const stmt = db.prepare('INSERT INTO providers (account_id, token, url, nameInbox) VALUES (?, ?, ?, ?)');
          stmt.run(accountId, CHATWOOT_TOKEN, CHATWOOT_BASE_URL, body.inbox.name);
        }  

        const status = await statusInstancia(body.inbox.name) as any;

        console.log(status.data)

        if (status.data.state !== "open") {
          await createInstancia(body.inbox.name);
        } else {
          await createBotMessage(accountId, `🚨 Instância ${body.inbox.name} já está conectada.`, "incoming", body.inbox.name);
        }
      }
      catch (error) {
        await createInstancia(body.inbox.name);
      }

    }

    if (command === "status") {
      console.log(`Status da instância ${body.inbox.name}: `)

      const status = await statusInstancia(body.inbox.name);

      if (!status) {
        await createBotMessage(accountId, `⚠️ Instância ${body.inbox.name} não existe.`, "incoming", body.inbox.name);
      }

      if (status) {
        await createBotMessage(accountId, `⚠️ Status da instância ${body.inbox.name}: *${status.data.state}*`, "incoming", body.inbox.name);
      }

    }

    if (command === "desconectar") {
      console.log(`Desconectando Whatsapp ${body.inbox.name}: `)
      const msgLogout = `🚨 Desconectando Whatsapp da caixa de entrada *${body.inbox.name}*: `;
      await createBotMessage(accountId, msgLogout, "incoming", body.inbox.name);
      await logoutInstancia(body.inbox.name);
    }
  }

  if (body.message_type === 'outgoing' && body?.conversation?.messages?.length && chatId !== '123456') {
    if (IMPORT_MESSAGES_SENT && messages_sent.includes(body.id)) {
      console.log(`🚨 Não importar mensagens enviadas, ficaria duplicado.`);

      const indexMessage = messages_sent.indexOf(body.id);
      messages_sent.splice(indexMessage, 1);

      return { message: 'bot' };
    }

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

export const eventCodeChat = async (body: any): Promise<any> => {
  try {
    const instance = body.instance;
    console.log(`🎉 Evento recebido de ${instance}`);


    const stmtExist = db.prepare(`SELECT * FROM providers WHERE nameInbox = ?`);
    const instanceDb = stmtExist.get(instance) as any;

    if (!instanceDb) {
      console.log(`🚨 Erro ao buscar instância.`);
      return;
    }

    const accountId = instanceDb.account_id;

    if (body.event === "messages.upsert") {
      if (body.data.key.fromMe && !IMPORT_MESSAGES_SENT) {
        return;
      }

      if (body.data.key.remoteJid === 'status@broadcast') {
        console.log(`🚨 Ignorando status do whatsapp.`);
        return;
      }

      const getConversion = await createConversation(body, accountId);
      const messageType = body.data.key.fromMe ? 'outgoing' : 'incoming';

      if (!getConversion) {
        console.log("🚨 Erro ao criar conversa");
        return;
      }

      const isMedia = isMediaMessage(body.data.message);
      const bodyMessage = getConversationMessage(body.data.message);

      if (isMedia) {
        const downloadBase64 = await getBase64FromMediaMessage(
          body.data,
          instance
        );

        const random = Math.random().toString(36).substring(7);
        const nameFile = `${random}.${mimeTypes.extension(
          downloadBase64.data.mimetype
        )}`;

        const fileData = Buffer.from(downloadBase64.data.base64, 'base64');

        const fileName = `${path.join(__dirname, '../../uploads')}/${nameFile}`

        writeFileSync(fileName, fileData, 'utf8');

        return await sendData(
          accountId,
          getConversion,
          fileName,
          messageType,
          bodyMessage
        );
      }

      const send = await createMessage(accountId, getConversion, bodyMessage, messageType);

      return send;

    }

    if (body.event === "status.instance") {
      const { data } = body;
      const inbox = await getInbox(instance, accountId);
      const msgStatus = `⚡️ Status da instância ${inbox.name}: ${data.status}`;
      await createBotMessage(accountId, msgStatus, "incoming", instance);
    }

    if (body.event === "connection.update") {
      console.log("connection.update");

      if (body.data.state === "open") {
        const msgConnection = `🚀 Conexão realizada com sucesso!`;
        await createBotMessage(accountId, msgConnection, "incoming", instance);
      }
    }

    if (body.event === "contacts.update") {
      const { data } = body;

      if (data.length) {
        for (const item of data) {
          const number = item.id.split("@")[0];
          const photo = item.profilePictureUrl || null;
          const find = await findContact(number, accountId);

          if (find) {
            await updateContact(find.id, {
              avatar_url: photo,
            },
              accountId
            );
          }
        }
      }
    }

    if (body.event === "qrcode.updated") {
      if (body.data.statusCode === 500) {
        const erroQRcode = `🚨 Limite de geração de QRCode atingido, para gerar um novo QRCode, envie a mensagem /iniciar novamente.`;
        return await createBotMessage(
          accountId,
          erroQRcode,
          "incoming",
          instance
        );
      } else {

        const fileData = Buffer.from(body.data?.qrcode.base64.replace(
          "data:image/png;base64,",
          ""
        ), 'base64');

        const fileName = `${path.join(__dirname, '../../uploads')}/${`${instance}.png`}`

        writeFileSync(fileName, fileData, 'utf8');

        await createBotQr(
          accountId,
          "QRCode gerado com sucesso!",
          "incoming",
          instance,
          fileName
        )

        const msgQrCode = `⚡️ QRCode gerado com sucesso!\n\nDigitalize este código QR nos próximos 40 segundos:`;
        await createBotMessage(accountId, msgQrCode, "incoming", instance);
      }
    }

  } catch (error) {
    console.log(error);
  }
};
