import { Telegraf, Markup } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN);

const groupID = process.env.GROUP_ID;
const keyboard = Markup.inlineKeyboard([[Markup.button.callback('🔫 Kick', 'yes'), Markup.button.callback('🆘 Save', 'no')]]);
let tmp = {activeVoting: false};

bot.command('help', (ctx) => ctx.replyWithHTML('<b>/help</b> - information\n\n<b>/kick</b> - when replying to someone\'s message, causes a vote for the kick of the author of the message\nVoting lasts 10 minutes\nFor a kick you need more "Kicks" than "Saves"'));

bot.on('message', async (ctx) => {
  if (ctx.chat.id == groupID && 'text' in ctx.message && 'reply_to_message' in ctx.message) {
    let input = ctx.message.text.split(' ');
    if (input[0] != '/kick') return;
    if (tmp.activeVoting) return ctx.reply('Voting is already in progress.');
    Object.assign(tmp, {activeVoting: true, voterId: ctx.from.id, voterName: ctx.from.first_name, kickId: ctx.message.reply_to_message.from.id, kickName: ctx.message.reply_to_message.from.first_name, yes: 1, no: 1, voters: [ctx.from.id, ctx.message.reply_to_message.from.id]});
    await ctx.replyWithHTML(`<a href="tg://user?id=${tmp.voterId}"><b>${tmp.voterName}</b></a> started voting for kick <a href="tg://user?id=${tmp.kickId}"><b>${tmp.kickName}</b></a>. Reason: <b>${tmp.reason}</b>.\n\n🔫 Kick: <b>${tmp.yes}</b>\n🆘 Save: <b>${tmp.no}</b>`, keyboard).then((res) => tmp.msgId = res.message_id).catch(e => console.log(e));
    setTimeout(() => {
      await ctx.telegram.editMessageText(groupID, tmp.msgId, null, `<a href="tg://user?id=${tmp.voterId}"><b>${tmp.voterName}</b></a> started voting for kick <a href="tg://user?id=${tmp.kickId}"><b>${tmp.kickName}</b></a>. Reason: <b>${tmp.reason}</b>.\n\n<b>Voting is over.</b>`, {parse_mode: 'HTML'}).catch(e => console.log(e));
      if (tmp.no >= tmp.yes) await ctx.replyWithHTML(`<a href="tg://user?id=${tmp.kickId}">${tmp.kickName}</a> <b>saved</b>.\n\n🔫 Kick: <b>${tmp.yes}</b>\n🆘 Save: <b>${tmp.no}</b>`, {reply_to_message_id: tmp.msgId});
      else {
        await ctx.replyWithHTML(`<a href="tg://user?id=${tmp.kickId}">${tmp.kickName}</a> <b>was kicked</b>.\n\n🔫 Kick: <b>${tmp.yes}</b>\n🆘 Save: <b>${tmp.no}</b>`, {reply_to_message_id: tmp.msgId});
        await ctx.banChatMember(tmp.kickId).catch(e => console.log(e));
      }
      tmp = {activeVoting: false};
    }, 600000);
  }
});

bot.action('yes', async (ctx) => {
  await ctx.answerCbQuery();
  if (tmp.activeVoting && !tmp.voters.includes(ctx.from.id)) {
    tmp.voters.push(ctx.from.id);
    tmp.yes += 1;
    await ctx.editMessageText(`<a href="tg://user?id=${tmp.voterId}"><b>${tmp.voterName}</b></a> started voting for kick <a href="tg://user?id=${tmp.kickId}"><b>${tmp.kickName}</b></a>. Reason: <b>${tmp.reason}</b>.\n\n🔫 Kick: <b>${tmp.yes}</b>\n🆘 Save: <b>${tmp.no}</b>`, {...keyboard, parse_mode: 'HTML'}).catch(e => console.log(e));
  }
});
bot.action('no', async (ctx) => {
  await ctx.answerCbQuery();
  if (tmp.activeVoting && !tmp.voters.includes(ctx.from.id)) {
    tmp.voters.push(ctx.from.id);
    tmp.no += 1;
    await ctx.editMessageText(`<a href="tg://user?id=${tmp.voterId}"><b>${tmp.voterName}</b></a> started voting for kick <a href="tg://user?id=${tmp.kickId}"><b>${tmp.kickName}</b></a>. Reason: <b>${tmp.reason}</b>.\n\n🔫 Kick: <b>${tmp.yes}</b>\n🆘 Save: <b>${tmp.no}</b>`, {...keyboard, parse_mode: 'HTML'}).catch(e => console.log(e));
  }
});

bot.launch();