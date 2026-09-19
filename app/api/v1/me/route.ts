import { apiRoute, requireApiUser } from "@/lib/api/http";

// GET /api/v1/me — текущий пользователь; удобно проверить, что токен работает
export const GET = apiRoute(async () => {
  const { id, name, email, role } = await requireApiUser();
  return Response.json({ id, name, email, role });
});
