import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";

registerMainMenuItem({ label: "🗑 Remove coin", data: "remove:show", order: 20 });

const composer = new Composer<Ctx>();

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

function buildRemoveKeyboard(watchlist: { ticker: string }[]) {
  const rows = watchlist.map((w) => [inlineButton(`🗑 ${w.ticker}`, `remove:${w.ticker}`)]);
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);
  return inlineKeyboard(rows);
}

composer.command("remove", async (ctx) => {
  const text = ctx.message?.text?.trim() ?? "";
  const args = text.split(/\s+/).slice(1);
  const ticker = args[0]?.toUpperCase();

  if (ticker) {
    const idx = ctx.session.watchlist.findIndex((w) => w.ticker === ticker);
    if (idx === -1) {
      await ctx.reply(`${ticker} isn't on your watchlist.`, { reply_markup: backToMenu });
      return;
    }
    ctx.session.watchlist.splice(idx, 1);
    delete ctx.session.lastKnownPrices[ticker];
    await ctx.reply(`${ticker} removed from your watchlist.`, { reply_markup: backToMenu });
    return;
  }

  if (ctx.session.watchlist.length === 0) {
    await ctx.reply("Your watchlist is empty — tap ➕ Add coin to add one.", { reply_markup: backToMenu });
    return;
  }

  await ctx.reply("Tap a coin to remove it:", { reply_markup: buildRemoveKeyboard(ctx.session.watchlist) });
});

composer.callbackQuery("remove:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ctx.session.watchlist.length === 0) {
    await ctx.editMessageText("Your watchlist is empty — tap ➕ Add coin to add one.", { reply_markup: backToMenu });
    return;
  }
  await ctx.editMessageText("Tap a coin to remove it:", { reply_markup: buildRemoveKeyboard(ctx.session.watchlist) });
});

composer.callbackQuery(/^remove:([A-Z]+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const ticker = ctx.match[1];
  const idx = ctx.session.watchlist.findIndex((w) => w.ticker === ticker);
  if (idx === -1) {
    await ctx.editMessageText(`${ticker} isn't on your watchlist.`, { reply_markup: backToMenu });
    return;
  }
  ctx.session.watchlist.splice(idx, 1);
  delete ctx.session.lastKnownPrices[ticker];
  await ctx.editMessageText(`${ticker} removed from your watchlist.`, { reply_markup: backToMenu });
});

export default composer;
