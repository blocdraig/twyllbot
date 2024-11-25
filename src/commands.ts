import logger from './lib/logger';
import { NarrowedContext } from 'telegraf';
import Context from 'telegraf/typings/context';
import { KeyedDistinct } from 'telegraf/typings/core/helpers/util';
import { Message } from '@telegraf/types/message';
import { Update } from '@telegraf/types/update';
import { ActionTypes, addString } from './entities/strings';
import { isChatAdmin } from './entities/chatAdmins';

const add = async (
  ctx: NarrowedContext<
    Context<Update>,
    Update.MessageUpdate<KeyedDistinct<Message, 'text'>>
  >
) => {
  logger.info(`Command /tadd received`);
  const match = ctx.message.text.match(/\/tadd (delete|ban) (.*)/);
  logger.info(JSON.stringify(match));
  const action = match?.[1];
  const value = match?.[2];
  if (action && value) {
    logger.info(`Action: ${action}, Value: ${value}`);
    await addString({ action, value });

    ctx.reply(`String added`).then((value) => {
      // Delete bot message after delay 5 seconds
      setTimeout(() => {
        ctx.deleteMessage(value.message_id).catch((err) => {
          logger.error(`Error deleting message:`, err);
        });
      }, 5000);
    });

    // Delete command message
    ctx.deleteMessage(ctx.message.message_id).catch((err) => {
      logger.error(`Error deleting message:`, err);
    });
  }
};

const spam = async (
  ctx: NarrowedContext<
    Context<Update>,
    Update.MessageUpdate<KeyedDistinct<Message, 'text'>>
  >
) => {
  logger.info(`Command /tspam received`);
  const match = ctx.message.text.match(/\/tspam (delete|ban) (.*)/);
  let action = match?.[1];
  let value = match?.[2];

  // @ts-ignore
  if (ctx.message?.reply_to_message) {
    if (!action && !value) {
      action = ActionTypes.BAN;
      // @ts-ignore
      value = ctx.message.reply_to_message.text;
    }

    const originalMessage = // @ts-ignore
      ctx.message.reply_to_message as Message.TextMessage;
    // add message to database
    await addString({ action, value });

    const isAdmin = isChatAdmin(
      originalMessage.chat.id,
      originalMessage.from?.id
    );

    if (!isAdmin && originalMessage.from?.id && action === ActionTypes.BAN) {
      // Ban original message user
      ctx
        .banChatMember(originalMessage.from?.id)
        .then(() => {
          logger.info(
            `User banned: ${originalMessage.from?.username} (${originalMessage.from?.id})`
          );
        })
        .catch((err) => {
          logger.error(`Error banning user:`, err);
        });
    }
    // Delete original message
    ctx
      .deleteMessage(originalMessage.message_id)
      .then(() => {
        logger.info(`Message deleted:`);
      })
      .catch((err) => {
        logger.error(`Error deleting message:`, err);
      });

    // Reply to user
    ctx.reply(`Spam deleted and added to sample database`).then((value) => {
      // Delete bot message after delay 5 seconds
      setTimeout(() => {
        ctx.deleteMessage(value.message_id).catch((err) => {
          logger.error(`Error deleting message:`, err);
        });
      }, 5000);
    });

    // Delete command message
    ctx.deleteMessage(ctx.message.message_id).catch((err) => {
      logger.error(`Error deleting message:`, err);
    });
  }
};

export default {
  add,
  spam,
};
