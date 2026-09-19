import { apiRoute, pagination, readJson, readQuery, requireApiUser } from "@/lib/api/http";
import { toApiInvoice } from "@/lib/api/mappers";
import { InvoiceCreateSchema, ListQuerySchema } from "@/lib/api/schemas";
import { moscowToday } from "@/lib/cbr/convert";
import { fetchInvoiceRowById, fetchInvoicesPage } from "@/lib/data/invoices";
import { insertInvoice } from "@/lib/services/invoices";

// GET /api/v1/invoices — список счетов с поиском и пагинацией
export const GET = apiRoute(async (request) => {
  await requireApiUser({ invoice: ["read"] });
  const { query, page, pageSize } = readQuery(request, ListQuerySchema);

  const { items, total } = await fetchInvoicesPage(query ?? "", page, pageSize);
  return Response.json({ data: items.map(toApiInvoice), pagination: pagination(page, pageSize, total) });
});

// POST /api/v1/invoices — создать счет
export const POST = apiRoute(async (request) => {
  const user = await requireApiUser({ invoice: ["create"] });
  const body = await readJson(request, InvoiceCreateSchema);

  const id = await insertInvoice(user.id, {
    customerId: body.customerId,
    amount: body.amountCents,
    status: body.status,
    date: body.date ?? moscowToday(),
  });
  const created = await fetchInvoiceRowById(id);
  return Response.json(toApiInvoice(created!), { status: 201, headers: { Location: `/api/v1/invoices/${id}` } });
});
