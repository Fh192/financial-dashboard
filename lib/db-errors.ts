// Коды ошибок PostgreSQL, которые превращаем в понятные сообщения.
// https://www.postgresql.org/docs/current/errcodes-appendix.html

type PgError = { code?: string; constraint?: string };

function pgError(error: unknown): PgError | null {
  return typeof error === "object" && error !== null && "code" in error ? (error as PgError) : null;
}

/** Нарушение внешнего ключа: ссылка на удаленную запись или удаление используемой. */
export function isForeignKeyViolation(error: unknown): boolean {
  return pgError(error)?.code === "23503";
}

/** Нарушение уникальности; можно уточнить, какого ограничения (индекса). */
export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  const e = pgError(error);
  return e?.code === "23505" && (!constraint || e.constraint === constraint);
}
