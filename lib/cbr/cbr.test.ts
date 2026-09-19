import { describe, expect, it } from "vitest";
import { convertUsdCents, moscowToday, rateDateFor, toRubPerUnit } from "./convert";
import { parseCbrMirrorJson, parseCbrXml } from "./parse";

// Фрагменты реальных ответов за 18.09.2026 (XML уже перекодирован из windows-1251)
const XML = `<?xml version="1.0" encoding="windows-1251"?><ValCurs Date="18.09.2026" name="Foreign Currency Market">
<Valute ID="R01030"><NumCode>012</NumCode><CharCode>DZD</CharCode><Nominal>100</Nominal><Name>Алжирских динаров</Name><Value>63,2339</Value><VunitRate>0,632339</VunitRate></Valute>
<Valute ID="R01235"><NumCode>840</NumCode><CharCode>USD</CharCode><Nominal>1</Nominal><Name>Доллар США</Name><Value>84,5093</Value><VunitRate>84,5093</VunitRate></Valute>
<Valute ID="R01239"><NumCode>978</NumCode><CharCode>EUR</CharCode><Nominal>1</Nominal><Name>Евро</Name><Value>97,4984</Value><VunitRate>97,4984</VunitRate></Valute>
<Valute ID="R01375"><NumCode>156</NumCode><CharCode>CNY</CharCode><Nominal>1</Nominal><Name>Юань</Name><Value>12,5788</Value><VunitRate>12,5788</VunitRate></Valute>
</ValCurs>`;

const MIRROR = {
  Date: "2026-09-18T11:30:00+03:00",
  PreviousDate: "2026-09-17T11:30:00+03:00",
  Valute: {
    USD: { ID: "R01235", CharCode: "USD", Nominal: 1, Name: "Доллар США", Value: 84.5093, Previous: 84.1732 },
    DZD: { ID: "R01030", CharCode: "DZD", Nominal: 100, Name: "Алжирских динаров", Value: 63.2339, Previous: 62.9867 },
  },
};

describe("parseCbrXml", () => {
  it("берет дату установки курса и курсы с запятой в дробной части", () => {
    const result = parseCbrXml(XML);
    expect(result.publishedOn).toBe("2026-09-18");
    expect(result.rates).toContainEqual({ code: "USD", nominal: 1, value: "84.5093" });
    expect(result.rates).toContainEqual({ code: "DZD", nominal: 100, value: "63.2339" });
    expect(result.rates).toHaveLength(4);
  });

  it("пропускает битые записи, но не весь ответ", () => {
    const broken = XML.replace("<Value>97,4984</Value>", "<Value>н/д</Value>");
    expect(parseCbrXml(broken).rates.map((r) => r.code)).not.toContain("EUR");
  });

  it("падает на ответе без даты или без курсов (например, на HTML-странице ошибки)", () => {
    expect(() => parseCbrXml("<html>Service unavailable</html>")).toThrow();
    expect(() => parseCbrXml('<ValCurs Date="18.09.2026"></ValCurs>')).toThrow();
  });
});

describe("parseCbrMirrorJson", () => {
  it("дает тот же результат, что и официальный XML", () => {
    const mirror = parseCbrMirrorJson(MIRROR);
    const official = parseCbrXml(XML);
    expect(mirror.publishedOn).toBe(official.publishedOn);
    expect(mirror.rates.find((r) => r.code === "USD")).toEqual(official.rates.find((r) => r.code === "USD"));
    expect(mirror.rates.find((r) => r.code === "DZD")).toEqual(official.rates.find((r) => r.code === "DZD"));
  });

  it("падает на неожиданном ответе", () => {
    expect(() => parseCbrMirrorJson(null)).toThrow();
    expect(() => parseCbrMirrorJson({ Date: "2026-09-18T11:30:00+03:00", Valute: {} })).toThrow();
  });
});

describe("пересчет", () => {
  const rates = toRubPerUnit(parseCbrXml(XML).rates);

  it("учитывает номинал курса и не оставляет шума плавающей точки", () => {
    expect(rates.USD).toBe(84.5093);
    expect(rates.DZD).toBe(0.632339);
    expect(toRubPerUnit([{ code: "AMD", nominal: 100, value: "21.2161" }]).AMD).toBe(0.212161);
  });

  it("переводит центы USD в рубли, евро и юани", () => {
    const result = convertUsdCents(150000, rates)!; // 1 500 $
    expect(result.rub).toBeCloseTo(126763.95, 2);
    expect(result.eur).toBeCloseTo(126763.95 / 97.4984, 4);
    expect(result.cny).toBeCloseTo(126763.95 / 12.5788, 4);
  });

  it("без курса доллара пересчитать нельзя", () => {
    expect(convertUsdCents(100, { EUR: 97.5 })).toBeNull();
    expect(convertUsdCents(100, { USD: 84.5 })).toEqual({ rub: 84.5, eur: null, cny: null }); // 1 $
  });
});

describe("даты курса", () => {
  it("определяет сегодняшний день по Москве", () => {
    // 22:30 UTC — в Москве уже следующий день
    expect(moscowToday(new Date("2026-09-18T22:30:00Z"))).toBe("2026-09-19");
    expect(moscowToday(new Date("2026-09-18T20:30:00Z"))).toBe("2026-09-18");
  });

  it("для будущих дат берет сегодняшний курс", () => {
    expect(rateDateFor("2026-12-31", "2026-09-19")).toBe("2026-09-19");
    expect(rateDateFor("2026-03-15", "2026-09-19")).toBe("2026-03-15");
  });
});
