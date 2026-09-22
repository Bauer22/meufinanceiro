// Cotações USD/EUR em BRL (AwesomeAPI), com cache em memória de 5 minutos.
export type Rates = { USD: number; EUR: number; at: number };

let cache: Rates | null = null;

export async function getRates(): Promise<Rates | null> {
  if (cache && Date.now() - cache.at < 5 * 60_000) return cache;
  try {
    const res = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL", {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    const d = await res.json();
    const USD = parseFloat(d.USDBRL.bid);
    const EUR = parseFloat(d.EURBRL.bid);
    if (Number.isFinite(USD) && Number.isFinite(EUR)) cache = { USD, EUR, at: Date.now() };
  } catch {
    /* mantém o último valor conhecido */
  }
  return cache;
}

export const rateFor = (rates: Rates | null, currency: string): number | null =>
  currency === "BRL" ? 1 : rates ? (currency === "USD" ? rates.USD : currency === "EUR" ? rates.EUR : null) : null;
