import { apiRoute, pagination, readJson, readQuery, requireApiUser } from "@/lib/api/http";
import { toApiCustomer } from "@/lib/api/mappers";
import { CustomerCreateSchema, ListQuerySchema } from "@/lib/api/schemas";
import { fetchCustomerRowById, fetchCustomersPage } from "@/lib/data/customers";
import { insertCustomer } from "@/lib/services/customers";

// GET /api/v1/customers — клиенты с суммами по счетам, поиск и пагинация
export const GET = apiRoute(async (request) => {
  await requireApiUser({ customer: ["read"] });
  const { query, page, pageSize } = readQuery(request, ListQuerySchema);

  const { items, total } = await fetchCustomersPage(query ?? "", page, pageSize);
  return Response.json({ data: items.map(toApiCustomer), pagination: pagination(page, pageSize, total) });
});

// POST /api/v1/customers — создать клиента
export const POST = apiRoute(async (request) => {
  await requireApiUser({ customer: ["create"] });
  const body = await readJson(request, CustomerCreateSchema);

  const id = await insertCustomer({ name: body.name, email: body.email, imageUrl: body.imageUrl ?? null });
  const created = await fetchCustomerRowById(id);
  return Response.json(toApiCustomer(created!), { status: 201, headers: { Location: `/api/v1/customers/${id}` } });
});
