import { z } from "zod";
import { ROLES } from "@/lib/permissions";

// Проверка форм управления пользователями. Длина пароля совпадает
// с настройками Better Auth (lib/auth.ts: minPasswordLength и лимит 128).

const password = z
  .string({ error: "Введите пароль" })
  .min(8, { error: "Не короче 8 символов" })
  .max(128, { error: "Не длиннее 128 символов" });

const role = z.enum(ROLES, { error: "Выберите роль" });

export const createUserSchema = z.object({
  name: z
    .string({ error: "Введите имя" })
    .trim()
    .min(1, { error: "Введите имя" })
    .max(255, { error: "Не длиннее 255 символов" }),
  email: z
    .string({ error: "Введите почту" })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Некорректный адрес почты" })),
  password,
  role,
});

export const setPasswordSchema = z.object({ password });

export const roleSchema = role;

/** Срок блокировки: значение из формы → секунды (undefined — бессрочно). */
export const BAN_DURATIONS = {
  "1d": { label: "1 день", seconds: 60 * 60 * 24 },
  "7d": { label: "7 дней", seconds: 60 * 60 * 24 * 7 },
  "30d": { label: "30 дней", seconds: 60 * 60 * 24 * 30 },
  forever: { label: "Бессрочно", seconds: undefined },
} as const;

export const banSchema = z.object({
  reason: z.string().trim().max(200, { error: "Не длиннее 200 символов" }),
  duration: z.enum(Object.keys(BAN_DURATIONS) as (keyof typeof BAN_DURATIONS)[], { error: "Выберите срок" }),
});

export type CreateUserField = keyof z.input<typeof createUserSchema>;

export function parseCreateUserForm(formData: FormData) {
  return createUserSchema.safeParse({
    name: formData.get("name") ?? undefined,
    email: formData.get("email") ?? undefined,
    password: formData.get("password") ?? undefined,
    role: formData.get("role") ?? undefined,
  });
}
