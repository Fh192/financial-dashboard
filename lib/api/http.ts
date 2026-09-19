import "server-only";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { can, type CurrentUser, getCurrentUser } from "@/lib/dal";
import type { Permissions } from "@/lib/permissions";
import { ServiceError } from "@/lib/services/errors";

// Общие части REST API: единый формат ошибок, аутентификация (cookie сессии
// или Authorization: Bearer — плагин bearer в lib/auth.ts), разбор запроса.

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, string[] | undefined>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const SERVICE_STATUS = { NOT_FOUND: 404, CONFLICT: 409, INVALID_REFERENCE: 422 } as const;

function errorResponse(status: number, code: string, message: string, details?: Record<string, string[] | undefined>) {
  return Response.json({ error: { code, message, ...(details && { details }) } }, { status });
}

/**
 * Обертка обработчика: переводит ошибки в JSON с нужным HTTP-статусом.
 * Необработанные ошибки не раскрываются клиенту — только в лог сервера.
 */
export function apiRoute<Ctx>(handler: (request: NextRequest, ctx: Ctx) => Promise<Response>) {
  return async (request: NextRequest, ctx: Ctx): Promise<Response> => {
    try {
      return await handler(request, ctx);
    } catch (error) {
      if (error instanceof ApiError) return errorResponse(error.status, error.code, error.message, error.details);
      if (error instanceof ServiceError) {
        return errorResponse(
          SERVICE_STATUS[error.code],
          error.code,
          error.message,
          error.field ? { [error.field]: [error.message] } : undefined,
        );
      }
      console.error(`API ${request.method} ${request.nextUrl.pathname}`, error);
      return errorResponse(500, "INTERNAL_ERROR", "Внутренняя ошибка сервера.");
    }
  };
}

/** Пользователь запроса с проверкой прав: 401 — не аутентифицирован, 403 — нет прав. */
export async function requireApiUser(permissions?: Permissions): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "UNAUTHORIZED", "Требуется аутентификация: cookie сессии или заголовок Authorization: Bearer.");
  if (permissions && !can(user, permissions)) throw new ApiError(403, "FORBIDDEN", "Недостаточно прав для этого действия.");
  return user;
}

function validationError(error: z.ZodError, message = "Проверьте поля запроса."): ApiError {
  const { formErrors, fieldErrors } = z.flattenError(error);
  const details: Record<string, string[] | undefined> = { ...fieldErrors };
  if (formErrors.length > 0) details._ = formErrors;
  return new ApiError(400, "VALIDATION_ERROR", message, details);
}

/**
 * Тело запроса в JSON по схеме. Требуем Content-Type: application/json:
 * такой запрос браузер не отправит с чужого сайта без CORS-разрешения,
 * что защищает API на cookie от CSRF.
 */
export async function readJson<T extends z.ZodType>(request: NextRequest, schema: T): Promise<z.output<T>> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Ожидается Content-Type: application/json.");
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Тело запроса не является корректным JSON.");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw validationError(parsed.error);
  return parsed.data;
}

/** Параметры строки запроса (?page=2&query=...) по схеме. */
export function readQuery<T extends z.ZodType>(request: NextRequest, schema: T): z.output<T> {
  const parsed = schema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) throw validationError(parsed.error, "Проверьте параметры запроса.");
  return parsed.data;
}

/** id из пути; некорректный UUID — это «не найдено», а не ошибка сервера. */
export function parseId(id: string, notFoundMessage: string): string {
  if (!z.uuid().safeParse(id).success) throw new ApiError(404, "NOT_FOUND", notFoundMessage);
  return id;
}

export function notFound(message: string): never {
  throw new ApiError(404, "NOT_FOUND", message);
}

export function pagination(page: number, pageSize: number, total: number) {
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}
