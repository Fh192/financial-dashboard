/**
 * Восстановление базы из резервной копии pg_dump.
 * Существующие объекты удаляются и создаются заново, всё в одной транзакции:
 * при ошибке база остается в прежнем состоянии.
 *
 *   pnpm db:restore backups/<файл>.dump --yes
 *
 * Роли dashboard_app и dashboard_readonly должны уже существовать в кластере,
 * иначе не восстановятся права (GRANT).
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { hasFlag, positionalArgs, requireEnv, runPgTool } from "./lib";

const url = requireEnv("DATABASE_URL");
const [file] = positionalArgs();

if (!file || !existsSync(file)) {
  console.error("Укажите файл резервной копии: pnpm db:restore backups/<файл>.dump --yes");
  process.exit(1);
}

if (!hasFlag("--yes")) {
  const u = new URL(url);
  console.error(
    `Восстановление перезапишет данные в базе ${u.pathname.slice(1)} на ${u.hostname}.\n` +
      "Если это то, что нужно, повторите команду с флагом --yes.",
  );
  process.exit(1);
}

const dir = path.dirname(path.resolve(file));
const status = runPgTool(
  "pg_restore",
  url,
  ["--clean", "--if-exists", "--no-owner", "--single-transaction", "--exit-on-error", `{dir}/${path.basename(file)}`],
  dir,
);

if (status !== 0) {
  console.error("Восстановление не выполнено, база не изменена");
  process.exit(status);
}
console.log(`База восстановлена из ${file}`);
