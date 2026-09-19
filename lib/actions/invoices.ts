"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type ActionResult, DB_ERROR, FORBIDDEN, type FormState, formValues } from "@/lib/actions/types";
import { authorizeAction } from "@/lib/dal";
import { ServiceError } from "@/lib/services/errors";
import { deleteInvoiceById, type InvoiceData, insertInvoice, updateInvoiceById } from "@/lib/services/invoices";
import { type InvoiceField, parseInvoiceForm } from "@/lib/validation/invoice";

export type InvoiceFormState = FormState<InvoiceField>;

const FIELDS: InvoiceField[] = ["customerId", "amount", "status", "date"];

type SaveInvoice = (userId: string, data: InvoiceData) => Promise<unknown>;

// Общая часть создания и изменения: права, проверка формы, ошибки сервиса
async function saveInvoice(permission: "create" | "update", formData: FormData, save: SaveInvoice): Promise<InvoiceFormState | null> {
  const values = formValues(formData, FIELDS);
  const user = await authorizeAction({ invoice: [permission] });
  if (!user) return { message: FORBIDDEN, errors: {}, values };

  const parsed = parseInvoiceForm(formData);
  if (!parsed.success) {
    return { message: "Проверьте поля формы.", errors: z.flattenError(parsed.error).fieldErrors, values };
  }

  try {
    await save(user.id, parsed.data);
    return null;
  } catch (error) {
    if (error instanceof ServiceError) return { message: error.message, errors: {}, values };
    console.error(`${permission}Invoice`, error);
    return { message: DB_ERROR, errors: {}, values };
  }
}

export async function createInvoice(_prev: InvoiceFormState, formData: FormData): Promise<InvoiceFormState> {
  const failed = await saveInvoice("create", formData, insertInvoice);
  if (failed) return failed;

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(
  id: string,
  _prev: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  if (!z.uuid().safeParse(id).success) {
    return { message: "Счет не найден.", errors: {}, values: formValues(formData, FIELDS) };
  }

  const failed = await saveInvoice("update", formData, (userId, data) => updateInvoiceById(userId, id, data));
  if (failed) return failed;

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string): Promise<ActionResult> {
  const user = await authorizeAction({ invoice: ["delete"] });
  if (!user) return { ok: false, message: FORBIDDEN };
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Счет не найден." };

  try {
    await deleteInvoiceById(user.id, id);
  } catch (error) {
    if (error instanceof ServiceError) return { ok: false, message: error.message };
    console.error("deleteInvoice", error);
    return { ok: false, message: "Не удалось удалить счет. Попробуйте еще раз." };
  }

  refresh();
  return { ok: true };
}
