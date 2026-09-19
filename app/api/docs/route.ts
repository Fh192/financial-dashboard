import { ApiReference } from "@scalar/nextjs-api-reference";

// GET /api/docs — интерактивная документация REST API (Scalar) по спецификации
// /api/openapi.json. Запросы из нее отправляются с cookie сессии, поэтому после
// входа в приложение их можно выполнять прямо со страницы документации.
export const GET = ApiReference({
  url: "/api/openapi.json",
  pageTitle: "Financial Dashboard API",
  // Облачные функции Scalar (ИИ-чат, MCP, телеметрия) не нужны внутреннему
  // API и отправляли бы спецификацию и действия пользователя третьей стороне
  agent: { disabled: true },
  mcp: { disabled: true },
  telemetry: false,
  showDeveloperTools: "never",
});
