import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { DEFAULT_ROLE, hasPermission, isRole, type Permissions, type Role } from "@/lib/permissions";

/** Данные текущего пользователя, которые можно отдавать в компоненты. */
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  image: string | null;
};

/**
 * Сессия проверяется по БД на каждый запрос (одна проверка на рендер благодаря cache).
 * Proxy смотрит только на наличие cookie — это не проверка доступа.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const { id, name, email, image, role } = session.user;
  return { id, name, email, image: image ?? null, role: isRole(role) ? role : DEFAULT_ROLE };
});

/** Для страниц и действий, куда пускают только после входа. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function can(user: Pick<CurrentUser, "role">, permissions: Permissions): boolean {
  return hasPermission(user.role, permissions);
}

/**
 * Для страниц, доступных не всем ролям: без прав — на главную панели.
 * Server Actions проверяют права через authorizeAction() и возвращают ошибку.
 */
export async function requirePermission(permissions: Permissions): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(user, permissions)) redirect("/dashboard");
  return user;
}

/**
 * Для Server Actions: это публичные эндпоинты, поэтому права проверяются
 * в самом действии, а не только скрытием кнопок. Без входа — на страницу
 * входа, без прав — null (действие вернет сообщение об ошибке).
 */
export async function authorizeAction(permissions: Permissions): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return can(user, permissions) ? user : null;
}
