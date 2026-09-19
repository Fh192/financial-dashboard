import { z } from "zod";
import { createDocument, type ZodOpenApiOperationObject, type ZodOpenApiResponsesObject } from "zod-openapi";
import {
  CustomerCreateSchema,
  CustomerListSchema,
  CustomerSchema,
  CustomerUpdateSchema,
  ErrorSchema,
  ExchangeRatesQuerySchema,
  ExchangeRatesSchema,
  IdParamsSchema,
  InvoiceCreateSchema,
  InvoiceListSchema,
  InvoiceSchema,
  InvoiceUpdateSchema,
  ListQuerySchema,
  MeSchema,
  StatusChangeSchema,
  SummarySchema,
} from "./schemas";

// Спецификация OpenAPI 3.1 строится из тех же Zod-схем, которыми API проверяет
// запросы: документация не может разойтись с реальной проверкой.

const json = (schema: z.ZodType) => ({ content: { "application/json": { schema } } });

const errors = {
  400: { description: "Ошибка в запросе: поля не прошли проверку", ...json(ErrorSchema) },
  401: { description: "Не выполнен вход (нет cookie сессии или Bearer-токена)", ...json(ErrorSchema) },
  403: { description: "У роли пользователя нет прав на действие", ...json(ErrorSchema) },
  404: { description: "Запись не найдена", ...json(ErrorSchema) },
  409: { description: "Конфликт с данными: дубль почты, у клиента есть счета", ...json(ErrorSchema) },
  415: { description: "Тело запроса должно быть в JSON (Content-Type: application/json)", ...json(ErrorSchema) },
  422: { description: "Ссылка на несуществующую запись (например, клиента)", ...json(ErrorSchema) },
  503: { description: "Внешний сервис (ЦБ РФ) недоступен", ...json(ErrorSchema) },
} satisfies ZodOpenApiResponsesObject;

function operation(
  op: Omit<ZodOpenApiOperationObject, "responses"> & { ok: ZodOpenApiResponsesObject; errors: (keyof typeof errors)[] },
): ZodOpenApiOperationObject {
  const { ok, errors: codes, ...rest } = op;
  return { ...rest, responses: { ...ok, ...Object.fromEntries(codes.map((c) => [c, errors[c]])) } };
}

const byId = { requestParams: { path: IdParamsSchema } };

