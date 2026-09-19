import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin, bearer } from "better-auth/plugins";
import { pool } from "@/lib/db";
import { resolveBaseUrl, vercelTrustedOrigins } from "@/lib/deployment";
import { ac, DEFAULT_ROLE, roles } from "@/lib/permissions";

// Better Auth по умолчанию ждет таблицы user/session/account/verification с полями
// в camelCase. У нас таблицы во множественном числе и snake_case, как и остальная
// схема: соответствие задается через modelName и fields (см. миграцию better_auth).
const timestamps = { createdAt: "created_at", updatedAt: "updated_at" };

export const auth = betterAuth({
  appName: "Financial Dashboard",
  database: pool,
  baseURL: resolveBaseUrl(process.env),
  trustedOrigins: vercelTrustedOrigins(process.env),

  emailAndPassword: {
    enabled: true,
    // Самостоятельной регистрации нет: пользователей заводит администратор
    disableSignUp: true,
    minPasswordLength: 8,
  },

  user: {
    modelName: "users",
    fields: { emailVerified: "email_verified", ...timestamps },
  },
  session: {
    modelName: "sessions",
    fields: {
      userId: "user_id",
      expiresAt: "expires_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      ...timestamps,
    },
  },
  account: {
    modelName: "accounts",
    fields: {
      userId: "user_id",
      accountId: "account_id",
      providerId: "provider_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      idToken: "id_token",
      ...timestamps,
    },
  },
  verification: {
    modelName: "verifications",
    fields: { expiresAt: "expires_at", ...timestamps },
  },

  // Счетчики попыток храним в БД: на Vercel у каждой функции своя память
  rateLimit: {
    // По умолчанию Better Auth включает лимит в продакшене и выключает в dev.
    // AUTH_RATE_LIMIT=off выставляется только в CI для e2e-тестов: все запросы
    // Playwright идут с одного IP и упирались бы в лимит попыток входа.
    enabled: process.env.AUTH_RATE_LIMIT === "off" ? false : undefined,
    storage: "database",
    modelName: "rate_limits",
    fields: { lastRequest: "last_request" },
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
    },
  },

  advanced: {
    database: {
      // id генерирует PostgreSQL: DEFAULT gen_random_uuid()
      generateId: "uuid",
    },
    // IP клиента для лимита попыток входа. На Vercel заголовок x-real-ip
    // выставляет сама платформа, подделать его нельзя. Вне Vercel ему не
    // доверяем: без прокси его может прислать любой клиент.
    ...(process.env.VERCEL && { ipAddress: { ipAddressHeaders: ["x-real-ip"] } }),
  },

  plugins: [
    adminPlugin({
      ac,
      roles,
      defaultRole: DEFAULT_ROLE,
      adminRoles: ["admin"],
      bannedUserMessage: "Учетная запись заблокирована. Обратитесь к администратору.",
      schema: {
        user: { fields: { banReason: "ban_reason", banExpires: "ban_expires" } },
        session: { fields: { impersonatedBy: "impersonated_by" } },
      },
    }),
    // REST API для внешних клиентов (Postman, curl): токен сессии из заголовка
    // set-auth-token ответа на вход передается как Authorization: Bearer <токен>
    bearer(),
    // Должен быть последним: выставляет cookie из Server Actions
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
