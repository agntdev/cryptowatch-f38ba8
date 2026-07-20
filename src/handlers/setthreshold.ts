import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";

registerMainMenuItem({ label: "🎯 Set alert", data: "setthreshold:show", order: 40 });

const composer = new Composer<Ctx>();

const USAGE = "To set a price alert, type:\n/setthreshold BTC 100000\n/setthreshold ETH 5000";

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

composer.command("setthreshold", async (ctx) => {
  const text = ctx.message?.text?.trim() ?? "";
  const args = text.split(/\s+/).slice(1);
  const ticker = args[0]?.toUpperCase();
  const priceStr = args[1];

  if (!ticker || !priceStr) {
    await ctx.reply(USAGE, { reply_markup: backToMenu });
    return;
  }

  const price = parseFloat(priceStr);
  if (isNaN(price) || price <= 0) {
    await ctx.reply("Please enter a valid price number.", { reply_markup: backToMenu });
    return;
  }

  const item = ctx.session.watchlist.find((w) => w.ticker === ticker);
  if (!item) {
    await ctx.reply(`${ticker} isn't on your watchlist. Add it first with /add ${ticker}.`, { reply_markup: backToMenu });
    return;
  }

  item.priceThreshold = price;
  await ctx.reply(`Price alert set: ${ticker} at $${price.toLocaleString("en-US")}.`, { reply_markup: backToMenu });
});

composer.callbackQuery("setthreshold:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(USAGE, { reply_markup: backToMenu });
});

export default composer;
