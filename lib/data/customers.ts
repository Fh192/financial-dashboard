import "server-only";
import { z } from "zod";
import { MAX_EXPORT_ROWS } from "@/lib/csv";
import { requirePermission } from "@/lib/dal";
import { pool } from "@/lib/db";
import { containsPattern } from "@/lib/search";

export const CUSTOMERS_PER_PAGE = 8;

export type CustomerRow = {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  invoiceCount: number;
  paid: number;
  pending: number;
};

export type CustomerForm = {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
};

// Поиск по имени и почте — оба поля покрыты триграммными GIN-индексами
const SEARCH_CONDITION = "c.name ILIKE $1 OR c.email ILIKE $1";

export async function fetchFilteredCustomers(query: string, page: number): Promise<CustomerRow[]> {
  await requirePermission({ customer: ["read"] });
  return selectCustomers(query, CUSTOMERS_PER_PAGE, (page - 1) * CUSTOMERS_PER_PAGE);
}

/** Все клиенты по запросу с суммами по счетам — для выгрузки в CSV. */
export async function fetchCustomersForExport(query: string): Promise<CustomerRow[]> {
  await requirePermission({ customer: ["read"], report: ["export"] });
  return selectCustomers(query, MAX_EXPORT_ROWS, 0);
}

/** Страница клиентов и общее число найденных — для REST API. */
export async function fetchCustomersPage(
  query: string,
  page: number,
  pageSize: number,
): Promise<{ items: CustomerRow[]; total: number }> {
  await requirePermission({ customer: ["read"] });
  const [items, total] = await Promise.all([
    selectCustomers(query, pageSize, (page - 1) * pageSize),
    countCustomers(query),
  ]);
  return { items, total };
}

/** Клиент с суммами по счетам — для REST API. null, если не найден. */
export async function fetchCustomerRowById(id: string): Promise<CustomerRow | null> {
  await requirePermission({ customer: ["read"] });
  if (!z.uuid().safeParse(id).success) return null;
  const [row] = await selectCustomers("", 1, 0, id);
  return row ?? null;
}

async function selectCustomers(query: string, limit: number, offset: number, id?: string): Promise<CustomerRow[]> {
  // Суммы по счетам считаем в подзапросе, чтобы LIMIT применялся к клиентам,
  // а не к строкам соединения с invoices
  const { rows } = await pool.query<Omit<CustomerRow, "paid" | "pending"> & { paid: string; pending: string }>(
    `
    SELECT
      c.id,
      c.name,
      c.email,
      c.image_url AS "imageUrl",
      COALESCE(t.invoice_count, 0)::int AS "invoiceCount",
      COALESCE(t.paid, 0)               AS paid,
      COALESCE(t.pending, 0)            AS pending
    FROM customers c
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)                                       AS invoice_count,
        SUM(i.amount) FILTER (WHERE i.status = 'paid')    AS paid,
        SUM(i.amount) FILTER (WHERE i.status = 'pending') AS pending
      FROM invoices i
      WHERE i.customer_id = c.id
    ) t ON true
    WHERE (${SEARCH_CONDITION}) AND ($4::uuid IS NULL OR c.id = $4)
    ORDER BY c.name
    LIMIT $2 OFFSET $3
    `,
    [containsPattern(query), limit, offset, id ?? null],
  );
  return rows.map((r) => ({ ...r, paid: Number(r.paid), pending: Number(r.pending) }));
}

export async function fetchCustomersPages(query: string): Promise<number> {
  await requirePermission({ customer: ["read"] });
  return Math.ceil((await countCustomers(query)) / CUSTOMERS_PER_PAGE);
}

async function countCustomers(query: string): Promise<number> {
  const { rows } = await pool.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM customers c WHERE ${SEARCH_CONDITION}`,
    [containsPattern(query)],
  );
  return rows[0].count;
}

export async function fetchCustomerById(id: string): Promise<CustomerForm | null> {
  await requirePermission({ customer: ["read"] });
  if (!z.uuid().safeParse(id).success) return null;

  const { rows } = await pool.query<CustomerForm>(
    `SELECT id, name, email, image_url AS "imageUrl" FROM customers WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}
