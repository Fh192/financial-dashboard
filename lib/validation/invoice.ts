import { z } from "zod";

// Проверка формы счета. Работает и на сервере (Server Actions), и в тестах.
// Ограничения совпадают с ограничениями в БД, но проверяются раньше,
// чтобы показать пользователю понятное сообщение у нужного поля.

export const MAX_AMOUNT = 1_000_000; // долларов; в центах это помещается в integer

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export const invoiceSchema = z.object({
  customerId: z.uuid({ error: "Выберите клиента" }),
  amount: z.coerce
    .number({ error: "Введите сумму" })
    .positive({ error: "Сумма должна быть больше нуля" })
    .max(MAX_AMOUNT, { error: `Сумма не может быть больше ${MAX_AMOUNT.toLocaleString("ru-RU")} $` })
    .refine((v) => Number.isInteger(Math.round(v * 100)) && Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, {
      error: "Не больше двух знаков после запятой",
    })
    .transform((v) => Math.round(v * 100)), // в центах
  status: z.enum(["pending", "paid"], { error: "Выберите статус" }),
  date: z
    .string({ error: "Укажите дату" })
    .regex(isoDate, { error: "Укажите дату" })
    // Date.parse принимает «2026-02-30» и сдвигает на март, поэтому сверяем обратно
    .refine((v) => {
      const d = new Date(`${v}T00:00:00Z`);
      return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
    }, { error: "Некорректная дата" }),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type InvoiceField = keyof z.input<typeof invoiceSchema>;

/** Разбирает FormData; сумма может быть введена через запятую: «12,50». */
export function parseInvoiceForm(formData: FormData) {
  const amount = String(formData.get("amount") ?? "")
    .replace(/\s/g, "")
    .replace(",", ".");
  return invoiceSchema.safeParse({
    customerId: formData.get("customerId") ?? undefined,
    amount: amount === "" ? undefined : amount,
    status: formData.get("status") ?? undefined,
    date: formData.get("date") ?? undefined,
  });
}
