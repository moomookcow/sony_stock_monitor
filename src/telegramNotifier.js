const TelegramBot =
  require("node-telegram-bot-api").default || require("node-telegram-bot-api");
const config = require("./config");

const bot = new TelegramBot(config.telegram.botToken, { polling: false });

/**
 * Telegram 메시지 전송
 * @param {string} message
 * @returns {Promise<void>}
 */
async function sendMessage(message) {
  if (!config.telegram.botToken || !config.telegram.chatId) {
    throw new Error(
      "Telegram 설정이 완료되지 않았습니다. BOT_TOKEN 또는 CHAT_ID를 .env에 입력하세요.",
    );
  }

  await bot.sendMessage(config.telegram.chatId, message);
}

module.exports = {
  sendMessage,
};
