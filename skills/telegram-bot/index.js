const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Initialize bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Command: /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 
    '👋 Welcome!\n\nI am your OpenClaw assistant bot.',
    {
      reply_markup: {
        keyboard: [
          ['📊 Status', '⚙️ Settings'],
          ['❓ Help', '📞 Support']
        ],
        resize_keyboard: true
      }
    }
  );
});

// Command: /help
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, `
🤖 *Available Commands:*

/start - Start the bot
/help - Show this help message
/status - Check system status
/echo <text> - Echo your message
/settings - Bot settings

Use the keyboard buttons for quick access!
  `, { parse_mode: 'Markdown' });
});

// Command: /status
bot.onText(/\/status/, async (msg) => {
  const statusMsg = `
✅ *Bot Status: Online*

🕐 Uptime: ${process.uptime().toFixed(0)} seconds
📊 Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
🔧 Node: ${process.version}
  `;
  bot.sendMessage(msg.chat.id, statusMsg, { parse_mode: 'Markdown' });
});

// Command: /echo
bot.onText(/\/echo (.+)/, (msg, match) => {
  const text = match[1];
  bot.sendMessage(msg.chat.id, `📢 ${text}`);
});

// Handle keyboard buttons
bot.on('message', (msg) => {
  const text = msg.text;
  const chatId = msg.chat.id;
  
  switch(text) {
    case '📊 Status':
      bot.sendMessage(chatId, '✅ All systems operational!');
      break;
    case '⚙️ Settings':
      bot.sendMessage(chatId, '⚙️ Settings panel (coming soon)');
      break;
    case '❓ Help':
      bot.sendMessage(chatId, 'Use /help for command list');
      break;
    case '📞 Support':
      bot.sendMessage(chatId, '📧 Contact: support@example.com');
      break;
  }
});

// Handle callback queries
bot.on('callback_query', (query) => {
  bot.answerCallbackQuery(query.id, { text: 'Action received!' });
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('🤖 Telegram bot is running...');

module.exports = bot;
