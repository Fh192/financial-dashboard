// Суммы в БД хранятся в центах USD, даты — строками YYYY-MM-DD.
// Даты разбираем как UTC и форматируем в UTC, чтобы часовой пояс сервера
// или браузера не сдвигал день.

const currency = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "USD" });
const compactCurrency = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const monthShort = new Intl.DateTimeFormat("ru-RU", { month: "short", timeZone: "UTC" });
const monthLong = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric", timeZone: "UTC" });

function parseISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** 150000 → «1 500,00 $» */
export function formatCurrency(cents: number): string {
  return currency.format(cents / 100);
}

/** 1250000 → «12,5 тыс. $» — для осей графика */
export function formatCurrencyCompact(cents: number): string {
  return compactCurrency.format(cents / 100);
}

/** 2026-09-18 → «18 сент. 2026 г.» */
export function formatDate(isoDate: string): string {
  return dateFormat.format(parseISODate(isoDate));
}

/** 2026-09-01 → «сент.» */
export function formatMonthShort(isoDate: string): string {
  return monthShort.format(parseISODate(isoDate));
}

/** 2026-09-01 → «сентябрь 2026 г.» */
export function formatMonthLong(isoDate: string): string {
  return monthLong.format(parseISODate(isoDate));
}

/** «ООО «Северный ветер»» → «СВ», «Иван Петров» → «ИП» */
export function initials(name: string): string {
  const words = name
    .replace(/[«»"']/g, " ")
    .split(/\s+/)
    .filter((w) => w && !/^(ООО|АО|ПАО|ЗАО|ИП)$/i.test(w));
  const letters = (words.length > 1 ? [words[0], words[1]] : words.slice(0, 1)).map((w) => w[0]);
  return letters.join("").toUpperCase() || "?";
}
