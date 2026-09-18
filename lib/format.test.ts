import { describe, expect, it } from "vitest";
import { formatCurrency, formatCurrencyCompact, formatDate, formatMonthLong, formatMonthShort, initials } from "./format";

// Intl в ru-RU разделяет разряды и валюту неразрывными пробелами
const normalize = (s: string) => s.replace(/[  ]/g, " ");

describe("formatCurrency", () => {
  it("переводит центы в доллары с разделителями ru-RU", () => {
    expect(normalize(formatCurrency(150000))).toBe("1 500,00 $");
    expect(normalize(formatCurrency(99))).toBe("0,99 $");
    expect(normalize(formatCurrency(0))).toBe("0,00 $");
  });

  it("сокращает большие суммы для осей графика", () => {
    expect(normalize(formatCurrencyCompact(1250000))).toBe("12,5 тыс. $");
  });
});

describe("даты", () => {
  it("форматирует дату без сдвига из-за часового пояса", () => {
    expect(formatDate("2026-09-18")).toBe("18 сент. 2026 г.");
    expect(formatDate("2026-01-01")).toBe("1 янв. 2026 г.");
    expect(formatDate("2025-12-31")).toBe("31 дек. 2025 г.");
  });

  it("форматирует месяц для графика", () => {
    expect(formatMonthShort("2026-09-01")).toBe("сент.");
    expect(formatMonthLong("2026-09-01")).toBe("сентябрь 2026 г.");
  });
});

describe("initials", () => {
  it("берет первые буквы двух слов без организационно-правовой формы", () => {
    expect(initials("ООО «Северный ветер»")).toBe("СВ");
    expect(initials("ИП Смирнова А. В.")).toBe("СА");
    expect(initials("Иван Петров")).toBe("ИП");
    expect(initials("Администратор")).toBe("А");
  });

  it("не падает на пустом имени", () => {
    expect(initials("")).toBe("?");
  });
});
