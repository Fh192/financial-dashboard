import type { CbrRate } from "./parse";

/** Рублей за одну единицу валюты: курс ЦБ дан за nominal единиц. */
export type RubPerUnit = Record<string, number>;

export function toRubPerUnit(rates: Pick<CbrRate, "code" | "nominal" | "value">[]): RubPerUnit {
  // Округляем до 6 знаков: ЦБ дает 4 знака на номинал до 10 000 единиц, а деление
  // во float иначе оставляет «шум» вроде 0.21216100000000002
  return Object.fromEntries(rates.map((r) => [r.code, Math.round((Number(r.value) / r.nominal) * 1e6) / 1e6]));
}

export type Conversion = { rub: number; eur: number | null; cny: number | null };

/**
 * Пересчет суммы счета (центы USD) по курсам ЦБ: в рубли напрямую,
 * в евро и юани — кросс-курсом через рубль. null, если курса нет.
 */
export function convertUsdCents(cents: number, rates: RubPerUnit): Conversion | null {
  const usd = rates.USD;
  if (!usd) return null;
  const rub = (cents / 100) * usd;
  return {
    rub,
    eur: rates.EUR ? rub / rates.EUR : null,
    cny: rates.CNY ? rub / rates.CNY : null,
  };
}

/** Сегодняшняя дата по Москве (YYYY-MM-DD): ЦБ устанавливает курсы по московскому времени. */
export function moscowToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow" }).format(now);
}

/** Курсов на будущие даты еще нет: для них берем сегодняшний. */
export function rateDateFor(date: string, today = moscowToday()): string {
  return date > today ? today : date;
}
