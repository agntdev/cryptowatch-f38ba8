import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";

registerMainMenuItem({ label: "🔇 Quiet hours", data: "quiet:show", order: 60 });

const composer = new Composer<Ctx>();

const USAGE = "To set quiet hours, type:\n/quiet 22 08\n\nThis suppresses alerts from 22:00 to 08:00.";

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

function parseHour(s: string): number | null {
  const n = parseInt(s, 10);
  if (isNaN(n) || n < 0 || n > 23) return null;
  return n;
}

composer.command("quiet", async (ctx) => {
  const text = ctx.message?.text?.trim() ?? "";
  const args = text.split(/\s+/).slice(1);
  const startStr = args[0];
  const endStr = args[1];

  if (!startStr || !endStr) {
    const current = `Current quiet hours: ${ctx.session.quietHoursStart}–${ctx.session.quietHoursEnd}`;
    await ctx.reply(`${current}\n\n${USAGE}`, { reply_markup: backToMenu });
    return;
  }

  const start = parseHour(startStr);
  const end = parseHour(endStr);
  if (start === null || end === null) {
    await ctx.reply("Please enter hours as numbers between 0 and 23.", { reply_markup: backToMenu });
    return;
  }

  ctx.session.quietHoursStart = String(start).padStart(2, "0") + ":00";
  ctx.session.quietHoursEnd = String(end).padStart(2, "0") + ":00";
  await ctx.reply(`Quiet hours set: ${ctx.session.quietHoursStart}–${ctx.session.quietHoursEnd}. Alerts will be suppressed during this window.`, { reply_markup: backToMenu });
});

composer.callbackQuery("quiet:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const current = `Current quiet hours: ${ctx.session.quietHoursStart}–${ctx.session.quietHoursEnd}`;
  await ctx.editMessageText(`${current}\n\n${USAGE}`, { reply_markup: backToMenu });
});

export default composer;
