require("dotenv").config();

module.exports = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },
  products: {
    targetIds: (process.env.TARGET_PRODUCTS || "131844013,133673523")
      .split(",")
      .map((id) => id.trim()),
  },
  monitor: {
    requestInterval: parseInt(process.env.REQUEST_INTERVAL || "300000", 10), // 5분 기본값
    stateFilePath: process.env.STATE_FILE_PATH || "./state.json",
  },
  api: {
    baseUrl: "https://shop-api.e-ncp.com",
    clientId: process.env.API_CLIENT_ID,
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "ko-KR,ko;q=0.7",
      "content-type": "application/json; charset=utf-8",
      origin: "https://store.sony.co.kr",
      platform: "PC",
      referer: "https://store.sony.co.kr/",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
      version: "1.0",
    },
    timeout: 15000,
  },
};
