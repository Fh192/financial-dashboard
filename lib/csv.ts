import Papa from "papaparse";

// Выгрузка в CSV для русской версии Excel: разделитель «;», запятая в дробной
// части, UTF-8 с BOM (без BOM Excel читает файл как windows-1251 и кириллица ломается).

/** Предел строк в одной выгрузке: защита от слишком тяжелых запросов. */
export const MAX_EXPORT_ROWS = 10_000;

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

/**
 * Защита от CSV-инъекций: ячейку, которая начинается с =, +, -, @, табуляции
 * или перевода строки, Excel выполнит как формулу. Papa Parse добавляет перед
 * такой ячейкой апостроф. Своя регулярка вместо escapeFormulae: true, потому что
 * встроенная (^[=+\-@\t\r].*$) не срабатывает, если в ячейке есть перенос строки.
 */
const FORMULA_START = /^[=+\-@\t\r]/;

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const csv = Papa.unparse(
    {
      fields: columns.map((c) => c.header),
      data: rows.map((row) => columns.map((c) => c.value(row) ?? "")),
    },
    { delimiter: ";", newline: "\r\n", escapeFormulae: FORMULA_START },
  );
  return `\uFEFF${csv}`;
}

/** Центы → «1234,56»: без разделителя тысяч, чтобы Excel распознал число. */
export function csvAmount(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** YYYY-MM-DD → ДД.ММ.ГГГГ: так Excel в русской локали распознает дату. */
export function csvDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}.${m}.${y}`;
}

/** Ответ с файлом для скачивания. */
export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      // Выгрузка содержит данные конкретного пользователя — не кэшировать
      "Cache-Control": "private, no-store",
    },
  });
}
