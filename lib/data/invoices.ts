import "server-only";
import { z } from "zod";
import { requirePermission } from "@/lib/dal";
import { pool } from "@/lib/db";
import type { InvoiceStatus } from "@/lib/definitions";
import { containsPattern } from "@/lib/search";

export const INVOICES_PER_PAGE = 8;

export type InvoiceRow = {
  id: string;
  amount: number;
  status: InvoiceStatus;
  date: string;
  customerName: string;
  customerEmail: string;
  customerImageUrl: string | null;
};

export type InvoiceForm = {
  id: string;
  customerId: string;
  amount: number;
  status: InvoiceStatus;
  date: string;
};

export type CustomerOption = { id: string; name: string };

export type StatusChange = {
  id: string;
  oldStatus: InvoiceStatus | null;
  newStatus: InvoiceStatus;
  changedBy: string | null;
  changedAt: string;
};

// Поиск по клиенту, почте, сумме («1500» найдет 1500,00 $), дате в формате
// ДД.ММ.ГГГГ и статусу по-русски. Имя и почту ищут триграммные индексы.
const SEARCH_CONDITION = `
  c.name ILIKE $1
  OR c.email ILIKE $1
  OR to_char(i.amount / 100.0, 'FM9999999990.00') ILIKE $1
  OR to_char(i.date, 'DD.MM.YYYY') ILIKE $1
  OR (CASE i.status WHEN 'paid' THEN 'оплачен' ELSE 'ожидает' END) ILIKE $1
`;

export async function fetchFilteredInvoices(query: string, page: number): Promise<InvoiceRow[]> {
  await requirePermission({ invoice: ["read"] });

  const { rows } = await pool.query<InvoiceRow>(
    `
    SELECT
      i.id,
      i.amount,
      i.status,
      to_char(i.date, 'YYYY-MM-DD') AS date,
      c.name      AS "customerName",
      c.email     AS "customerEmail",
      c.image_url AS "customerImageUrl"
    FROM invoices i
    JOIN customers c ON c.id = i.customer_id
    WHERE ${SEARCH_CONDITION}
    ORDER BY i.date DESC, i.created_at DESC
    LIMIT $2 OFFSET $3
    `,
    [containsPattern(query), INVOICES_PER_PAGE, (page - 1) * INVOICES_PER_PAGE],
  );
  return rows;
}

export async function fetchInvoicesPages(query: string): Promise<number> {
  await requirePermission({ invoice: ["read"] });

  const { rows } = await pool.query<{ count: number }>(
    `
    SELECT COUNT(*)::int AS count
    FROM invoices i
    JOIN customers c ON c.id = i.customer_id
    WHERE ${SEARCH_CONDITION}
    `,
    [containsPattern(query)],
  );
  return Math.ceil(rows[0].count / INVOICES_PER_PAGE);
}

export async function fetchInvoiceById(id: string): Promise<InvoiceForm | null> {
  await requirePermission({ invoice: ["read"] });
  // Невалидный uuid PostgreSQL отверг бы с ошибкой — для пользователя это «не найдено»
  if (!z.uuid().safeParse(id).success) return null;

  const { rows } = await pool.query<InvoiceForm>(
    `
    SELECT id, customer_id AS "customerId", amount, status, to_char(date, 'YYYY-MM-DD') AS date
    FROM invoices
    WHERE id = $1
    `,
    [id],
  );
  return rows[0] ?? null;
}

export async function fetchCustomerOptions(): Promise<CustomerOption[]> {
  await requirePermission({ customer: ["read"] });

  const { rows } = await pool.query<CustomerOption>("SELECT id, name FROM customers ORDER BY name");
  return rows;
}

export async function fetchInvoiceHistory(invoiceId: string): Promise<StatusChange[]> {
  await requirePermission({ invoice: ["read"] });
  if (!z.uuid().safeParse(invoiceId).success) return [];

  const { rows } = await pool.query<StatusChange>(
    `
    SELECT
      h.id::text,
      h.old_status AS "oldStatus",
      h.new_status AS "newStatus",
      u.name       AS "changedBy",
      to_char(h.changed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "changedAt"
    FROM invoice_status_history h
    LEFT JOIN users u ON u.id = h.changed_by
    WHERE h.invoice_id = $1
    ORDER BY h.changed_at DESC, h.id DESC
    `,
    [invoiceId],
  );
  return rows;
}
