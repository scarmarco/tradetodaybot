const port = process.env.PORT;
const host = process.env.HOST;

const config = {
  url: process.env.APP_URL,
  TOKEN: process.env.TELEGRAM_TOKEN,
  mongodb_uri: process.env.MONGODB_URI,
  chat_id: process.env.CHAT_ID,
  options: {
    webHook: {
      port,
      host,
    },
  },
};

module.exports = config;
