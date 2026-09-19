"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type ActionResult, DB_ERROR, FORBIDDEN, type FormState, formValues } from "@/lib/actions/types";
import { authorizeAction } from "@/lib/dal";
import { type CustomerData, deleteCustomerById, insertCustomer, updateCustomerById } from "@/lib/services/customers";
import { ServiceError } from "@/lib/services/errors";
import { type CustomerField, parseCustomerForm } from "@/lib/validation/customer";

export type CustomerFormState = FormState<CustomerField>;

const FIELDS: CustomerField[] = ["name", "email", "imageUrl"];

// Общая часть создания и изменения: права, проверка формы, ошибки сервиса
async function saveCustomer(
  permission: "create" | "update",
  formData: FormData,
  save: (data: CustomerData) => Promise<unknown>,
): Promise<CustomerFormState | null> {
  const values = formValues(formData, FIELDS);
  if (!(await authorizeAction({ customer: [permission] }))) return { message: FORBIDDEN, errors: {}, values };

  const parsed = parseCustomerForm(formData);
  if (!parsed.success) {
    return { message: "Проверьте поля формы.", errors: z.flattenError(parsed.error).fieldErrors, values };
  }

  try {
    await save(parsed.data);
    return null;
  } catch (error) {
    if (error instanceof ServiceError) {
      // Ошибку, относящуюся к полю (дубль почты), показываем у этого поля
      return error.field
        ? { message: null, errors: { [error.field]: [error.message] }, values }
        : { message: error.message, errors: {}, values };
    }
    console.error(`${permission}Customer`, error);
    return { message: DB_ERROR, errors: {}, values };
  }
}

export async function createCustomer(_prev: CustomerFormState, formData: FormData): Promise<CustomerFormState> {
  const failed = await saveCustomer("create", formData, insertCustomer);
  if (failed) return failed;

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/customers");
}

export async function updateCustomer(
  id: string,
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  if (!z.uuid().safeParse(id).success) {
    return { message: "Клиент не найден.", errors: {}, values: formValues(formData, FIELDS) };
  }

  const failed = await saveCustomer("update", formData, (data) => updateCustomerById(id, data));
  if (failed) return failed;

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/customers");
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  if (!(await authorizeAction({ customer: ["delete"] }))) return { ok: false, message: FORBIDDEN };
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Клиент не найден." };

  try {
    await deleteCustomerById(id);
  } catch (error) {
    if (error instanceof ServiceError) return { ok: false, message: error.message };
    console.error("deleteCustomer", error);
    return { ok: false, message: "Не удалось удалить клиента. Попробуйте еще раз." };
  }

  refresh();
  return { ok: true };
}
