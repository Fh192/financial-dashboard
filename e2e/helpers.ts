import { type APIRequestContext, expect, type Page } from "@playwright/test";

// Тестовые учетные записи из db/seed.ts
export const USERS = {
  admin: { id: "10000000-0000-4000-8000-000000000001", email: "admin@example.com", password: "Admin123!", name: "Администратор" },
  manager: { id: "10000000-0000-4000-8000-000000000002", email: "manager@example.com", password: "Manager123!", name: "Менеджер" },
  viewer: { id: "10000000-0000-4000-8000-000000000003", email: "viewer@example.com", password: "Viewer123!", name: "Наблюдатель" },
} as const;

export type Role = keyof typeof USERS;

/** Файл с сохраненной сессией роли (создается в auth.setup.ts). */
export const storageState = (role: Role) => `e2e/.auth/${role}.json`;

/** Клиент из тестовых данных, у которого есть счета. */
export const SEED_CUSTOMER = { id: "20000000-0000-4000-8000-000000000002", name: "АО «ТехноСфера»" };

/** Уникальный суффикс, чтобы параллельные и повторные запуски не пересекались по данным. */
export function unique(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Случайная сумма в долларах с центами — по ней удобно найти созданный счет. */
export function uniqueAmount(): { dollars: string; cents: number } {
  const cents = 100_000 + Math.floor(Math.random() * 800_000);
  return { dollars: (cents / 100).toFixed(2), cents };
}

/** Bearer-токен для REST API: вход через Better Auth, токен в заголовке set-auth-token. */
export async function apiToken(request: APIRequestContext, role: Role): Promise<string> {
  const { email, password } = USERS[role];
  const response = await request.post("/api/auth/sign-in/email", { data: { email, password } });
  const token = response.headers()["set-auth-token"];
  if (!response.ok() || !token) throw new Error(`Не удалось войти как ${role}: HTTP ${response.status()}`);
  return token;
}

/**
 * Поиск в списке. Поле отправляет запрос с задержкой 300 мс, поэтому ждем,
 * пока запрос попадет в адрес страницы: иначе отложенный переход на список
 * перебьет клик по строке, сделанный раньше.
 */
export async function search(page: Page, text: string) {
  await page.getByTestId("search-input").fill(text);
  await expect(page).toHaveURL((url) => url.searchParams.get("query") === text);
}
