/**
 * Резервная копия базы в формате pg_dump custom (-Fc): сжатая, восстанавливается
 * через pg_restore целиком или выборочно.
 *
 *   pnpm db:backup  →  backups/<база>-<дата-время>.dump
 *
 * Роли кластера (dashboard_app и т.д.) в дамп не входят: их создают миграции.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { requireEnv, runPgTool } from "./lib";

const url = requireEnv("DATABASE_URL");
const dir = path.resolve("backups");
mkdirSync(dir, { recursive: true });

const database = new URL(url).pathname.slice(1) || "db";
const now = new Date();
const pad = (n: number) => String(n).padStart(2, "0");
const stamp =
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
  `_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
const file = `${database}-${stamp}.dump`;

const status = runPgTool("pg_dump", url, ["--format=custom", "--no-owner", `--file={dir}/${file}`], dir);

if (status !== 0) {
  console.error("Не удалось создать резервную копию");
  process.exit(status);
}
console.log(`Резервная копия: backups/${file}`);
