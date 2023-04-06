import axios from 'axios';
import mimeTypes from "mime-types";

const API_KEY = 't8OOEeISKzpmc3jjcMqBWYSaJsafdefer';
const BASE_URL = 'http://localhost:8081';

interface Message {
  conversation: string;
  imageMessage: { caption: string } | undefined;
  videoMessage: { caption: string } | undefined;
  extendedTextMessage: { text: string } | undefined;
  messageContextInfo: { stanzaId: string } | undefined;
  stickerMessage: { fileSha256: Buffer } | undefined;
  documentMessage: { caption: string } | undefined;
  audioMessage: { caption: string } | undefined;
}

export const createInstancia = async (name: string) => {
  try {
    const url = `${BASE_URL}/instance/create`;
    const data = {
      instanceName: name,
    };

    await axios.post(url, JSON.stringify(data), {
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json'
      },
    });

    const connect = await connectInstancia(name);
    return connect;
  } catch (error) {
    throw new Error(error);
  }
}

export const connectInstancia = async (name: string) => {
  try {
    const url = `${BASE_URL}/instance/connect/${name}`;

    const result = await axios.get(url, {
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json'
      },
    });

    return result;
  } catch (error) {
    throw new Error(error);
  }
}

export const sendText = async (message: string, number: string) => {
  try {
    const url = `${BASE_URL}/message/sendText/chatwoot`;
    const data = {
      "number": number,
      "options": {
        "delay": 1200
      },
      "textMessage": {
        "text": message
      }
    };

    const result = await axios.post(url, JSON.stringify(data), {
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json'
      },
    });

    return result;
  }
  catch (error) {
    throw new Error(error);
  }
};

export const sendAttachment = async (number: string, media: any, caption?: string) => {
  try {
    const parts = media.split("/");
    const fileName = decodeURIComponent(parts[parts.length - 1]);

    const mimeType = mimeTypes.lookup(fileName).toString();

    let type = 'document';

    switch (mimeType.split('/')[0]) {
      case 'image':
        type = 'image';
        break;
      case 'video':
        type = 'video';
        break;
      case 'audio':
        type = 'audio';
        break;
      default:
        type = 'document';
        break;
    }

    const url = type === "audio" ? `${BASE_URL}/message/sendWhatsAppAudio/chatwoot` : `${BASE_URL}/message/sendMedia/chatwoot`;

    const data = type === "audio" ? {
      "number": number,
      "audioMessage": {
        "audio": media
      }
    } : {
      "number": number,
      "mediaMessage": {
        "mediatype": type,
        "fileName": fileName,
        "media": media
      }
    } as any;

    if (caption && type !== "audio") {
      data.caption = caption;
    }

    const result = await axios.post(url, JSON.stringify(data), {
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json'
      },
    });

    return result;
  }
  catch (error) {
    throw new Error(error);
  }
};

export const getBase64FromMediaMessage = async (id: string) => {
  try {
    const url = `${BASE_URL}/chat/getBase64FromMediaMessage/chatwoot`;
    const data = {
      "key": {
        "id": id
      }
    };

    const result = await axios.post(url, JSON.stringify(data), {
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json'
      },
    });

    return result;
  } catch (error) {
    throw new Error(error);
  }

};

export const isMediaMessage = (message: any) => {
  const media = [
    "imageMessage",
    "documentMessage",
    "audioMessage",
    "videoMessage",
    "stickerMessage"
  ];

  const messageKeys = Object.keys(message);
  return messageKeys.some(key => media.includes(key));
};

export const getMessageContent = (types: any): string | undefined => {
  const typeKey = Object.keys(types).find(key => types[key] !== undefined);
  return typeKey ? types[typeKey] : undefined;
};

export const getTypeMessage = (msg: Message) => {
  const types = {
    conversation: msg.conversation,
    imageMessage: msg.imageMessage?.caption,
    videoMessage: msg.videoMessage?.caption,
    extendedTextMessage: msg.extendedTextMessage?.text,
    messageContextInfo: msg.messageContextInfo?.stanzaId,
    stickerMessage: msg.stickerMessage?.fileSha256.toString("base64"),
    documentMessage: msg.documentMessage?.caption,
    audioMessage: msg.audioMessage?.caption
  };

  return types;
};

export const getConversationMessage = (msg: Message): string => {
  const types = getTypeMessage(msg);

  const messageContent = getMessageContent(types);

  return messageContent;
};