import winston from 'winston';
import 'winston-daily-rotate-file';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { ActionTypes, IString } from './types';
import { Message } from 'typegram/message';

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.DailyRotateFile({
      level: 'error',
      dirname: './logs',
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
    new winston.transports.DailyRotateFile({
      level: 'info',
      dirname: './logs',
      filename: '.application-%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

(async () => {
  const db = await open({
    filename: 'database/twyllbot.db',
    driver: sqlite3.Database,
  });

  await db.migrate();

  logger.info(`Starting bot...`);

  const bot = new Telegraf(process.env.BOT_TOKEN as string);

  const ADMINS = process.env.ADMIN_IDS?.split(',') || [];
  const CHATS = process.env.CHAT_IDS?.split(',') || [];
  const STRINGS: IString[] = await db.all('SELECT action, value FROM strings');

  bot.telegram.getMe().then((botInfo) => {
    logger.info(`Bot started: ${botInfo.username} (${botInfo.id})`);
  });

  // Register logger middleware
  bot.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    logger.debug(`Response time: ${ms}ms`);
    logger.info(JSON.stringify(ctx.update, null, 2));
  });

  bot.on(message('text'), async (ctx) => {
    logger.info(`Message received: ${ctx.message.text}`);

    // Check is message is command
    if (ctx.message.text.startsWith('/')) {
      logger.info(`Command received`);
      const command = ctx.message.text.split(' ')[0].replace('/', '');
      logger.info(`Command is: ${command}`);

      console.log(ADMINS, ctx.message.from?.id.toString());

      if (ADMINS.includes(ctx.message.from?.id.toString())) {
        switch (command) {
          case 'add':
            logger.info(`Command /add received`);
            const match = ctx.message.text.match(/\/add (delete|ban) (.*)/);
            const action = match?.[1];
            const value = match?.[2];
            if (action && value) {
              await db.run(
                'INSERT INTO strings (value, action) VALUES (?, ?)',
                [value, action]
              );
              STRINGS.push({ value, action });
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
            break;
          case 'spam':
            logger.info(`Command /spam received`);
            // @ts-ignore
            if (ctx.message?.reply_to_message) {
              const originalMessage = ctx.message
                // @ts-ignore
                .reply_to_message as Message.TextMessage;
              // add message to database
              await db.run(
                'INSERT INTO strings (value, action) VALUES (?, ?)',
                [originalMessage.text, ActionTypes.BAN]
              );

              // delete original message
              ctx
                .deleteMessage(originalMessage.message_id)
                .then(() => {
                  logger.info(`Message deleted:`);
                })
                .catch((err) => {
                  logger.error(`Error deleting message:`, err);
                });

              // Reply to user
              ctx
                .reply(`Spam deleted and added to sample database`)
                .then((value) => {
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
            break;
        }
        return;
      } else {
        logger.info(`User ${ctx.message.from?.id} is not an admin`);
      }
    }

    if (CHATS.includes(ctx.message.chat.id.toString())) {
      // Check if message contains string from database
      const match = STRINGS.find((s) => ctx.message.text.includes(s.value));
      if (match) {
        logger.info([
          `Matching string found in message:`,
          match,
          ctx.message.text,
        ]);
        if (ctx.message.from?.id && match.action === ActionTypes.BAN) {
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
        } else {
          // Delete message only
          ctx
            .deleteMessage(ctx.message.message_id)
            .then(() => {
              logger.info(`Message deleted:`);
            })
            .catch((err) => {
              logger.error(`Error deleting message:`, err);
            });
        }
      }
    }
  });

  bot.launch().then();

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
})();