export function buildOpenApiDocument() {
  return createDocument({
    openapi: "3.1.0",
    info: {
      title: "Financial Dashboard API",
      version: "1.0.0",
      description: [
        "REST API учебного проекта Financial Dashboard: счета, клиенты, аналитика и курсы ЦБ РФ.",
        "",
        "**Аутентификация.** В браузере после входа в приложение запросы авторизуются cookie сессии.",
        "Для внешних клиентов: выполните `POST /api/auth/sign-in/email` с JSON `{ \"email\", \"password\" }`,",
        "возьмите токен из заголовка ответа `set-auth-token` и передавайте его как `Authorization: Bearer <токен>`.",
        "",
        "**Права** зависят от роли: viewer — только чтение, manager — счета и клиенты (без удаления клиентов),",
        "admin — все. **Суммы** передаются в центах USD (поля `*Cents`), даты — в формате `YYYY-MM-DD`.",
      ].join("\n"),
    },
    servers: [{ url: "/api/v1" }],
    security: [{ bearerAuth: [] }, { sessionCookie: [] }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", description: "Токен из заголовка set-auth-token ответа на вход" },
        sessionCookie: { type: "apiKey", in: "cookie", name: "better-auth.session_token", description: "Cookie сессии браузера" },
      },
    },
    tags: [
      { name: "Счета" },
      { name: "Клиенты" },
      { name: "Аналитика" },
      { name: "Курсы ЦБ" },
      { name: "Пользователь" },
    ],
    paths: {
      "/invoices": {
        get: operation({
          tags: ["Счета"],
          summary: "Список счетов",
          description: "Поиск по клиенту, почте, сумме, дате (ДД.ММ.ГГГГ) и статусу. Роли: все.",
          requestParams: { query: ListQuerySchema },
          ok: { 200: { description: "Страница счетов", ...json(InvoiceListSchema) } },
          errors: [400, 401, 403],
        }),
        post: operation({
          tags: ["Счета"],
          summary: "Создать счет",
          description: "Роли: manager, admin. Создание попадает в журнал статусов от имени пользователя.",
          requestBody: json(InvoiceCreateSchema),
          ok: { 201: { description: "Счет создан", ...json(InvoiceSchema) } },
          errors: [400, 401, 403, 415, 422],
        }),
      },
      "/invoices/{id}": {
        get: operation({
          tags: ["Счета"],
          summary: "Счет по id",
          ...byId,
          ok: { 200: { description: "Счет", ...json(InvoiceSchema) } },
          errors: [401, 403, 404],
        }),
        patch: operation({
          tags: ["Счета"],
          summary: "Изменить счет",
          description: "Роли: manager, admin. Смена статуса попадает в журнал.",
          ...byId,
          requestBody: json(InvoiceUpdateSchema),
          ok: { 200: { description: "Измененный счет", ...json(InvoiceSchema) } },
          errors: [400, 401, 403, 404, 415, 422],
        }),
        delete: operation({
          tags: ["Счета"],
          summary: "Удалить счет",
          description: "Роли: manager, admin. Вместе со счетом удаляется его журнал статусов.",
          ...byId,
          ok: { 204: { description: "Счет удален" } },
          errors: [401, 403, 404],
        }),
      },
      "/invoices/{id}/history": {
        get: operation({
          tags: ["Счета"],
          summary: "История статуса счета",
          description: "Журнал заполняет триггер в БД; через API его можно только читать.",
          ...byId,
          ok: {
            200: { description: "Записи журнала, новые сверху", ...json(z.object({ data: z.array(StatusChangeSchema) })) },
          },
          errors: [401, 403, 404],
        }),
      },
      "/customers": {
        get: operation({
          tags: ["Клиенты"],
          summary: "Список клиентов",
          description: "С суммами оплаченных и ожидающих счетов. Поиск по названию и почте. Роли: все.",
          requestParams: { query: ListQuerySchema },
          ok: { 200: { description: "Страница клиентов", ...json(CustomerListSchema) } },
          errors: [400, 401, 403],
        }),
        post: operation({
          tags: ["Клиенты"],
          summary: "Создать клиента",
          description: "Роли: manager, admin. Почта уникальна без учета регистра (иначе 409).",
          requestBody: json(CustomerCreateSchema),
          ok: { 201: { description: "Клиент создан", ...json(CustomerSchema) } },
          errors: [400, 401, 403, 409, 415],
        }),
      },
      "/customers/{id}": {
        get: operation({
          tags: ["Клиенты"],
          summary: "Клиент по id",
          ...byId,
          ok: { 200: { description: "Клиент", ...json(CustomerSchema) } },
          errors: [401, 403, 404],
        }),
        patch: operation({
          tags: ["Клиенты"],
          summary: "Изменить клиента",
          description: "Роли: manager, admin.",
          ...byId,
          requestBody: json(CustomerUpdateSchema),
          ok: { 200: { description: "Измененный клиент", ...json(CustomerSchema) } },
          errors: [400, 401, 403, 404, 409, 415],
        }),
        delete: operation({
          tags: ["Клиенты"],
          summary: "Удалить клиента",
          description: "Роль: admin. Клиента, у которого есть счета, удалить нельзя (409).",
          ...byId,
          ok: { 204: { description: "Клиент удален" } },
          errors: [401, 403, 404, 409],
        }),
      },
      "/summary": {
        get: operation({
          tags: ["Аналитика"],
          summary: "Показатели панели",
          description: "Суммы оплаченных и ожидающих счетов, количество счетов и клиентов, выручка за 12 месяцев.",
          ok: { 200: { description: "Показатели", ...json(SummarySchema) } },
          errors: [401, 403],
        }),
      },
      "/exchange-rates": {
        get: operation({
          tags: ["Курсы ЦБ"],
          summary: "Курсы ЦБ РФ на дату",
          description: "Официальные курсы ЦБ РФ (при недоступности — зеркало cbr-xml-daily.ru), кэшируются в БД.",
          requestParams: { query: ExchangeRatesQuerySchema },
          ok: { 200: { description: "Курсы", ...json(ExchangeRatesSchema) } },
          errors: [400, 401, 503],
        }),
      },
      "/me": {
        get: operation({
          tags: ["Пользователь"],
          summary: "Текущий пользователь",
          ok: { 200: { description: "Пользователь и его роль", ...json(MeSchema) } },
          errors: [401],
        }),
      },
    },
  });
}
