import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";

registerMainMenuItem({ label: "🌅 Summary", data: "summary:show", order: 70 });

const composer = new Composer<Ctx>();

const USAGE = "To set your daily summary time, type:\n/summary 09\n/summary 7\n\nYou'll receive a morning summary at that hour.";

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

function parseHour(s: string): number | null {
  const n = parseInt(s, 10);
  if (isNaN(n) || n < 0 || n > 23) return null;
  return n;
}

composer.command("summary", async (ctx) => {
  const text = ctx.message?.text?.trim() ?? "";
  const args = text.split(/\s+/).slice(1);
  const hourStr = args[0];

  if (!hourStr) {
    await ctx.reply(`Current summary time: ${ctx.session.summaryTime}\n\n${USAGE}`, { reply_markup: backToMenu });
    return;
  }

  const hour = parseHour(hourStr);
  if (hour === null) {
    await ctx.reply("Please enter a valid hour between 0 and 23.", { reply_markup: backToMenu });
    return;
  }

  ctx.session.summaryTime = String(hour).padStart(2, "0") + ":00";
  await ctx.reply(`Daily summary set for ${ctx.session.summaryTime}.`, { reply_markup: backToMenu });
});

composer.callbackQuery("summary:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`Current summary time: ${ctx.session.summaryTime}\n\n${USAGE}`, { reply_markup: backToMenu });
});

export default composer;
