import "server-only";
import { cache } from "react";
import { fetchCbrRates } from "@/lib/cbr/client";
import { moscowToday, rateDateFor, type RubPerUnit, toRubPerUnit } from "@/lib/cbr/convert";
import { requireUser } from "@/lib/dal";
import { pool } from "@/lib/db";

export type ExchangeRates = {
  /** Дата, на которую действует курс. */
  date: string;
  /** Рублей за единицу валюты. */
  rates: RubPerUnit;
  /** Откуда взяты курсы в этот раз: кэш в БД или внешний источник. */
  source: "cache" | "cbr" | "mirror";
};

/**
 * Курсы ЦБ на дату (по умолчанию — на сегодня по Москве). Сначала ищем в
 * таблице exchange_rates, при промахе запрашиваем ЦБ и сохраняем: курс на
 * прошедшую дату не меняется, поэтому кэш не устаревает.
 * null — если курсов нет в кэше и внешние источники недоступны.
 */
export const getExchangeRates = cache(async (date?: string): Promise<ExchangeRates | null> => {
  await requireUser();
  const rateDate = rateDateFor(date ?? moscowToday());

  const cached = await pool.query<{ code: string; nominal: number; value: string }>(
    "SELECT currency_code AS code, nominal, value FROM exchange_rates WHERE rate_date = $1",
    [rateDate],
  );
  if (cached.rows.length > 0) {
    return { date: rateDate, rates: toRubPerUnit(cached.rows), source: "cache" };
  }

  let fetched;
  try {
    fetched = await fetchCbrRates(rateDate);
  } catch (error) {
    console.error(error);
    return null;
  }

  // Параллельный запрос мог уже сохранить эти курсы — тогда просто пропускаем
  await pool.query(
    `INSERT INTO exchange_rates (rate_date, currency_code, nominal, value)
     SELECT $1::date, * FROM unnest($2::char(3)[], $3::int[], $4::numeric[])
     ON CONFLICT (rate_date, currency_code) DO NOTHING`,
    [
      rateDate,
      fetched.rates.map((r) => r.code),
      fetched.rates.map((r) => r.nominal),
      fetched.rates.map((r) => r.value),
    ],
  );

  return { date: rateDate, rates: toRubPerUnit(fetched.rates), source: fetched.source };
});
