import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, roles } from "@/lib/permissions";

// Клиент Better Auth для браузера. Базовый адрес берется из текущего origin.
export const authClient = createAuthClient({
  plugins: [adminClient({ ac, roles })],
});
