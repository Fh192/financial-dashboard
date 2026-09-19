import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Модуль серверный; в тестах защита server-only не нужна
vi.mock("server-only", () => ({}));

const { fetchCbrRates } = await import("./client");

// Только ASCII: одинаково читается и как UTF-8, и как windows-1251
const CBR_XML = `<?xml version="1.0" encoding="windows-1251"?><ValCurs Date="11.10.2025" name="Foreign Currency Market">
<Valute ID="R01235"><CharCode>USD</CharCode><Nominal>1</Nominal><Value>81,1898</Value></Valute>
<Valute ID="R01239"><CharCode>EUR</CharCode><Nominal>1</Nominal><Value>94,0491</Value></Valute></ValCurs>`;

const MIRROR_JSON = {
  Date: "2025-10-11T11:30:00+03:00",
  Valute: { USD: { CharCode: "USD", Nominal: 1, Value: 81.1898 } },
};

type Route = (url: string) => Response | Promise<Response>;

function mockFetch(route: Route) {
  const fetchMock = vi.fn(async (input: string | URL | Request) => route(String(input)));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchCbrRates", () => {
  it("берет курсы с сайта ЦБ и передает дату в формате ДД/ММ/ГГГГ", async () => {
    const fetchMock = mockFetch(() => new Response(CBR_XML, { status: 200 }));

    const result = await fetchCbrRates("2025-10-12");

    expect(result.source).toBe("cbr");
    expect(result.publishedOn).toBe("2025-10-11");
    expect(result.rates).toContainEqual({ code: "USD", nominal: 1, value: "81.1898" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("https://www.cbr.ru/scripts/XML_daily.asp?date_req=12/10/2025");
  });

  it("при ошибке ЦБ переходит на зеркало и пропускает дни без курса", async () => {
    const fetchMock = mockFetch((url) => {
      if (url.includes("cbr.ru/scripts")) return new Response("Service Unavailable", { status: 503 });
      // Воскресенье 12.10 в архиве зеркала отсутствует, суббота 11.10 есть
      if (url.includes("/archive/2025/10/12/")) return new Response("Not Found", { status: 404 });
      if (url.includes("/archive/2025/10/11/")) return Response.json(MIRROR_JSON);
      throw new Error(`Неожиданный запрос ${url}`);
    });

    const result = await fetchCbrRates("2025-10-12");

    expect(result.source).toBe("mirror");
    expect(result.publishedOn).toBe("2025-10-11");
    expect(result.rates).toEqual([{ code: "USD", nominal: 1, value: "81.1898" }]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("считает ошибкой HTML-страницу вместо XML и тоже уходит на зеркало", async () => {
    mockFetch((url) =>
      url.includes("cbr.ru/scripts")
        ? new Response("<html>Доступ ограничен</html>", { status: 200 })
        : Response.json(MIRROR_JSON),
    );

    await expect(fetchCbrRates("2025-10-11")).resolves.toMatchObject({ source: "mirror" });
  });

  it("сообщает об ошибке, если недоступны оба источника", async () => {
    mockFetch(() => {
      throw new TypeError("fetch failed");
    });

    await expect(fetchCbrRates("2025-10-11")).rejects.toThrow("Курсы ЦБ недоступны");
  });

  it("не ищет в архиве зеркала бесконечно", async () => {
    const fetchMock = mockFetch((url) =>
      url.includes("cbr.ru/scripts") ? new Response("", { status: 500 }) : new Response("", { status: 404 }),
    );

    await expect(fetchCbrRates("2025-10-11")).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1 + 10);
  });
});
