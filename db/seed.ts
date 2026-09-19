/**
 * Тестовые данные. Скрипт идемпотентен: у записей фиксированные id,
 * повторный запуск ничего не дублирует.
 *
 *   pnpm db:seed          — добавить недостающие данные
 *   pnpm db:seed --reset  — очистить таблицы и заполнить заново
 */
import { hashPassword } from "better-auth/crypto";
import { connect, hasFlag, requireEnv, transaction } from "./lib";

type Role = "admin" | "manager" | "viewer";

// Учетные записи для проверки; они же перечислены в README
const users: { id: string; name: string; email: string; password: string; role: Role }[] = [
  { id: "10000000-0000-4000-8000-000000000001", name: "Администратор", email: "admin@example.com", password: "Admin123!", role: "admin" },
  { id: "10000000-0000-4000-8000-000000000002", name: "Менеджер", email: "manager@example.com", password: "Manager123!", role: "manager" },
  { id: "10000000-0000-4000-8000-000000000003", name: "Наблюдатель", email: "viewer@example.com", password: "Viewer123!", role: "viewer" },
];

const customers: { id: string; name: string; email: string }[] = [
  ["ООО «Северный ветер»", "billing@sevveter.ru"],
  ["АО «ТехноСфера»", "finance@technosphere.ru"],
  ["ИП Смирнова А. В.", "smirnova.av@mail.ru"],
  ["ООО «Кофейня на углу»", "accounting@coffee-corner.ru"],
  ["ООО «Логистик Про»", "invoices@logisticpro.ru"],
  ["АО «Уральские станки»", "buh@uralstanki.ru"],
  ["ООО «Цифровые решения»", "pay@digisol.ru"],
  ["ИП Кузнецов Д. С.", "kuznetsov.ds@yandex.ru"],
  ["ООО «Зеленый дом»", "office@greenhouse-eco.ru"],
  ["ООО «Балтийская верфь»", "finance@baltverf.ru"],
].map(([name, email], i) => ({ id: seedId(2, i + 1), name, email }));

function seedId(prefix: number, n: number): string {
  return `${prefix}0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

// Детерминированный генератор, чтобы при каждом запуске получались одни и те же счета
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 3–6 счетов в каждом из последних 12 месяцев. Старые счета в основном оплачены,
// в текущем месяце часть еще ожидает оплаты.
function generateInvoices() {
  const rand = mulberry32(20260918);
  const today = new Date();
  const invoices: { id: string; customer_id: string; amount: number; date: string; paid: boolean }[] = [];

  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    const first = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1);
    const lastDay = monthsAgo === 0 ? today.getDate() : new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const count = 3 + Math.floor(rand() * 4);

    for (let k = 0; k < count; k++) {
      const date = new Date(first.getFullYear(), first.getMonth(), 1 + Math.floor(rand() * lastDay));
      invoices.push({
        id: seedId(3, invoices.length + 1),
        customer_id: customers[Math.floor(rand() * customers.length)].id,
        amount: (50 + Math.floor(rand() * 4950)) * 100, // от $50 до $5000, в центах
        date: toISODate(date),
        paid: rand() < (monthsAgo === 0 ? 0.4 : monthsAgo === 1 ? 0.7 : 0.9),
      });
    }
  }
  return invoices;
}

async function main() {
  const client = await connect(requireEnv("DATABASE_URL"));
  const reset = hasFlag("--reset");
  const invoices = generateInvoices();
  const manager = users.find((u) => u.role === "manager")!;

  try {
    await transaction(client, async () => {
      if (reset) {
        await client.query(`
          TRUNCATE invoice_status_history, invoices, customers,
                   sessions, accounts, verifications, rate_limits, users
          RESTART IDENTITY`);
        console.log("Таблицы очищены");
      }

      // Массовая вставка: массивы столбцов разворачиваются в строки через unnest
      const { rows: insertedUsers } = await client.query<{ id: string }>(
        `INSERT INTO users (id, name, email, role, email_verified)
         SELECT *, true FROM unnest($1::uuid[], $2::text[], $3::text[], $4::text[])
         ON CONFLICT (id) DO NOTHING
         RETURNING id`,
        [users.map((u) => u.id), users.map((u) => u.name), users.map((u) => u.email), users.map((u) => u.role)],
      );

      // Вход по почте и паролю в Better Auth — это запись в accounts
      // с provider_id = 'credential' и scrypt-хешем пароля
      const newUsers = users.filter((u) => insertedUsers.some((r) => r.id === u.id));
      const hashes = await Promise.all(newUsers.map((u) => hashPassword(u.password)));
      await client.query(
        `INSERT INTO accounts (user_id, account_id, provider_id, password)
         SELECT id, id::text, 'credential', hash FROM unnest($1::uuid[], $2::text[]) AS t(id, hash)
         ON CONFLICT (provider_id, account_id) DO NOTHING`,
        [newUsers.map((u) => u.id), hashes],
      );

      const { rowCount: customersAdded } = await client.query(
        `INSERT INTO customers (id, name, email)
         SELECT * FROM unnest($1::uuid[], $2::text[], $3::text[])
         ON CONFLICT (id) DO NOTHING`,
        [customers.map((c) => c.id), customers.map((c) => c.name), customers.map((c) => c.email)],
      );

      // Все счета создаются как pending, оплаченные затем переводятся в paid
      // от имени менеджера — так триггер заполняет журнал статусов
      const { rows: insertedInvoices } = await client.query<{ id: string }>(
        `INSERT INTO invoices (id, customer_id, amount, date)
         SELECT * FROM unnest($1::uuid[], $2::uuid[], $3::int[], $4::date[])
         ON CONFLICT (id) DO NOTHING
         RETURNING id`,
        [
          invoices.map((i) => i.id),
          invoices.map((i) => i.customer_id),
          invoices.map((i) => i.amount),
          invoices.map((i) => i.date),
        ],
      );

      const inserted = new Set(insertedInvoices.map((r) => r.id));
      const toPay = invoices.filter((i) => i.paid && inserted.has(i.id)).map((i) => i.id);
      if (toPay.length > 0) {
        await client.query("SELECT set_config('app.user_id', $1, true)", [manager.id]);
        await client.query("UPDATE invoices SET status = 'paid' WHERE id = ANY($1::uuid[])", [toPay]);
      }

      console.log(
        `Добавлено: пользователей ${insertedUsers.length}, клиентов ${customersAdded}, ` +
          `счетов ${insertedInvoices.length} (оплачено ${toPay.length})`,
      );
    });

    console.log("\nТестовые учетные записи:");
    console.table(users.map(({ email, password, role }) => ({ email, password, role })));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
