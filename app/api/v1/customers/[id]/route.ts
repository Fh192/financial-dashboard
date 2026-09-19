import { apiRoute, notFound, parseId, readJson, requireApiUser } from "@/lib/api/http";
import { toApiCustomer } from "@/lib/api/mappers";
import { CustomerUpdateSchema } from "@/lib/api/schemas";
import { fetchCustomerById, fetchCustomerRowById } from "@/lib/data/customers";
import { deleteCustomerById, updateCustomerById } from "@/lib/services/customers";

type Ctx = RouteContext<"/api/v1/customers/[id]">;
const NOT_FOUND = "Клиент не найден.";

// GET /api/v1/customers/{id}
export const GET = apiRoute(async (_request, ctx: Ctx) => {
  await requireApiUser({ customer: ["read"] });
  const id = parseId((await ctx.params).id, NOT_FOUND);

  const customer = await fetchCustomerRowById(id);
  if (!customer) notFound(NOT_FOUND);
  return Response.json(toApiCustomer(customer));
});

// PATCH /api/v1/customers/{id} — меняются только переданные поля
export const PATCH = apiRoute(async (request, ctx: Ctx) => {
  await requireApiUser({ customer: ["update"] });
  const id = parseId((await ctx.params).id, NOT_FOUND);
  const patch = await readJson(request, CustomerUpdateSchema);

  const current = await fetchCustomerById(id);
  if (!current) notFound(NOT_FOUND);

  await updateCustomerById(id, {
    name: patch.name ?? current.name,
    email: patch.email ?? current.email,
    imageUrl: patch.imageUrl === undefined ? current.imageUrl : patch.imageUrl,
  });
  return Response.json(toApiCustomer((await fetchCustomerRowById(id))!));
});

// DELETE /api/v1/customers/{id} — нельзя, если у клиента есть счета (409)
export const DELETE = apiRoute(async (_request, ctx: Ctx) => {
  await requireApiUser({ customer: ["delete"] });
  const id = parseId((await ctx.params).id, NOT_FOUND);

  await deleteCustomerById(id);
  return new Response(null, { status: 204 });
});
