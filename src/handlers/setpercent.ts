import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";

registerMainMenuItem({ label: "📊 % Alert", data: "setpercent:show", order: 50 });

const composer = new Composer<Ctx>();

const USAGE = "To set a percentage alert, type:\n/setpercent BTC 5\n/setpercent ETH -10";

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

composer.command("setpercent", async (ctx) => {
  const text = ctx.message?.text?.trim() ?? "";
  const args = text.split(/\s+/).slice(1);
  const ticker = args[0]?.toUpperCase();
  const pctStr = args[1];

  if (!ticker || !pctStr) {
    await ctx.reply(USAGE, { reply_markup: backToMenu });
    return;
  }

  const pct = parseFloat(pctStr);
  if (isNaN(pct) || pct === 0) {
    await ctx.reply("Please enter a valid percentage (positive or negative).", { reply_markup: backToMenu });
    return;
  }

  const item = ctx.session.watchlist.find((w) => w.ticker === ticker);
  if (!item) {
    await ctx.reply(`${ticker} isn't on your watchlist. Add it first with /add ${ticker}.`, { reply_markup: backToMenu });
    return;
  }

  item.percentThreshold = pct;
  const direction = pct > 0 ? "rises" : "drops";
  await ctx.reply(`Percentage alert set: ${ticker} ${direction} by ${Math.abs(pct)}% in 1 hour.`, { reply_markup: backToMenu });
});

composer.callbackQuery("setpercent:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(USAGE, { reply_markup: backToMenu });
});

export default composer;
