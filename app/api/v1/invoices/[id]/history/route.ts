import { apiRoute, notFound, parseId, requireApiUser } from "@/lib/api/http";
import { fetchInvoiceById, fetchInvoiceHistory } from "@/lib/data/invoices";

const NOT_FOUND = "Счет не найден.";

// GET /api/v1/invoices/{id}/history — журнал смены статуса (пишет триггер БД)
export const GET = apiRoute(async (_request, ctx: RouteContext<"/api/v1/invoices/[id]/history">) => {
  await requireApiUser({ invoice: ["read"] });
  const id = parseId((await ctx.params).id, NOT_FOUND);

  if (!(await fetchInvoiceById(id))) notFound(NOT_FOUND);
  const history = await fetchInvoiceHistory(id);
  return Response.json({
    data: history.map(({ oldStatus, newStatus, changedBy, changedAt }) => ({ oldStatus, newStatus, changedBy, changedAt })),
  });
});
