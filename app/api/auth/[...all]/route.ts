import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// Все эндпоинты Better Auth: вход, выход, сессия, управление пользователями
export const { GET, POST } = toNextJsHandler(auth);
