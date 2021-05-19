const TOKEN = 'Your Telegram bot token here';

const {Telegraf, Extra, Markup} = require('telegraf');
const bot = new Telegraf(TOKEN);

bot.startPolling();
bot.start();

let activeVoting = false;
let data = {
  messageId: 0,
  voterId: 0,
  voterName: '',
  kickId: 0,
  kickName: '',
  reason: '',
  yes: 0,
  no: 0,
  voters: []
}

bot.command('help', (ctx) => {
  ctx.telegram.sendMessage(ctx.chat.id, 'Available functionality:\n\n\n<b>/help</b> - help\n\n<b>/votekick [reason]</b> - when replying to someone\'s message, causes a vote for the kick of the author of the message\nVoting lasts 15 minutes\nFor a kick you need more "Kicks" than "Saves"', {parse_mode: 'HTML'});
});

bot.on('message', (ctx) => {
  if (ctx.message.hasOwnProperty('text') && ctx.message.hasOwnProperty('reply_to_message')) {
    let input = ctx.message.text.split(' ');
    if (input[0] != '/votekick') return;
    if (activeVoting) return ctx.telegram.sendMessage(ctx.chat.id, 'Voting is already in progress.');
    input.shift();
    if (input.length == 0) return;
    activeVoting = true;
    data.reason = input.join(' ');
    data.voterId = ctx.from.id;
    data.voterName = ctx.from.first_name;
    data.kickId = ctx.message.reply_to_message.from.id;
    data.kickName = ctx.message.reply_to_message.from.first_name;
    const extra = Extra.markup(Markup.inlineKeyboard([[Markup.callbackButton(`🔫 Kick (${data.yes})`, 'voteYes'), Markup.callbackButton(`🆘 Save (${data.no})`, 'voteNo')]]));
    extra.parse_mode = 'HTML';
    bot.telegram.sendMessage(ctx.chat.id, `<a href="tg://user?id=${data.voterId}">${data.voterName}</a> started voting for kick <a href="tg://user?id=${data.kickId}">${data.kickName}</a>. Reason: ${data.reason}`, extra).then((res) => {
      data.messageId = res.message_id;
    });
    setTimeout(() => {
      if (data.no >= data.yes) {
        ctx.telegram.editMessageReplyMarkup(ctx.chat.id, data.messageId, Markup.inlineKeyboard([]));
        ctx.telegram.editMessageText(ctx.chat.id, data.messageId, undefined, `<a href="tg://user?id=${data.voterId}">${data.voterName}</a> started voting for kick <a href="tg://user?id=${data.kickId}">${data.kickName}</a>. Reason: ${data.reason}\n\n<b>Voting is over.</b>`, {parse_mode: 'HTML'});
        ctx.telegram.sendMessage(ctx.chat.id, `<a href="tg://user?id=${data.kickId}">${data.kickName}</a> wasn't kicked. Reason: ${data.reason}\n\n🔫 Kicks: ${data.yes}\n🆘 Saves: ${data.no}`, {parse_mode: 'HTML'});
      } else try {
        ctx.telegram.editMessageReplyMarkup(ctx.chat.id, data.messageId, Markup.inlineKeyboard([]));
        ctx.telegram.editMessageText(ctx.chat.id, data.messageId, undefined, `<a href="tg://user?id=${data.voterId}">${data.voterName}</a> started voting for kick <a href="tg://user?id=${data.kickId}">${data.kickName}</a>. Reason: ${data.reason}\n\n<b>Voting is over.</b>`, {parse_mode: 'HTML'});
        ctx.telegram.sendMessage(ctx.chat.id, `<a href="tg://user?id=${data.kickId}">${data.kickName}</a> was kicked. Reason: ${data.reason}\n\n🔫 Kicks: ${data.yes}\n🆘 Saves: ${data.no}`, {parse_mode: 'HTML'});
        ctx.telegram.kickChatMember(ctx.chat.id, data.kickId);
      } catch (error) {}
      activeVoting = false;
      data.yes = 0;
      data.no = 0;
      data.voters = [];
    }, 900000);
  }
});

bot.action('voteYes', (ctx) => {
  ctx.answerCbQuery();
  if (activeVoting && !data.voters.includes(ctx.from.id)) {
    data.voters.push(ctx.from.id);
    data.yes += 1;
    ctx.editMessageReplyMarkup(Markup.inlineKeyboard([[Markup.callbackButton(`🔫 Kick (${data.yes})`, 'voteYes'), Markup.callbackButton(`🆘 Save (${data.no})`, 'voteNo')]]));
  }
});
bot.action('voteNo', (ctx) => {
  ctx.answerCbQuery();
  if (activeVoting && !data.voters.includes(ctx.from.id)) {
    data.voters.push(ctx.from.id);
    data.no += 1;
    ctx.editMessageReplyMarkup(Markup.inlineKeyboard([[Markup.callbackButton(`🔫 Kick (${data.yes})`, 'voteYes'), Markup.callbackButton(`🆘 Save (${data.no})`, 'voteNo')]]));
  }
});

bot.launch();