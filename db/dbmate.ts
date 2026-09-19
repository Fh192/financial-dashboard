/**
 * Запуск dbmate с поправкой строки подключения. В строках Neon есть параметр
 * channel_binding=require, а драйвер dbmate (lib/pq) передает незнакомые
 * параметры серверу, и тот отвечает ошибкой «unrecognized configuration parameter».
 * Обертка убирает этот параметр и передает остальные аргументы dbmate как есть.
 *
 *   pnpm db:migrate  →  tsx db/dbmate.ts --no-dump-schema up
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { requireEnv } from "./lib";

const url = new URL(requireEnv("DATABASE_URL"));
url.searchParams.delete("channel_binding");

const cli = createRequire(import.meta.url).resolve("dbmate/dist/cli.js");
const { status } = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: url.toString() },
});
process.exit(status ?? 1);
