# Twyllbot

Twyllbot is a work-in-progress Telegram anti-spam bot written in TypeScript.

It uses the [Telegraf](https://github.com/telegraf/telegraf) library to interact with the Telegram Bot API and a SQLite database to store strings.

## Configuration

The bot requires the following environment variables to be set:

- `BOT_TOKEN` - The Telegram Bot API token
- `CHAT_IDS` - A comma-separated list of chat IDs that the bot should operate in
- `ADMIN_IDS` - A comma-separated list of user IDs that are bot administrators

## Usage

To install and run the bot:

```bash
yarn install --frozen-lockfile
yarn run start
```

Ideally you should run the bot with `systemd` or a process manager like [pm2](https://github.com/Unitech/pm2) to keep it running.

## Commands

The following commands can be used by administrators:
- `/tadd (delete|ban) <string>` - Add a string to the database with the specified action

The following commands can be used by administrators when replying to a message:
- `/tspam (delete|ban) <string>` - Add a string to the database, delete the message, and ban the user. Not providing options will add the whole message text and default to a ban action.

## Etymology

The name "Twyllbot" comes from the Welsh word "twyll" which means "deceit" or "fraud".
