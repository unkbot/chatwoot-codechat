import axios from 'axios';
import mimeTypes from "mime-types";
import { CODECHAT_API_KEY, CODECHAT_BASE_URL } from '../../config';

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
    const url = `${CODECHAT_BASE_URL}/instance/create`;
    const data = {
      instanceName: name,
    };

    await axios.post(url, JSON.stringify(data), {
      headers: {
        'apikey': CODECHAT_API_KEY,
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
    const url = `${CODECHAT_BASE_URL}/instance/connect/${name}`;

    const result = await axios.get(url, {
      headers: {
        'apikey': CODECHAT_API_KEY,
        'Content-Type': 'application/json'
      },
    });

    return result;
  } catch (error) {
    throw new Error(error);
  }
}

export const logoutInstancia = async (name: string) => {
  try {
    const url = `${CODECHAT_BASE_URL}/instance/logout/${name}`;

    const result = await axios.delete(url, {
      headers: {
        'apikey': CODECHAT_API_KEY,
      },
    });

    return result;
  } catch (error) {
    throw new Error(error);
  }
}

export const statusInstancia = async (name: string) => {
  try {
    const url = `${CODECHAT_BASE_URL}/instance/connectionState/${name}`;

    const result = await axios.get(url, {
      headers: {
        'apikey': CODECHAT_API_KEY,
        'Content-Type': 'application/json'
      },
    });

    return result;

  } catch (error) {
    throw new Error(error);
  }

}

export const sendText = async (message: string, number: string, instancia: string) => {
  try {
    const url = `${CODECHAT_BASE_URL}/message/sendText/${instancia}`;
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
        'apikey': CODECHAT_API_KEY,
        'Content-Type': 'application/json'
      },
    });

    return result;
  }
  catch (error) {
    throw new Error(error);
  }
};

export const sendAttachment = async (number: string, media: any, instancia: string, caption?: string) => {
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

    const url = type === "audio" ? `${CODECHAT_BASE_URL}/message/sendWhatsAppAudio/${instancia}` : `${CODECHAT_BASE_URL}/message/sendMedia/${instancia}`;

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
        'apikey': CODECHAT_API_KEY,
        'Content-Type': 'application/json'
      },
    });

    return result;
  }
  catch (error) {
    throw new Error(error);
  }
};

export const getBase64FromMediaMessage = async (id: string, instancia: string) => {
  try {
    const url = `${CODECHAT_BASE_URL}/chat/getBase64FromMediaMessage/${instancia}`;
    const data = {
      "key": {
        "id": id
      }
    };

    const result = await axios.post(url, JSON.stringify(data), {
      headers: {
        'apikey': CODECHAT_API_KEY,
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
    audioMessage: msg.audioMessage?.caption,
    
  };

  return types;
};

export const getConversationMessage = (msg: Message): string => {
  const types = getTypeMessage(msg);

  const messageContent = getMessageContent(types);

  return messageContent;
};