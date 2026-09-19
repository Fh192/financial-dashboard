import { buildOpenApiDocument } from "@/lib/api/openapi";

// Спецификация не зависит от запроса — собираем один раз при сборке
export const dynamic = "force-static";

// GET /api/openapi.json — спецификация OpenAPI 3.1 для REST API v1
export function GET() {
  return Response.json(buildOpenApiDocument());
}
