import logger from '../lib/logger';
import { Telegraf } from 'telegraf';

let chatAdmins: { [key: number]: Set<number> | null } = {};

export const loadChatAdmins = async (
  bot: Telegraf,
  chats: Set<number>
): Promise<void> => {
  for (const chat of chats) {
    logger.info(`Loading chat admins for chat ${chat}`);
    if (chatAdmins[chat] === null || chatAdmins[chat] === undefined) {
      chatAdmins[chat] = await bot.telegram
        .getChatAdministrators(chat)
        .then((res) => {
          const admins = new Set<number>();
          for (const admin of res) {
            admins.add(admin.user.id);
          }
          return admins;
        })
        .catch((err) => {
          logger.error(`Error getting chat admins: ${err}`);
          return null;
        });
    }
  }
};

export const getChatAdmins = () => {
  return chatAdmins;
};

export const isChatAdmin = (
  chatId: number,
  userId: number | undefined
): boolean => {
  if (userId <= 0) return false;
  return chatAdmins[chatId]?.has(userId) || false;
};
