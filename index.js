const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const config = require('./config');
const UserModel = require('./user');
const TransactionModel = require('./transaction');

// SETUP

const bot = new TelegramBot(config.TOKEN, config.options);
bot.setWebHook(`${config.url}/bot${config.TOKEN}`);

mongoose.connect(config.mongodb_uri);
const db = mongoose.connection;

// ACTIONS AND UTILS

function returnIfErr(err) {
  return err;
}

function notToday(msg, user) {
  bot.sendMessage(msg.chat.id, `@${user} no esta en TradeToday.`);
}

function newParticipant(msg) {
  msg.new_chat_members.forEach((member) => {
    const newUser = new UserModel({ telegram: member.username });
    newUser.save(returnIfErr);
  });
}


function refs(msg) {
  if (msg.entities[1]) {
    const { offset, length } = msg.entities[1];
    const query = msg.text.substr(offset + 1, length).trim();
    UserModel.findOne({ telegram: query }, (err, user) => {
      if (err) return err;
      if (user) {
        bot.sendMessage(msg.chat.id, `@${query} tiene ${user.refs.length} referencias y ${user.trades.length} intercambios.`);
      } else {
        notToday(msg, query);
      }
    });
  }
}


function addRefs(msg) {
  const chatId = +config.chat_id;
  if (msg.chat.id === chatId && msg.entities[1]) {
    const { offset, length } = msg.entities[1];
    const to = msg.text.substr(offset + 1, length).trim();
    const price = msg.text.substr(offset + length, msg.length).trim();
    const from = msg.from.username;
    if (to !== from) {
      UserModel.find().or([{ telegram: to }, { telegram: from }]).exec((err, users) => {
        if (err) return err;
        const [referred, referral] = users;
        if (referred && referral) {
          referred.refs.push(from);
          referral.refs.push(to);
          referred.refs = Array.from(new Set(referred.refs));
          referral.refs = Array.from(new Set(referral.refs));
          referred.trades.push({ from, to, price });
          referral.trades.push({ from, to, price });
          referral.save(returnIfErr);
          referred.save(returnIfErr);
          const newTransaction = new TransactionModel({ from, to, price });
          newTransaction.save(returnIfErr);
          bot.sendMessage(msg.chat.id, `Ha ocurrido un intercambio entre @${from} y @${to}.`);
        } else {
          notToday(msg, to);
        }
      });
    }
  }
}

function topTrades(msg) {
  TransactionModel.find().limit(10).exec((err, trans) => {
    if (trans.length) {
      const answer = trans.map((tran, index) =>
        tran.price ? `${index + 1}. Entre ${tran.from} y ${tran.to} por ${tran.price}` : `${index + 1}. Entre ${tran.from} y ${tran.to}`
      ).join('\n');
      bot.sendMessage(msg.chat.id, answer);
    }
  });
}

function halp(msg) {
  const message = `
  Uso del bot:
  /refs @usuario Para pedir referencias de un usuario. (Se puede hacer por privado al bot)
  /addref @usuario PRECIO Dar referencia a otro usuario (precio es opcional) IMPORTANTE: Sólo se pueden hacer desde el grupo.
  /toptrades Las últimas 10 transacciones.
  /help Ayuda.

  IMPORTANTE: Sólo se registran miembros con username de Telegram.
  
  BOT fase beta. Reportar bug a Telegram: scarmarco
  `;
  bot.sendMessage(msg.chat.id, message);
}

// DATABASE

db.once('open', () => {
  bot.on('new_chat_participant', newParticipant);
  bot.onText(/\/refs @(.+)/, refs);
  bot.onText(/\/addref @(.+)/, addRefs);
  bot.onText(/\/toptrades/, topTrades);
  bot.onText(/\/help/, halp);
});
