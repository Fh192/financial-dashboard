import { describe, expect, it } from "vitest";
import { csvAmount, csvDate, csvResponse, toCsv } from "./csv";

type Row = { name: string; amount: number };
const columns = [
  { header: "Клиент", value: (r: Row) => r.name },
  { header: "Сумма", value: (r: Row) => csvAmount(r.amount) },
];

describe("toCsv", () => {
  it("пишет BOM, заголовок и строки через «;» с переводом строки CRLF", () => {
    const csv = toCsv([{ name: "ООО «Ромашка»", amount: 150050 }], columns);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv.slice(1)).toBe("Клиент;Сумма\r\nООО «Ромашка»;1500,50");
  });

  it("экранирует разделитель, кавычки и переносы строк", () => {
    const csv = toCsv([{ name: 'ИП "Иванов"; филиал\nМосква', amount: 100 }], columns);
    expect(csv).toContain('"ИП ""Иванов""; филиал\nМосква";1,00');
  });

  it("не дает Excel выполнить формулу из названия клиента", () => {
    const csv = toCsv(
      [
        { name: "=HYPERLINK(\"http://evil\")", amount: 1 },
        { name: "+7 999", amount: 1 },
        { name: "@SUM(A1)", amount: 1 },
        { name: "=1+1\nвторая строка", amount: 1 }, // обход встроенной защиты Papa Parse
      ],
      columns,
    );
    // Перед такой ячейкой ставится апостроф, и она берется в кавычки
    const lines = csv.slice(1).split("\r\n").slice(1);
    expect(lines[0].startsWith(`"'=HYPERLINK`)).toBe(true);
    expect(lines[1].startsWith(`"'+7 999"`)).toBe(true);
    expect(lines[2].startsWith(`"'@SUM(A1)"`)).toBe(true);
    expect(lines[3].startsWith(`"'=1+1`)).toBe(true);
  });

  it("пустые значения выводит пустыми ячейками", () => {
    const csv = toCsv([{ a: null, b: undefined }], [
      { header: "A", value: (r: { a: null; b: undefined }) => r.a },
      { header: "B", value: (r: { a: null; b: undefined }) => r.b },
    ]);
    expect(csv.slice(1)).toBe("A;B\r\n;");
  });
});

describe("форматы для Excel", () => {
  it("суммы без разделителя тысяч и с запятой", () => {
    expect(csvAmount(123456789)).toBe("1234567,89");
    expect(csvAmount(5)).toBe("0,05");
  });

  it("даты в формате ДД.ММ.ГГГГ", () => {
    expect(csvDate("2026-09-19")).toBe("19.09.2026");
  });
});

describe("csvResponse", () => {
  it("отдает файл на скачивание и запрещает кэширование", async () => {
    const response = csvResponse("\uFEFFa;b", "invoices-2026-09-19.csv");
    expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("Content-Disposition")).toContain('attachment; filename="invoices-2026-09-19.csv"');
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    // response.text() отбрасывает BOM при декодировании, поэтому смотрим байты
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  });
});
