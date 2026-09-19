import { apiRoute, notFound, parseId, readJson, requireApiUser } from "@/lib/api/http";
import { toApiInvoice } from "@/lib/api/mappers";
import { InvoiceUpdateSchema } from "@/lib/api/schemas";
import { fetchInvoiceById, fetchInvoiceRowById } from "@/lib/data/invoices";
import { deleteInvoiceById, updateInvoiceById } from "@/lib/services/invoices";

type Ctx = RouteContext<"/api/v1/invoices/[id]">;
const NOT_FOUND = "Счет не найден.";

// GET /api/v1/invoices/{id}
export const GET = apiRoute(async (_request, ctx: Ctx) => {
  await requireApiUser({ invoice: ["read"] });
  const id = parseId((await ctx.params).id, NOT_FOUND);

  const invoice = await fetchInvoiceRowById(id);
  if (!invoice) notFound(NOT_FOUND);
  return Response.json(toApiInvoice(invoice));
});

// PATCH /api/v1/invoices/{id} — меняются только переданные поля
export const PATCH = apiRoute(async (request, ctx: Ctx) => {
  const user = await requireApiUser({ invoice: ["update"] });
  const id = parseId((await ctx.params).id, NOT_FOUND);
  const patch = await readJson(request, InvoiceUpdateSchema);

  const current = await fetchInvoiceById(id);
  if (!current) notFound(NOT_FOUND);

  await updateInvoiceById(user.id, id, {
    customerId: patch.customerId ?? current.customerId,
    amount: patch.amountCents ?? current.amount,
    status: patch.status ?? current.status,
    date: patch.date ?? current.date,
  });
  return Response.json(toApiInvoice((await fetchInvoiceRowById(id))!));
});

// DELETE /api/v1/invoices/{id}
export const DELETE = apiRoute(async (_request, ctx: Ctx) => {
  const user = await requireApiUser({ invoice: ["delete"] });
  const id = parseId((await ctx.params).id, NOT_FOUND);

  await deleteInvoiceById(user.id, id);
  return new Response(null, { status: 204 });
});
