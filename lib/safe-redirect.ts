const FALLBACK = "/dashboard";

/**
 * Куда вернуть пользователя после входа. Разрешены только пути внутри
 * приложения: иначе ссылка вида /login?from=https://evil.example
 * уводила бы пользователя на чужой сайт (open redirect).
 */
export function safeRedirectPath(from: string | null | undefined): string {
  if (!from || !from.startsWith("/") || from.startsWith("//") || from.startsWith("/\\")) {
    return FALLBACK;
  }
  if (from === "/login" || from.startsWith("/login?") || from.startsWith("/api/")) {
    return FALLBACK;
  }
  return from;
}
