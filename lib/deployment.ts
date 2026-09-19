// Адрес приложения для Better Auth: от него зависят ссылки и проверка Origin
// при входе. Порядок: явный BETTER_AUTH_URL → системные переменные Vercel.
// https://vercel.com/docs/environment-variables/system-environment-variables

type Env = Record<string, string | undefined>;

const https = (host: string | undefined) => (host ? `https://${host.replace(/^https?:\/\//, "")}` : undefined);

/** Базовый адрес приложения; undefined — Better Auth возьмет его из запроса. */
export function resolveBaseUrl(env: Env): string | undefined {
  if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL;
  // В продакшене — постоянный домен проекта, в preview — адрес конкретного деплоя
  if (env.VERCEL_ENV === "production") return https(env.VERCEL_PROJECT_PRODUCTION_URL) ?? https(env.VERCEL_URL);
  return https(env.VERCEL_URL);
}

/**
 * Дополнительные доверенные адреса: у деплоя Vercel их несколько (постоянный
 * домен, адрес ветки, адрес деплоя), и вход должен работать с любого из них.
 */
export function vercelTrustedOrigins(env: Env): string[] {
  const origins = [env.VERCEL_PROJECT_PRODUCTION_URL, env.VERCEL_BRANCH_URL, env.VERCEL_URL].map(https);
  return [...new Set(origins.filter((o): o is string => Boolean(o)))];
}
