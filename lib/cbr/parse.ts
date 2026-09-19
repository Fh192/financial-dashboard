// Разбор ответов с курсами ЦБ РФ. Два формата с одними и теми же данными:
// официальный XML (www.cbr.ru/scripts/XML_daily.asp) и JSON зеркала
// www.cbr-xml-daily.ru — он используется, если сайт ЦБ недоступен.

export type CbrRate = {
  code: string; // буквенный код ISO 4217: USD, EUR...
  nominal: number; // за сколько единиц валюты указан курс (100 алжирских динаров)
  value: string; // рублей за nominal единиц, 4 знака после точки
};

export type CbrRates = {
  /** Дата установки курса по данным ЦБ (для выходных — последний рабочий день). */
  publishedOn: string;
  rates: CbrRate[];
};

function normalizeRate(code: unknown, nominal: unknown, value: unknown): CbrRate | null {
  const c = String(code ?? "").trim();
  const n = Number(nominal);
  const v = Number(String(value ?? "").replace(",", "."));
  if (!/^[A-Z]{3}$/.test(c) || !Number.isInteger(n) || n <= 0 || !Number.isFinite(v) || v <= 0) return null;
  return { code: c, nominal: n, value: v.toFixed(4) };
}

function tag(block: string, name: string): string | undefined {
  return block.match(new RegExp(`<${name}>([^<]*)</${name}>`))?.[1];
}

/** XML ЦБ: <ValCurs Date="18.09.2026"><Valute>…<Value>84,5093</Value></Valute>…</ValCurs> */
export function parseCbrXml(xml: string): CbrRates {
  const date = xml.match(/<ValCurs\b[^>]*\bDate="(\d{2})\.(\d{2})\.(\d{4})"/);
  if (!date) throw new Error("ЦБ: в ответе нет даты курса");

  const rates: CbrRate[] = [];
  for (const [, block] of xml.matchAll(/<Valute\b[^>]*>([\s\S]*?)<\/Valute>/g)) {
    const rate = normalizeRate(tag(block, "CharCode"), tag(block, "Nominal"), tag(block, "Value"));
    if (rate) rates.push(rate);
  }
  if (rates.length === 0) throw new Error("ЦБ: в ответе нет курсов");

  return { publishedOn: `${date[3]}-${date[2]}-${date[1]}`, rates };
}

type MirrorJson = {
  Date?: string;
  Valute?: Record<string, { CharCode?: string; Nominal?: number; Value?: number }>;
};

/** JSON зеркала: { "Date": "2026-09-18T11:30:00+03:00", "Valute": { "USD": { "Nominal": 1, "Value": 84.5093 } } } */
export function parseCbrMirrorJson(json: unknown): CbrRates {
  const data = json as MirrorJson;
  const date = data?.Date?.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  if (!date) throw new Error("Зеркало ЦБ: в ответе нет даты курса");

  const rates = Object.values(data.Valute ?? {})
    .map((v) => normalizeRate(v?.CharCode, v?.Nominal, v?.Value))
    .filter((r): r is CbrRate => r !== null);
  if (rates.length === 0) throw new Error("Зеркало ЦБ: в ответе нет курсов");

  return { publishedOn: date, rates };
}
