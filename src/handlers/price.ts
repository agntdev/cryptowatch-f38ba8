import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getPrice, getPrices, formatPrice, validateTicker } from "../services/coingecko.js";

registerMainMenuItem({ label: "💰 Prices", data: "price:show", order: 30 });

const composer = new Composer<Ctx>();

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

composer.command("price", async (ctx) => {
  const text = ctx.message?.text?.trim() ?? "";
  const args = text.split(/\s+/).slice(1);
  const ticker = args[0]?.toUpperCase();

  if (ticker) {
    const item = ctx.session.watchlist.find((w) => w.ticker === ticker);
    if (!item) {
      await ctx.reply(`${ticker} isn't on your watchlist. Add it first with /add ${ticker}.`, { reply_markup: backToMenu });
      return;
    }

    try {
      const price = await getPrice(item.coinId);
      ctx.session.lastKnownPrices[ticker] = price;
      await ctx.reply(`${ticker}: ${formatPrice(price)}`, { reply_markup: backToMenu });
    } catch {
      await ctx.reply(`Couldn't fetch the price for ${ticker} right now. Try again in a moment.`, { reply_markup: backToMenu });
    }
    return;
  }

  if (ctx.session.watchlist.length === 0) {
    await ctx.reply("Your watchlist is empty — tap ➕ Add coin to add one.", { reply_markup: backToMenu });
    return;
  }

  const tickers = ctx.session.watchlist.map((w) => w.ticker);
  const coinIds = ctx.session.watchlist.map((w) => w.coinId);
  try {
    const prices = await getPrices(coinIds);
    const lines = tickers.map((t) => {
      const coinId = ctx.session.watchlist.find((w) => w.ticker === t)?.coinId;
      const price = coinId ? prices[coinId] : undefined;
      if (price !== undefined) {
        ctx.session.lastKnownPrices[t] = price;
        return `${t}: ${formatPrice(price)}`;
      }
      return `${t}: price unavailable`;
    });
    await ctx.reply(lines.join("\n"), { reply_markup: backToMenu });
  } catch {
    await ctx.reply("Couldn't fetch prices right now. Try again in a moment.", { reply_markup: backToMenu });
  }
});

composer.callbackQuery("price:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ctx.session.watchlist.length === 0) {
    await ctx.editMessageText("Your watchlist is empty — tap ➕ Add coin to add one.", { reply_markup: backToMenu });
    return;
  }

  const tickers = ctx.session.watchlist.map((w) => w.ticker);
  const coinIds = ctx.session.watchlist.map((w) => w.coinId);
  try {
    const prices = await getPrices(coinIds);
    const lines = tickers.map((t) => {
      const coinId = ctx.session.watchlist.find((w) => w.ticker === t)?.coinId;
      const price = coinId ? prices[coinId] : undefined;
      if (price !== undefined) {
        ctx.session.lastKnownPrices[t] = price;
        return `${t}: ${formatPrice(price)}`;
      }
      return `${t}: price unavailable`;
    });
    await ctx.editMessageText(lines.join("\n"), { reply_markup: backToMenu });
  } catch {
    await ctx.editMessageText("Couldn't fetch prices right now. Try again in a moment.", { reply_markup: backToMenu });
  }
});

export default composer;
