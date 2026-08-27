export type TcmbRates = {
  usdBuy: number | null;
  usdSell: number | null;
  eurBuy: number | null;
  eurSell: number | null;
};

const EMPTY_RATES: TcmbRates = { usdBuy: null, usdSell: null, eurBuy: null, eurSell: null };

export async function getTcmbRates(): Promise<TcmbRates> {
  try {
    const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return EMPTY_RATES;
    const xml = await res.text();

    function extract(code: string, tag: "ForexBuying" | "ForexSelling"): number | null {
      const block = xml.match(
        new RegExp(`<Currency[^>]*Kod="${code}"[^>]*>([\\s\\S]*?)</Currency>`)
      );
      if (!block) return null;
      const match = block[1].match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      if (!match || !match[1]) return null;
      const value = parseFloat(match[1].replace(",", "."));
      return Number.isFinite(value) ? value : null;
    }

    return {
      usdBuy: extract("USD", "ForexBuying"),
      usdSell: extract("USD", "ForexSelling"),
      eurBuy: extract("EUR", "ForexBuying"),
      eurSell: extract("EUR", "ForexSelling"),
    };
  } catch {
    return EMPTY_RATES;
  }
}
