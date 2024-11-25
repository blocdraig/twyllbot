import logger from './lib/logger';
import { NarrowedContext } from 'telegraf';
import Context from 'telegraf/typings/context';
import { KeyedDistinct } from 'telegraf/typings/core/helpers/util';
import { Message } from '@telegraf/types/message';
import { Update } from '@telegraf/types/update';
import { ActionTypes, matchString } from './entities/strings';
import { isChatAdmin } from './entities/chatAdmins';

const check = async (
  ctx: NarrowedContext<
    Context<Update>,
    Update.MessageUpdate<KeyedDistinct<Message, 'text'>>
  >
): Promise<void> => {
  // If user is chat admin, skip check
  const isAdmin = isChatAdmin(ctx.message.chat.id, ctx.message.from?.id);
  if (isAdmin) {
    logger.debug(`User is admin, skipping check`);
    return;
  }

  // Check if message contains string from database
  const match = matchString(ctx.message.text);
  if (match) {
    logger.debug([
      `Matching string found in message:`,
      match,
      ctx.message.text,
    ]);
    if (!isAdmin && ctx.message.from?.id && match.action === ActionTypes.BAN) {
      // Ban user
      ctx
        .banChatMember(ctx.message.from?.id)
        .then(() => {
          logger.info(
            `User banned: ${ctx.message.from?.username} (${ctx.message.from?.id})`
          );
        })
        .catch((err) => {
          logger.error(`Error banning user:`, err);
        });
    }
    // Delete message
    ctx
      .deleteMessage(ctx.message.message_id)
      .then(() => {
        logger.info(`Message deleted:`);
      })
      .catch((err) => {
        logger.error(`Error deleting message:`, err);
      });
  }
};

export default {
  check,
};
