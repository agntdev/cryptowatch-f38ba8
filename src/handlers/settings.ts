import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { formatPrice } from "../services/coingecko.js";

registerMainMenuItem({ label: "⚙️ Settings", data: "settings:show", order: 80 });

const composer = new Composer<Ctx>();

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

function buildSettingsText(ctx: Ctx): string {
  const lines: string[] = ["⚙️ Your settings:\n"];

  if (ctx.session.watchlist.length === 0) {
    lines.push("Watchlist: empty — tap ➕ Add coin to add one.");
  } else {
    lines.push("Watchlist:");
    for (const w of ctx.session.watchlist) {
      const price = ctx.session.lastKnownPrices[w.ticker];
      const priceStr = price !== undefined ? ` @ ${formatPrice(price)}` : "";
      let entry = `  • ${w.ticker}${priceStr}`;
      if (w.priceThreshold !== undefined) entry += `\n    Alert if price hits $${w.priceThreshold.toLocaleString("en-US")}`;
      if (w.percentThreshold !== undefined) entry += `\n    Alert if ${w.percentThreshold > 0 ? "rises" : "drops"} ${Math.abs(w.percentThreshold)}% in 1h`;
      lines.push(entry);
    }
  }

  lines.push("");
  lines.push(`Quiet hours: ${ctx.session.quietHoursStart}–${ctx.session.quietHoursEnd}`);
  lines.push(`Daily summary: ${ctx.session.summaryTime}`);

  return lines.join("\n");
}

composer.command("settings", async (ctx) => {
  await ctx.reply(buildSettingsText(ctx), { reply_markup: backToMenu });
});

composer.callbackQuery("settings:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(buildSettingsText(ctx), { reply_markup: backToMenu });
});

export default composer;
