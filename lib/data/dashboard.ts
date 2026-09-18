import "server-only";
import { requirePermission } from "@/lib/dal";
import { pool } from "@/lib/db";
import type { DashboardSummary, LatestInvoice, RevenuePoint } from "@/lib/definitions";
import type { Permissions } from "@/lib/permissions";

// Каждая функция сама проверяет права: данные защищены, даже если
// функцию вызовут со страницы, которая забыла это сделать.
const canReadDashboard: Permissions = { invoice: ["read"], customer: ["read"] };

// pg возвращает bigint и numeric строками (чтобы не терять точность),
// поэтому суммы приводим к числу явно: в центах они далеки от 2^53.

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  await requirePermission(canReadDashboard);

  const { rows } = await pool.query<{ paid: string; pending: string; invoice_count: number; customer_count: number }>(`
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0)    AS paid,
      COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) AS pending,
      COUNT(*)::int                                             AS invoice_count,
      (SELECT COUNT(*)::int FROM customers)                     AS customer_count
    FROM invoices
  `);
  const [row] = rows;

  return {
    paid: Number(row.paid),
    pending: Number(row.pending),
    invoiceCount: row.invoice_count,
    customerCount: row.customer_count,
  };
}

export async function fetchRevenue(): Promise<RevenuePoint[]> {
  await requirePermission(canReadDashboard);

  // Представление revenue уже содержит все 12 месяцев, включая месяцы без оплат
  const { rows } = await pool.query<{ month: string; revenue: string }>(`
    SELECT to_char(month, 'YYYY-MM-DD') AS month, revenue
    FROM revenue
    ORDER BY month
  `);
  return rows.map((r) => ({ month: r.month, revenue: Number(r.revenue) }));
}

export async function fetchLatestInvoices(limit = 5): Promise<LatestInvoice[]> {
  await requirePermission(canReadDashboard);

  const { rows } = await pool.query<LatestInvoice>(
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
    ORDER BY i.date DESC, i.created_at DESC
    LIMIT $1
    `,
    [limit],
  );
  return rows;
}
