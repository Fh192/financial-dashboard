// Коды ошибок PostgreSQL, которые превращаем в понятные сообщения.
// https://www.postgresql.org/docs/current/errcodes-appendix.html

type PgError = { code?: string; constraint?: string };

function pgError(error: unknown): PgError | null {
  return typeof error === "object" && error !== null && "code" in error ? (error as PgError) : null;
}

/**
 * Нарушение внешнего ключа: ссылка на несуществующую запись или удаление
 * используемой. С PostgreSQL 18 удаление при ON DELETE RESTRICT сообщает
 * отдельный код 23001 (restrict_violation), до 18 — общий 23503.
 */
export function isForeignKeyViolation(error: unknown): boolean {
  const code = pgError(error)?.code;
  return code === "23503" || code === "23001";
}

/** Нарушение уникальности; можно уточнить, какого ограничения (индекса). */
export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  const e = pgError(error);
  return e?.code === "23505" && (!constraint || e.constraint === constraint);
}
