/**
 * Шаблон для ILIKE '%...%'. Символы % и _ в запросе пользователя ищутся
 * буквально: иначе запрос «_» находил бы все строки, а «%» — вообще все.
 * В PostgreSQL символ экранирования для LIKE по умолчанию — обратная косая черта.
 */
export function containsPattern(query: string): string {
  return `%${query.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/** Номер страницы из параметра URL: всё некорректное — первая страница. */
export function parsePage(value: string | string[] | undefined): number {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

/** Строка поиска из параметра URL. */
export function parseQuery(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, 100) ?? "";
}

/**
 * Номера страниц для пагинации с многоточиями, как в туториале Next.js:
 * [1, 2, 3, "...", 9, 10] или [1, "...", 4, 5, 6, "...", 10].
 */
export function paginationItems(currentPage: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (currentPage <= 3) return [1, 2, 3, "...", totalPages - 1, totalPages];
  if (currentPage >= totalPages - 2) return [1, 2, "...", totalPages - 2, totalPages - 1, totalPages];
  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}
