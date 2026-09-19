import { expect, test as setup } from "@playwright/test";
import { type Role, storageState, USERS } from "./helpers";

// Входим под каждой ролью через API Better Auth и сохраняем cookie сессии:
// тесты подключают нужную роль через test.use({ storageState }).
for (const role of Object.keys(USERS) as Role[]) {
  setup(`вход: ${role}`, async ({ request }) => {
    const { email, password } = USERS[role];
    const response = await request.post("/api/auth/sign-in/email", { data: { email, password } });
    expect(response.ok(), `вход ${email}: HTTP ${response.status()}`).toBeTruthy();
    await request.storageState({ path: storageState(role) });
  });
}
