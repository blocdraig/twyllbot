import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import logger from './lib/logger';
import { closeDatabase, connectToDatabase, seedDatabase } from './lib/db';
import commands from './commands';
import engine from './engine';
import { ADMINS, CHATS, TOKEN } from './consts';
import { loadStrings } from './entities/strings';
import { loadChatAdmins } from './entities/chatAdmins';

const startBot = async () => {
  const db = await connectToDatabase();
  await db.migrate();
  await seedDatabase();

  await loadStrings();

  logger.info(`Starting bot...`);

  const bot = new Telegraf(TOKEN);

  await loadChatAdmins(bot, CHATS);

  bot.telegram.getMe().then((botInfo) => {
    logger.info(`Bot started: ${botInfo.username} (${botInfo.id})`);
  });

  // Register logger middleware
  bot.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    logger.debug(`Response time: ${ms}ms`);
    // logger.info(JSON.stringify(ctx.update, null, 2));
  });

  bot.on(message('text'), async (ctx) => {
    // Check is message is command
    if (ctx.message.text.startsWith('/')) {
      logger.info(`Command received`);
      const command = ctx.message.text.split(' ')[0].replace('/', '');
      logger.info(`Command is: ${command}`);

      if (ADMINS.has(ctx.message.from?.id)) {
        switch (command) {
          case 'tadd':
            await commands.add(ctx);
            break;
          case 'tspam':
            await commands.spam(ctx);
            break;
        }
        return;
      } else {
        logger.info(`User ${ctx.message.from?.id} is not an admin`);
      }
    }

    if (CHATS.has(ctx.message.chat.id)) {
      await engine.check(ctx);
    }
  });

  bot.launch().then();

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
};

startBot().then();

process.once('SIGINT', async () => {
  console.log('Shutting down...');
  await closeDatabase();
  process.exit(0);
});
