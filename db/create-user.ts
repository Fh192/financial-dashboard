/**
 * Создает (или обновляет пароль) пользователя PostgreSQL с правом входа
 * и включает его в групповую роль из миграции 20260918120700_create_app_roles.
 *
 *   pnpm db:create-user               — dashboard_app_user    (роль dashboard_app)
 *   pnpm db:create-user --readonly    — dashboard_report_user (роль dashboard_readonly)
 *   pnpm db:create-user --name my_app — другое имя пользователя
 *
 * Пароль берется из DB_USER_PASSWORD или генерируется. Скрипт печатает строку
 * подключения: ее нужно сохранить в POSTGRES_URL (.env и Vercel).
 */
import { randomBytes } from "node:crypto";
import { connect, flagValue, hasFlag, requireEnv, transaction } from "./lib";

async function main() {
  const ownerUrl = requireEnv("DATABASE_URL");
  const readonly = hasFlag("--readonly");
  const groupRole = readonly ? "dashboard_readonly" : "dashboard_app";
  const name = flagValue("--name") ?? (readonly ? "dashboard_report_user" : "dashboard_app_user");
  const password = process.env.DB_USER_PASSWORD || randomBytes(24).toString("base64url");

  const client = await connect(ownerUrl);
  try {
    const roleExists = async (role: string) =>
      (await client.query("SELECT 1 FROM pg_roles WHERE rolname = $1", [role])).rowCount === 1;

    if (!(await roleExists(groupRole))) {
      throw new Error(`Роль ${groupRole} не найдена. Сначала примените миграции: pnpm db:migrate`);
    }
    const existing = await roleExists(name);

    // CREATE/ALTER ROLE не принимают параметры запроса, поэтому текст команды
    // собирает сам PostgreSQL через format(): %I и %L экранируют имя и пароль.
    const {
      rows: [{ ddl, grant }],
    } = await client.query<{ ddl: string; grant: string }>(
      `SELECT format($1, $2::text, $3::text) AS ddl, format('GRANT %I TO %I', $4::text, $2::text) AS grant`,
      [
        existing ? "ALTER ROLE %I WITH LOGIN PASSWORD %L" : "CREATE ROLE %I WITH LOGIN PASSWORD %L",
        name,
        password,
        groupRole,
      ],
    );

    await transaction(client, async () => {
      await client.query(ddl);
      await client.query(grant);
    });

    const appUrl = new URL(ownerUrl);
    appUrl.username = name;
    appUrl.password = password;

    console.log(`${existing ? "Пароль обновлен" : "Создан пользователь"}: ${name} (роль ${groupRole})`);
    console.log(`\nСтрока подключения (сохраните в ${readonly ? "надежном месте" : "POSTGRES_URL"}):\n${appUrl}`);
    if (appUrl.hostname.endsWith(".neon.tech") && !appUrl.hostname.includes("-pooler")) {
      console.log("\nДля Vercel лучше адрес пулера: добавьте -pooler к первой части хоста (ep-xxx → ep-xxx-pooler).");
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
