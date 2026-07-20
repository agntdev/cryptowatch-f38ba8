import { Composer } from "grammy";
import { readdirSync } from "node:fs";
import { createBot, type BotContext } from "./toolkit/index.js";

// The per-chat session shape. In production (Redis-backed), this IS the durable
// store for user data. Each private chat = one user's data.
export interface Session {
  step?: string;
  watchlist: WatchlistItem[];
  quietHoursStart: string;
  quietHoursEnd: string;
  summaryTime: string;
  lastKnownPrices: Record<string, number>;
  cooldownState: Record<string, number>;
}

export interface WatchlistItem {
  ticker: string;
  coinId: string;
  priceThreshold?: number;
  percentThreshold?: number;
}

export function initialSession(): Session {
  return {
    watchlist: [],
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    summaryTime: "09:00",
    lastKnownPrices: {},
    cooldownState: {},
  };
}

export type Ctx = BotContext<Session>;

/**
 * buildBot — assembles the bot, AUTO-LOADS every feature handler from
 * src/handlers/, then registers the global fallback. Does NOT start the bot.
 * Add a feature by creating src/handlers/<name>.ts that default-exports a grammY
 * Composer — NEVER edit this file (concurrent feature PRs would conflict).
 */
export async function buildBot(token: string) {
  const bot = createBot<Session>(token, {
    initial: initialSession,
  });

  const dir = new URL("./handlers/", import.meta.url);
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter(
      (f) =>
        (f.endsWith(".js") || f.endsWith(".ts")) &&
        !f.endsWith(".d.ts") &&
        !f.includes(".test.") &&
        !f.includes(".spec."),
    );
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    files = []; // no handlers/ dir yet → nothing to load
  }
  for (const file of files.sort()) {
    const mod = (await import(new URL(file, dir).href)) as { default?: Composer<Ctx> };
    if (!mod.default) {
      throw new Error(`handler ${file} must default-export a grammY Composer`);
    }
    bot.use(mod.default);
  }

  bot.on("message", (ctx) => ctx.reply("Sorry, I didn't understand that. Try /help."));

  return bot;
}
