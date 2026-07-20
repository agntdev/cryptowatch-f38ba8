const BASE = "https://api.coingecko.com/api/v3";

interface CoinListItem {
  id: string;
  symbol: string;
  name: string;
}

let coinsListCache: CoinListItem[] | null = null;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export async function getCoinsList(): Promise<CoinListItem[]> {
  if (coinsListCache) return coinsListCache;
  coinsListCache = await fetchJson<CoinListItem[]>(`${BASE}/coins/list`);
  return coinsListCache;
}

export async function findCoinId(ticker: string): Promise<string | null> {
  const list = await getCoinsList();
  const lower = ticker.toLowerCase();
  const match = list.find((c) => c.symbol === lower);
  return match?.id ?? null;
}

export async function getTickerSuggestions(partial: string): Promise<string[]> {
  const list = await getCoinsList();
  const lower = partial.toLowerCase();
  return list
    .filter((c) => c.symbol.startsWith(lower) || c.name.toLowerCase().startsWith(lower))
    .slice(0, 5)
    .map((c) => c.symbol.toUpperCase());
}

export async function getPrice(coinId: string): Promise<number> {
  const data = await fetchJson<Record<string, Record<string, number>>>(
    `${BASE}/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=usd`,
  );
  const price = data[coinId]?.usd;
  if (price === undefined) throw new Error(`Price not found for ${coinId}`);
  return price;
}

export async function getPrices(
  coinIds: string[],
): Promise<Record<string, number>> {
  if (coinIds.length === 0) return {};
  const ids = coinIds.map(encodeURIComponent).join(",");
  const data = await fetchJson<Record<string, Record<string, number>>>(
    `${BASE}/simple/price?ids=${ids}&vs_currencies=usd`,
  );
  const result: Record<string, number> = {};
  for (const id of coinIds) {
    const price = data[id]?.usd;
    if (price !== undefined) result[id] = price;
  }
  return result;
}

export async function validateTicker(
  ticker: string,
): Promise<{ valid: true; coinId: string } | { valid: false; suggestions: string[] }> {
  const coinId = await findCoinId(ticker);
  if (coinId) return { valid: true, coinId };
  const suggestions = await getTickerSuggestions(ticker);
  return { valid: false, suggestions };
}

export function formatPrice(price: number): string {
  if (price >= 1) return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(8)}`;
}
