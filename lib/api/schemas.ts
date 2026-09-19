import "zod-openapi"; // типы для .meta({ id, example, ... })
import { z } from "zod";
import { ROLES } from "@/lib/permissions";
import { customerSchema } from "@/lib/validation/customer";
import { dateSchema, invoiceStatusSchema, MAX_AMOUNT } from "@/lib/validation/invoice";

// Схемы REST API. Одни и те же схемы проверяют запросы в Route Handlers
// и описывают API в спецификации OpenAPI (lib/api/openapi.ts).
// Правила проверки взяты из схем форм, чтобы API и интерфейс не расходились.

const uuid = z.uuid().meta({ example: "30000000-0000-4000-8000-000000000001" });
const cents = z.int().meta({ description: "Сумма в центах USD", example: 150050 });

export const ErrorSchema = z
  .object({
    error: z.object({
      code: z.string().meta({ example: "VALIDATION_ERROR" }),
      message: z.string().meta({ example: "Проверьте поля запроса." }),
      details: z
        .record(z.string(), z.array(z.string()))
        .optional()
        .meta({ description: "Ошибки по полям", example: { amountCents: ["Сумма должна быть больше нуля"] } }),
    }),
  })
  .meta({ id: "Error" });

export const PaginationSchema = z
  .object({
    page: z.int().meta({ example: 1 }),
    pageSize: z.int().meta({ example: 20 }),
    total: z.int().meta({ description: "Всего найдено записей", example: 50 }),
    totalPages: z.int().meta({ example: 3 }),
  })
  .meta({ id: "Pagination" });

export const ListQuerySchema = z.object({
  query: z
    .string()
    .trim()
    .max(100, { error: "Не длиннее 100 символов" })
    .optional()
    .meta({ description: "Поиск (как в интерфейсе)", example: "кофейня" }),
  page: z.coerce
    .number({ error: "Номер страницы — целое число от 1" })
    .int({ error: "Номер страницы — целое число от 1" })
    .min(1, { error: "Номер страницы — целое число от 1" })
    .default(1)
    .meta({ description: "Номер страницы" }),
  pageSize: z.coerce
    .number({ error: "Размер страницы — целое число от 1 до 100" })
    .int({ error: "Размер страницы — целое число от 1 до 100" })
    .min(1, { error: "Размер страницы — целое число от 1 до 100" })
    .max(100, { error: "Размер страницы — целое число от 1 до 100" })
    .default(20)
    .meta({ description: "Записей на странице, до 100" }),
});

export const IdParamsSchema = z.object({ id: uuid.meta({ description: "Идентификатор (UUID)" }) });

// --- Счета ---

export const InvoiceStatusSchema = invoiceStatusSchema.meta({
  id: "InvoiceStatus",
  description: "pending — ожидает оплаты, paid — оплачен",
});

export const InvoiceSchema = z
  .object({
    id: uuid,
    customerId: uuid,
    customerName: z.string().meta({ example: "ООО «Кофейня на углу»" }),
    customerEmail: z.string().meta({ example: "accounting@coffee-corner.ru" }),
    amountCents: cents,
    status: InvoiceStatusSchema,
    date: z.string().meta({ description: "Дата счета", format: "date", example: "2026-09-18" }),
  })
  .meta({ id: "Invoice" });

const amountCents = z
  .int({ error: "Сумма должна быть целым числом центов" })
  .positive({ error: "Сумма должна быть больше нуля" })
  .max(MAX_AMOUNT * 100, { error: `Сумма не может быть больше ${MAX_AMOUNT * 100} центов` })
  .meta({ description: "Сумма в центах USD (1500,50 $ = 150050)", example: 150050 });

export const InvoiceCreateSchema = z
  .strictObject({
    customerId: z.uuid({ error: "Некорректный id клиента" }).meta({ example: "20000000-0000-4000-8000-000000000001" }),
    amountCents,
    status: InvoiceStatusSchema.default("pending"),
    date: dateSchema.optional().meta({ description: "По умолчанию — сегодня по Москве", format: "date", example: "2026-09-19" }),
  })
  .meta({ id: "InvoiceCreate" });

