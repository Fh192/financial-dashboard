import "server-only";
import { can, getCurrentUser } from "@/lib/dal";
import type { Permissions } from "@/lib/permissions";

/**
 * Проверка доступа для Route Handler выгрузки. Для скачивания файла
 * перенаправление на HTML-страницу неуместно, поэтому отвечаем кодами:
 * 401 — не выполнен вход, 403 — нет прав. null — доступ есть.
 */
export async function checkExportAccess(permissions: Permissions): Promise<Response | null> {
  const user = await getCurrentUser();
  if (!user) return new Response("Требуется вход в систему", { status: 401 });
  if (!can(user, permissions)) return new Response("Недостаточно прав для выгрузки", { status: 403 });
  return null;
}
