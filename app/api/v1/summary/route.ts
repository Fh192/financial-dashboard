import { apiRoute, requireApiUser } from "@/lib/api/http";
import { fetchDashboardSummary, fetchRevenue } from "@/lib/data/dashboard";

// GET /api/v1/summary — показатели панели: суммы, количество, выручка по месяцам
export const GET = apiRoute(async () => {
  await requireApiUser({ invoice: ["read"], customer: ["read"] });
  const [summary, revenue] = await Promise.all([fetchDashboardSummary(), fetchRevenue()]);

  return Response.json({
    paidCents: summary.paid,
    pendingCents: summary.pending,
    invoiceCount: summary.invoiceCount,
    customerCount: summary.customerCount,
    revenue: revenue.map((r) => ({ month: r.month, revenueCents: r.revenue })),
  });
});
