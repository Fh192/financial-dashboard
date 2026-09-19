import "server-only";
import { type CbrRates, parseCbrMirrorJson, parseCbrXml } from "./parse";

// Внешняя интеграция: официальные курсы ЦБ РФ. Сначала — сайт ЦБ,
// при ошибке — зеркало cbr-xml-daily.ru с теми же данными (сайт ЦБ бывает
// недоступен или отвечает ошибкой на запросы из-за рубежа, например с Vercel).

const TIMEOUT_MS = 5000;
// Заголовки HTTP — только ASCII, кириллица здесь ломает fetch
const USER_AGENT = "financial-dashboard/1.0 (student project)";

async function get(url: string): Promise<Response> {
  return fetch(url, {
    cache: "no-store", // кэшируем сами, в таблице exchange_rates
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "User-Agent": USER_AGENT },
  });
}

/** Курсы, действующие на дату, с сайта ЦБ. Ответ в кодировке windows-1251. */
async function fromCbr(date: string): Promise<CbrRates> {
  const [y, m, d] = date.split("-");
  const response = await get(`https://www.cbr.ru/scripts/XML_daily.asp?date_req=${d}/${m}/${y}`);
  if (!response.ok) throw new Error(`ЦБ: HTTP ${response.status}`);
  const xml = new TextDecoder("windows-1251").decode(await response.arrayBuffer());
  return parseCbrXml(xml);
}

/**
 * Курсы с зеркала. У архива зеркала нет файлов за дни без установки курса
 * (воскресенье, праздники), поэтому идем назад, пока не найдем файл.
 */
async function fromMirror(date: string): Promise<CbrRates> {
  const day = new Date(`${date}T00:00:00Z`);
  for (let attempt = 0; attempt < 10; attempt++) {
    const path = day.toISOString().slice(0, 10).replaceAll("-", "/");
    const response = await get(`https://www.cbr-xml-daily.ru/archive/${path}/daily_json.js`);
    if (response.ok) return parseCbrMirrorJson(await response.json());
    if (response.status !== 404) throw new Error(`Зеркало ЦБ: HTTP ${response.status}`);
    day.setUTCDate(day.getUTCDate() - 1);
  }
  throw new Error(`Зеркало ЦБ: нет курсов за 10 дней до ${date}`);
}

/** Курсы ЦБ, действующие на дату (YYYY-MM-DD). Бросает ошибку, если оба источника недоступны. */
export async function fetchCbrRates(date: string): Promise<CbrRates & { source: "cbr" | "mirror" }> {
  try {
    return { ...(await fromCbr(date)), source: "cbr" };
  } catch (cbrError) {
    console.warn("Курсы ЦБ: сайт ЦБ недоступен, пробуем зеркало", cbrError);
    try {
      return { ...(await fromMirror(date)), source: "mirror" };
    } catch (mirrorError) {
      throw new AggregateError([cbrError, mirrorError], "Курсы ЦБ недоступны");
    }
  }
}
