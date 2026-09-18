"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type ActionResult, DB_ERROR, FORBIDDEN, type FormState, formValues } from "@/lib/actions/types";
import { authorizeAction } from "@/lib/dal";
import { withUser } from "@/lib/db";
import { isForeignKeyViolation } from "@/lib/db-errors";
import { type InvoiceField, parseInvoiceForm } from "@/lib/validation/invoice";

export type InvoiceFormState = FormState<InvoiceField>;

const FIELDS: InvoiceField[] = ["customerId", "amount", "status", "date"];

export async function createInvoice(_prev: InvoiceFormState, formData: FormData): Promise<InvoiceFormState> {
  const values = formValues(formData, FIELDS);
  const user = await authorizeAction({ invoice: ["create"] });
  if (!user) return { message: FORBIDDEN, errors: {}, values };

  const parsed = parseInvoiceForm(formData);
  if (!parsed.success) {
    return { message: "Проверьте поля формы.", errors: z.flattenError(parsed.error).fieldErrors, values };
  }
  const { customerId, amount, status, date } = parsed.data;

  try {
    // Триггер журнала запишет создание счета от имени пользователя
    await withUser(user.id, (client) =>
      client.query("INSERT INTO invoices (customer_id, amount, status, date) VALUES ($1, $2, $3, $4)", [
        customerId,
        amount,
        status,
        date,
      ]),
    );
  } catch (error) {
    console.error("createInvoice", error);
    return { message: isForeignKeyViolation(error) ? "Клиент не найден." : DB_ERROR, errors: {}, values };
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(
  id: string,
  _prev: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  const values = formValues(formData, FIELDS);
  const user = await authorizeAction({ invoice: ["update"] });
  if (!user) return { message: FORBIDDEN, errors: {}, values };
  if (!z.uuid().safeParse(id).success) return { message: "Счет не найден.", errors: {}, values };

  const parsed = parseInvoiceForm(formData);
  if (!parsed.success) {
    return { message: "Проверьте поля формы.", errors: z.flattenError(parsed.error).fieldErrors, values };
  }
  const { customerId, amount, status, date } = parsed.data;

  try {
    const { rowCount } = await withUser(user.id, (client) =>
      client.query("UPDATE invoices SET customer_id = $2, amount = $3, status = $4, date = $5 WHERE id = $1", [
        id,
        customerId,
        amount,
        status,
        date,
      ]),
    );
    if (rowCount === 0) return { message: "Счет не найден: возможно, его уже удалили.", errors: {}, values };
  } catch (error) {
    console.error("updateInvoice", error);
    return { message: isForeignKeyViolation(error) ? "Клиент не найден." : DB_ERROR, errors: {}, values };
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string): Promise<ActionResult> {
  const user = await authorizeAction({ invoice: ["delete"] });
  if (!user) return { ok: false, message: FORBIDDEN };
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Счет не найден." };

  try {
    const { rowCount } = await withUser(user.id, (client) => client.query("DELETE FROM invoices WHERE id = $1", [id]));
    if (rowCount === 0) return { ok: false, message: "Счет уже удален." };
  } catch (error) {
    console.error("deleteInvoice", error);
    return { ok: false, message: "Не удалось удалить счет. Попробуйте еще раз." };
  }

  refresh();
  return { ok: true };
}
