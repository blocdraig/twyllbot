export const TOKEN = process.env.BOT_TOKEN || '';

export const ADMINS = new Set(
  process.env.ADMIN_IDS?.split(',').map((id) => {
    return parseInt(id);
  }) || []
);

export const CHATS = new Set(
  process.env.CHAT_IDS?.split(',').map((id) => {
    return parseInt(id);
  }) || []
);
