export type TcmbRates = { usd: number | null; eur: number | null };

export async function getTcmbRates(): Promise<TcmbRates> {
  try {
    const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { usd: null, eur: null };
    const xml = await res.text();

    function extract(code: string): number | null {
      const block = xml.match(
        new RegExp(`<Currency[^>]*Kod="${code}"[^>]*>([\\s\\S]*?)</Currency>`)
      );
      if (!block) return null;
      const match = block[1].match(/<ForexSelling>([^<]*)<\/ForexSelling>/);
      if (!match || !match[1]) return null;
      const value = parseFloat(match[1].replace(",", "."));
      return Number.isFinite(value) ? value : null;
    }

    return { usd: extract("USD"), eur: extract("EUR") };
  } catch {
    return { usd: null, eur: null };
  }
}
