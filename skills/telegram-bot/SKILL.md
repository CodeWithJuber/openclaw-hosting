---
name: telegram-bot
version: 1.0.0
description: Create and manage Telegram bots with ease. Send messages, handle commands, manage groups, and build interactive bots.
homepage: https://github.com/openclaw/skills/telegram-bot
---

# Telegram Bot Skill

Build powerful Telegram bots with Node.js. Send messages, handle commands, manage groups, and create interactive experiences.

## Installation

```bash
npm install node-telegram-bot-api
```

## Quick Start

```javascript
const TelegramBot = require('node-telegram-bot-api');

// Create bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Handle /start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Welcome! 👋');
});

// Echo messages
bot.on('message', (msg) => {
  bot.sendMessage(msg.chat.id, `You said: ${msg.text}`);
});
```

## Setup

### 1. Create a Bot with BotFather

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot`
3. Follow prompts to name your bot
4. Save the API token

### 2. Environment Variables

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

## Core Features

### Send Messages

```javascript
// Text message
bot.sendMessage(chatId, 'Hello!');

// Markdown formatting
bot.sendMessage(chatId, '*Bold* _italic_ `code`', {
  parse_mode: 'Markdown'
});

// HTML formatting
bot.sendMessage(chatId, '<b>Bold</b> <i>italic</i> <code>code</code>', {
  parse_mode: 'HTML'
});

// With buttons
bot.sendMessage(chatId, 'Choose an option:', {
  reply_markup: {
    inline_keyboard: [
      [{ text: 'Option 1', callback_data: 'opt1' }],
      [{ text: 'Option 2', callback_data: 'opt2' }]
    ]
  }
});
```

### Handle Commands

```javascript
// /help command
bot.onText(/\/help/, (msg) => {
  const helpText = `
Available commands:
/start - Start the bot
/help - Show this help
/status - Check status
  `;
  bot.sendMessage(msg.chat.id, helpText);
});

// Command with parameters
bot.onText(/\/echo (.+)/, (msg, match) => {
  const text = match[1];
  bot.sendMessage(msg.chat.id, text);
});
```

### Handle Callbacks

```javascript
bot.on('callback_query', (query) => {
  const data = query.data;
  const chatId = query.message.chat.id;
  
  if (data === 'opt1') {
    bot.sendMessage(chatId, 'You selected Option 1');
  } else if (data === 'opt2') {
    bot.sendMessage(chatId, 'You selected Option 2');
  }
  
  // Answer callback to remove loading state
  bot.answerCallbackQuery(query.id);
});
```

### Send Media

```javascript
// Photo
bot.sendPhoto(chatId, 'path/to/photo.jpg');
bot.sendPhoto(chatId, 'https://example.com/photo.jpg');

// Document
bot.sendDocument(chatId, 'path/to/file.pdf');

// Audio/Voice
bot.sendVoice(chatId, 'path/to/voice.ogg');

// Video
bot.sendVideo(chatId, 'path/to/video.mp4');
```

### Group Management

```javascript
// Welcome new members
bot.on('new_chat_members', (msg) => {
  const newMembers = msg.new_chat_members;
  newMembers.forEach(member => {
    bot.sendMessage(
      msg.chat.id,
      `Welcome ${member.first_name}! 👋`
    );
  });
});

// Ban user
bot.banChatMember(chatId, userId);

// Unban user
bot.unbanChatMember(chatId, userId);

// Get chat info
bot.getChat(chatId).then(chat => {
  console.log(chat.title);
});
```

## Advanced Features

### Webhook Mode (Production)

```javascript
// Use webhooks instead of polling
const bot = new TelegramBot(token);
bot.setWebHook('https://yourdomain.com/webhook');

// Express webhook handler
app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});
```

### Message Scheduling

```javascript
// Send message after delay
setTimeout(() => {
  bot.sendMessage(chatId, 'Scheduled message!');
}, 60000); // 1 minute

// Send message at specific time
const schedule = require('node-schedule');
schedule.scheduleJob('0 9 * * *', () => {
  bot.sendMessage(chatId, 'Good morning! ☀️');
});
```

### Inline Keyboards

```javascript
const keyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '📊 Stats', callback_data: 'stats' },
        { text: '⚙️ Settings', callback_data: 'settings' }
      ],
      [
        { text: '🔗 Open Website', url: 'https://example.com' }
      ]
    ]
  }
};

bot.sendMessage(chatId, 'Main Menu:', keyboard);
```

### Reply Keyboards

```javascript
const keyboard = {
  reply_markup: {
    keyboard: [
      ['📊 Status', '⚙️ Settings'],
      ['❓ Help', '📞 Contact']
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  }
};

bot.sendMessage(chatId, 'Choose an option:', keyboard);
```

## Error Handling

```javascript
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

bot.on('webhook_error', (error) => {
  console.error('Webhook error:', error);
});

// Wrap sends in try-catch
try {
  await bot.sendMessage(chatId, 'Hello');
} catch (error) {
  console.error('Failed to send message:', error);
}
```

## Best Practices

1. **Use environment variables** for tokens
2. **Handle errors gracefully** - don't crash on API errors
3. **Rate limit** your messages (max 30 msgs/sec)
4. **Use webhooks** in production for better performance
5. **Store user data** securely if needed
6. **Respond quickly** to callbacks (within 15 seconds)

## Example: Complete Bot

```javascript
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Command: /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 
    'Welcome! 👋\n\nI am your assistant bot.',
    {
      reply_markup: {
        keyboard: [['📊 Status', '❓ Help']],
        resize_keyboard: true
      }
    }
  );
});

// Command: /help
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, `
🤖 Bot Commands:

/start - Start the bot
/help - Show this help
/status - Check system status
/echo <text> - Echo your message
  `);
});

// Handle text messages
bot.on('message', (msg) => {
  const text = msg.text;
  
  if (text === '📊 Status') {
    bot.sendMessage(msg.chat.id, '✅ Bot is running!');
  } else if (text === '❓ Help') {
    bot.sendMessage(msg.chat.id, 'Use /help for commands');
  }
});

console.log('Bot is running...');
```

## Resources

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [node-telegram-bot-api docs](https://github.com/yagop/node-telegram-bot-api)
- [BotFather](https://t.me/BotFather)
