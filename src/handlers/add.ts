import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { validateTicker, getPrice, formatPrice } from "../services/coingecko.js";

registerMainMenuItem({ label: "➕ Add coin", data: "add:show", order: 10 });

const composer = new Composer<Ctx>();

const USAGE = "To add a coin, type:\n/add BTC\n/add ETH\n/add SOL";

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

composer.command("add", async (ctx) => {
  const text = ctx.message?.text?.trim() ?? "";
  const args = text.split(/\s+/).slice(1);
  const ticker = args[0]?.toUpperCase();

  if (!ticker) {
    await ctx.reply(USAGE, { reply_markup: backToMenu });
    return;
  }

  if (ctx.session.watchlist.some((w) => w.ticker === ticker)) {
    await ctx.reply(`${ticker} is already on your watchlist.`, { reply_markup: backToMenu });
    return;
  }

  const result = await validateTicker(ticker);
  if (!result.valid) {
    const hints = result.suggestions.length > 0
      ? `\nDid you mean: ${result.suggestions.join(", ")}?`
      : "\nCheck the ticker symbol and try again.";
    await ctx.reply(`Couldn't find a coin with ticker "${ticker}".${hints}`, { reply_markup: backToMenu });
    return;
  }

  try {
    const price = await getPrice(result.coinId);
    ctx.session.watchlist.push({ ticker, coinId: result.coinId });
    ctx.session.lastKnownPrices[ticker] = price;
    await ctx.reply(`${ticker} added to your watchlist at ${formatPrice(price)}.`, { reply_markup: backToMenu });
  } catch {
    await ctx.reply(`Added ${ticker} to your watchlist, but couldn't fetch the current price right now.`, { reply_markup: backToMenu });
  }
});

composer.callbackQuery("add:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(USAGE, { reply_markup: backToMenu });
});

export default composer;