export const InvoiceUpdateSchema = z
  .strictObject({
    customerId: z.uuid({ error: "Некорректный id клиента" }).optional(),
    amountCents: amountCents.optional(),
    status: InvoiceStatusSchema.optional(),
    date: dateSchema.optional().meta({ format: "date" }),
  })
  .refine((v) => Object.keys(v).length > 0, { error: "Укажите хотя бы одно поле для изменения" })
  .meta({ id: "InvoiceUpdate", description: "Меняются только переданные поля" });

export const StatusChangeSchema = z
  .object({
    oldStatus: InvoiceStatusSchema.nullable().meta({ description: "null — счет создан" }),
    newStatus: InvoiceStatusSchema,
    changedBy: z.string().nullable().meta({ description: "Имя пользователя; null — система", example: "Менеджер" }),
    changedAt: z.string().meta({ format: "date-time", example: "2026-09-18T15:56:02Z" }),
  })
  .meta({ id: "StatusChange" });

// --- Клиенты ---

export const CustomerSchema = z
  .object({
    id: uuid,
    name: z.string().meta({ example: "ООО «Кофейня на углу»" }),
    email: z.string().meta({ example: "accounting@coffee-corner.ru" }),
    imageUrl: z.string().nullable().meta({ example: null }),
    invoiceCount: z.int().meta({ example: 9 }),
    paidCents: cents,
    pendingCents: cents,
  })
  .meta({ id: "Customer" });

const imageUrl = z
  .union([z.null(), customerSchema.shape.imageUrl])
  .optional()
  .meta({ description: "Ссылка на логотип (https) или null", example: null });

export const CustomerCreateSchema = z
  .strictObject({
    name: customerSchema.shape.name.meta({ example: "ООО «Ромашка»" }),
    email: customerSchema.shape.email.meta({ description: "Уникальна без учета регистра", example: "billing@romashka.ru" }),
    imageUrl,
  })
  .meta({ id: "CustomerCreate" });

export const CustomerUpdateSchema = z
  .strictObject({
    name: customerSchema.shape.name.optional(),
    email: customerSchema.shape.email.optional(),
    imageUrl,
  })
  .refine((v) => Object.keys(v).length > 0, { error: "Укажите хотя бы одно поле для изменения" })
  .meta({ id: "CustomerUpdate", description: "Меняются только переданные поля" });

// --- Аналитика, курсы, пользователь ---

export const SummarySchema = z
  .object({
    paidCents: cents,
    pendingCents: cents,
    invoiceCount: z.int().meta({ example: 50 }),
    customerCount: z.int().meta({ example: 10 }),
    revenue: z
      .array(
        z.object({
          month: z.string().meta({ description: "Первое число месяца", format: "date", example: "2026-09-01" }),
          revenueCents: cents,
        }),
      )
      .meta({ description: "Оплаченная выручка за последние 12 месяцев" }),
  })
  .meta({ id: "Summary" });

export const ExchangeRatesQuerySchema = z.object({
  date: dateSchema.optional().meta({ description: "По умолчанию — сегодня по Москве", format: "date", example: "2026-09-18" }),
});

export const ExchangeRatesSchema = z
  .object({
    date: z.string().meta({ description: "Дата, на которую действует курс", format: "date", example: "2026-09-18" }),
    source: z.enum(["cache", "cbr", "mirror"]).meta({ description: "cache — из БД, cbr — сайт ЦБ, mirror — зеркало" }),
    rates: z
      .record(z.string(), z.number())
      .meta({ description: "Рублей за единицу валюты по курсу ЦБ РФ", example: { USD: 84.5093, EUR: 97.4984 } }),
  })
  .meta({ id: "ExchangeRates" });

export const MeSchema = z
  .object({
    id: uuid,
    name: z.string().meta({ example: "Менеджер" }),
    email: z.string().meta({ example: "manager@example.com" }),
    role: z.enum(ROLES).meta({ example: "manager" }),
  })
  .meta({ id: "Me" });

export function paginated<T extends z.ZodType>(item: T, id: string) {
  return z.object({ data: z.array(item), pagination: PaginationSchema }).meta({ id });
}

export const InvoiceListSchema = paginated(InvoiceSchema, "InvoiceList");
export const CustomerListSchema = paginated(CustomerSchema, "CustomerList");
