"use server";

import { isAPIError } from "better-auth/api";
import { refresh, revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type ActionResult, FORBIDDEN, type FormState, formValues } from "@/lib/actions/types";
import { auth } from "@/lib/auth";
import { adminErrorMessage } from "@/lib/auth-errors";
import { authorizeAction } from "@/lib/dal";
import type { Permissions } from "@/lib/permissions";
import {
  BAN_DURATIONS,
  banSchema,
  type CreateUserField,
  parseCreateUserForm,
  roleSchema,
  setPasswordSchema,
} from "@/lib/validation/user";

// Изменения пользователей идут через API плагина admin из Better Auth:
// он хеширует пароли, отзывает сессии при блокировке и сам еще раз
// проверяет права по сессии. Наша проверка — чтобы вернуть понятную ошибку.

export type CreateUserFormState = FormState<CreateUserField>;

// Пароль в форму не возвращаем: он не должен лишний раз уходить в браузер
const RETURNED_FIELDS: CreateUserField[] = ["name", "email", "role"];

type AdminCall = (requestHeaders: Headers) => Promise<unknown>;

/**
 * Общая обертка действий над существующим пользователем.
 * selfMessage — запрет на действие над своей учетной записью: администратор
 * не должен случайно лишить себя доступа (сменить себе роль, заблокироваться).
 */
async function runAdminAction(
  permissions: Permissions,
  userId: string,
  call: AdminCall,
  selfMessage?: string,
): Promise<ActionResult> {
  const actor = await authorizeAction(permissions);
  if (!actor) return { ok: false, message: FORBIDDEN };
  if (!z.uuid().safeParse(userId).success) return { ok: false, message: "Пользователь не найден." };
  if (selfMessage && userId === actor.id) return { ok: false, message: selfMessage };

  try {
    await call(await headers());
  } catch (error) {
    if (isAPIError(error)) return { ok: false, message: adminErrorMessage(error.body) };
    console.error("admin action", error);
    return { ok: false, message: "Не удалось выполнить действие. Попробуйте еще раз." };
  }

  refresh();
  return { ok: true };
}

export async function createUser(_prev: CreateUserFormState, formData: FormData): Promise<CreateUserFormState> {
  const values = formValues(formData, RETURNED_FIELDS);

  if (!(await authorizeAction({ user: ["create"] }))) return { message: FORBIDDEN, errors: {}, values };

  const parsed = parseCreateUserForm(formData);
  if (!parsed.success) {
    return { message: "Проверьте поля формы.", errors: z.flattenError(parsed.error).fieldErrors, values };
  }
  const { name, email, password, role } = parsed.data;

  try {
    await auth.api.createUser({ body: { name, email, password, role }, headers: await headers() });
  } catch (error) {
    if (isAPIError(error)) {
      const message = adminErrorMessage(error.body);
      const emailTaken = error.body?.code?.startsWith("USER_ALREADY_EXISTS");
      return emailTaken ? { message: null, errors: { email: [message] }, values } : { message, errors: {}, values };
    }
    console.error("createUser", error);
    return { message: "Не удалось создать пользователя. Попробуйте еще раз.", errors: {}, values };
  }

  revalidatePath("/dashboard/users");
  redirect("/dashboard/users");
}

export async function setUserRole(userId: string, role: string): Promise<ActionResult> {
  const parsed = roleSchema.safeParse(role);
  if (!parsed.success) return { ok: false, message: "Такой роли нет." };

  return runAdminAction(
    { user: ["set-role"] },
    userId,
    (h) => auth.api.setRole({ body: { userId, role: parsed.data }, headers: h }),
    "Нельзя изменить собственную роль.",
  );
}

export async function banUser(userId: string, input: { reason: string; duration: string }): Promise<ActionResult> {
  const parsed = banSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: z.flattenError(parsed.error).fieldErrors.reason?.[0] ?? "Проверьте поля." };
  const { reason, duration } = parsed.data;

  // Блокировка сразу завершает все сессии пользователя
  return runAdminAction(
    { user: ["ban"] },
    userId,
    (h) =>
      auth.api.banUser({
        body: { userId, banReason: reason || undefined, banExpiresIn: BAN_DURATIONS[duration].seconds },
        headers: h,
      }),
    "Нельзя заблокировать самого себя.",
  );
}

export async function unbanUser(userId: string): Promise<ActionResult> {
  return runAdminAction({ user: ["ban"] }, userId, (h) => auth.api.unbanUser({ body: { userId }, headers: h }));
}

export async function setUserPassword(userId: string, password: string): Promise<ActionResult> {
  const parsed = setPasswordSchema.safeParse({ password });
  if (!parsed.success) return { ok: false, message: z.flattenError(parsed.error).fieldErrors.password?.[0] ?? "Проверьте пароль." };

  return runAdminAction({ user: ["set-password"], session: ["revoke"] }, userId, async (h) => {
    await auth.api.setUserPassword({ body: { userId, newPassword: parsed.data.password }, headers: h });
    // После смены пароля старые сессии больше не должны работать
    await auth.api.revokeUserSessions({ body: { userId }, headers: h });
  }, "Сменить пароль своей учетной записи здесь нельзя: после смены завершились бы все ваши сеансы.");
}

export async function revokeUserSessions(userId: string): Promise<ActionResult> {
  return runAdminAction(
    { session: ["revoke"] },
    userId,
    (h) => auth.api.revokeUserSessions({ body: { userId }, headers: h }),
    "Чтобы завершить свой сеанс, используйте «Выйти».",
  );
}

export async function removeUser(userId: string): Promise<ActionResult> {
  // Сессии и способы входа удалятся каскадно, в журнале статусов автор станет NULL
  return runAdminAction(
    { user: ["delete"] },
    userId,
    (h) => auth.api.removeUser({ body: { userId }, headers: h }),
    "Нельзя удалить самого себя.",
  );
}
