import { Telegraf, Markup } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN);

const groupID = process.env.GROUP_ID;
const keyboard = Markup.inlineKeyboard([[Markup.button.callback('🔫 Kick', 'yes'), Markup.button.callback('🆘 Save', 'no')]]);
const vanillaKeyboard = {inline_keyboard: [[{text: '🔫 Kick', callback_data: 'yes'}, {text: '🆘 Save', callback_data: 'no'}]]};
let tmp = {activeVoting: false}

bot.command('help', (ctx) => {
  if (ctx.chat.id == groupID) ctx.replyWithHTML('<b>/help</b> - information\n\n<b>/kick [reason]</b> - when replying to someone\'s message, causes a vote for the kick of the author of the message\nVoting lasts 15 minutes\nFor a kick you need more "Kicks" than "Saves"');
});

bot.on('message', (ctx) => {
  if (ctx.chat.id == groupID && ctx.message.hasOwnProperty('text') && ctx.message.hasOwnProperty('reply_to_message')) {
    let input = ctx.message.text.split(' ');
    if (input[0] != '/kick') return;
    if (tmp.activeVoting) return ctx.reply('Voting is already in progress.');
    input.shift();
    if (input.length == 0) return;
    tmp.activeVoting = true;
    tmp.reason = input.join(' ');
    tmp.voterId = ctx.from.id;
    tmp.voterName = ctx.from.first_name;
    tmp.kickId = ctx.message.reply_to_message.from.id;
    tmp.kickName = ctx.message.reply_to_message.from.first_name;
    tmp.yes = 1;
    tmp.no = 1;
    tmp.voters = [tmp.voterId, tmp.kickId];
    ctx.replyWithHTML(`<a href="tg://user?id=${tmp.voterId}"><b>${tmp.voterName}</b></a> started voting for kick <a href="tg://user?id=${tmp.kickId}"><b>${tmp.kickName}</b></a>. Reason: <b>${tmp.reason}</b>.\n\n🔫 Kick: <b>${tmp.yes}</b>\n🆘 Save: <b>${tmp.no}</b>`, keyboard).then((res) => tmp.msgId = res.message_id).catch(e => console.log(e));
    setTimeout(() => {
      ctx.telegram.editMessageText(groupID, tmp.msgId, null, `<a href="tg://user?id=${tmp.voterId}"><b>${tmp.voterName}</b></a> started voting for kick <a href="tg://user?id=${tmp.kickId}"><b>${tmp.kickName}</b></a>. Reason: <b>${tmp.reason}</b>.\n\n<b>Voting is over.</b>`, {parse_mode: 'HTML'}).catch(e => console.log(e));
      if (tmp.no >= tmp.yes || tmp.yes < 3) ctx.replyWithHTML(`<a href="tg://user?id=${tmp.kickId}">${tmp.kickName}</a> <b>saved</b>.\n\n🔫 Kick: <b>${tmp.yes}</b>\n🆘 Save: <b>${tmp.no}</b>`, {reply_to_message_id: tmp.msgId}).catch(e => console.log(e));
      else {
        ctx.replyWithHTML(`<a href="tg://user?id=${tmp.kickId}">${tmp.kickName}</a> <b>was kicked</b>.\n\n🔫 Kick: <b>${tmp.yes}</b>\n🆘 Save: <b>${tmp.no}</b>`, {reply_to_message_id: tmp.msgId}).catch(e => console.log(e));
        ctx.banChatMember(tmp.kickId).catch(e => console.log(e));
      }
      tmp.activeVoting = false;
    }, 60000);
  }
});

bot.action('yes', (ctx) => {
  ctx.answerCbQuery();
  if (tmp.activeVoting && !tmp.voters.includes(ctx.from.id)) {
    tmp.voters.push(ctx.from.id);
    tmp.yes += 1;
    ctx.editMessageText(`<a href="tg://user?id=${tmp.voterId}"><b>${tmp.voterName}</b></a> started voting for kick <a href="tg://user?id=${tmp.kickId}"><b>${tmp.kickName}</b></a>. Reason: <b>${tmp.reason}</b>.\n\n🔫 Kick: <b>${tmp.yes}</b>\n🆘 Save: <b>${tmp.no}</b>`, {reply_markup: vanillaKeyboard, parse_mode: 'HTML'}).catch(e => console.log(e));
  }
});
bot.action('no', (ctx) => {
  ctx.answerCbQuery();
  if (tmp.activeVoting && !tmp.voters.includes(ctx.from.id)) {
    tmp.voters.push(ctx.from.id);
    tmp.no += 1;
    ctx.editMessageText(`<a href="tg://user?id=${tmp.voterId}"><b>${tmp.voterName}</b></a> started voting for kick <a href="tg://user?id=${tmp.kickId}"><b>${tmp.kickName}</b></a>. Reason: <b>${tmp.reason}</b>.\n\n🔫 Kick: <b>${tmp.yes}</b>\n🆘 Save: <b>${tmp.no}</b>`, {reply_markup: vanillaKeyboard, parse_mode: 'HTML'}).catch(e => console.log(e));
  }
});

bot.launch();