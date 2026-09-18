import { spawnSync } from "node:child_process";
import path from "node:path";
import { Client } from "pg";

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Переменная окружения ${name} не задана (см. .env.example).`);
    process.exit(1);
  }
  return value;
}

/** Подключение одним клиентом: скрипты выполняются последовательно. */
export async function connect(url: string): Promise<Client> {
  const client = new Client({ connectionString: url });
  await client.connect();
  return client;
}

/** Выполняет fn в транзакции: при ошибке все изменения откатываются. */
export async function transaction<T>(client: Client, fn: () => Promise<T>): Promise<T> {
  await client.query("BEGIN");
  try {
    const result = await fn();
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export function hasFlag(flag: string): boolean {
  return process.argv.slice(2).includes(flag);
}

export function flagValue(flag: string): string | undefined {
  const args = process.argv.slice(2);
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

export function positionalArgs(): string[] {
  return process.argv.slice(2).filter((a) => !a.startsWith("--"));
}

const PG_IMAGE = process.env.PG_IMAGE ?? "postgres:17-alpine";

function hasLocalTool(tool: string): boolean {
  return spawnSync(tool, ["--version"], { stdio: "ignore" }).status === 0;
}

/**
 * Запускает pg_dump / pg_restore. Если утилит нет в PATH, запускает их
 * в Docker-образе PostgreSQL, пробрасывая каталог с файлом бэкапа в /work.
 */
export function runPgTool(tool: "pg_dump" | "pg_restore", url: string, args: string[], dir: string): number {
  if (hasLocalTool(tool)) {
    const local = args.map((a) => a.replaceAll("{dir}", dir));
    return spawnSync(tool, [...local, `--dbname=${url}`], { stdio: "inherit" }).status ?? 1;
  }

  // Из контейнера localhost — это сам контейнер, а база на хосте
  const u = new URL(url);
  if (["localhost", "127.0.0.1", "::1"].includes(u.hostname)) u.hostname = "host.docker.internal";

  const inDocker = args.map((a) => a.replaceAll("{dir}", "/work"));
  console.log(`${tool} не найден в PATH, запускаю через Docker (${PG_IMAGE})`);
  return (
    spawnSync(
      "docker",
      ["run", "--rm", "-v", `${path.resolve(dir)}:/work`, PG_IMAGE, tool, ...inDocker, `--dbname=${u.toString()}`],
      { stdio: "inherit" },
    ).status ?? 1
  );
}
