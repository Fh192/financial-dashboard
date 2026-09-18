"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type ActionResult, DB_ERROR, FORBIDDEN, type FormState, formValues } from "@/lib/actions/types";
import { authorizeAction } from "@/lib/dal";
import { pool } from "@/lib/db";
import { isForeignKeyViolation, isUniqueViolation } from "@/lib/db-errors";
import { type CustomerField, type CustomerInput, parseCustomerForm } from "@/lib/validation/customer";

export type CustomerFormState = FormState<CustomerField>;

const FIELDS: CustomerField[] = ["name", "email", "imageUrl"];
const EMAIL_TAKEN = "Клиент с такой почтой уже есть.";

type SaveResult = { ok: true; found: boolean } | { ok: false; state: CustomerFormState };

// Общая часть создания и изменения: проверка прав, формы и ошибок БД
async function saveCustomer(
  permission: "create" | "update",
  formData: FormData,
  save: (data: CustomerInput) => Promise<{ rowCount: number | null }>,
): Promise<SaveResult> {
  const values = formValues(formData, FIELDS);
  const fail = (state: Omit<CustomerFormState, "values">): SaveResult => ({ ok: false, state: { ...state, values } });

  if (!(await authorizeAction({ customer: [permission] }))) return fail({ message: FORBIDDEN, errors: {} });

  const parsed = parseCustomerForm(formData);
  if (!parsed.success) {
    return fail({ message: "Проверьте поля формы.", errors: z.flattenError(parsed.error).fieldErrors });
  }

  try {
    const { rowCount } = await save(parsed.data);
    return { ok: true, found: rowCount !== 0 };
  } catch (error) {
    // Уникальность почты без учета регистра проверяет индекс в БД — это
    // надежнее проверки перед вставкой, которую обгонит параллельный запрос
    if (isUniqueViolation(error, "customers_email_lower_key")) {
      return fail({ message: null, errors: { email: [EMAIL_TAKEN] } });
    }
    console.error(`${permission}Customer`, error);
    return fail({ message: DB_ERROR, errors: {} });
  }
}

export async function createCustomer(_prev: CustomerFormState, formData: FormData): Promise<CustomerFormState> {
  const result = await saveCustomer("create", formData, ({ name, email, imageUrl }) =>
    pool.query("INSERT INTO customers (name, email, image_url) VALUES ($1, $2, $3)", [name, email, imageUrl]),
  );
  if (!result.ok) return result.state;

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

  const result = await saveCustomer("update", formData, ({ name, email, imageUrl }) =>
    pool.query("UPDATE customers SET name = $2, email = $3, image_url = $4 WHERE id = $1", [id, name, email, imageUrl]),
  );
  if (!result.ok) return result.state;
  if (!result.found) {
    return { message: "Клиент не найден: возможно, его уже удалили.", errors: {}, values: formValues(formData, FIELDS) };
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/customers");
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  if (!(await authorizeAction({ customer: ["delete"] }))) return { ok: false, message: FORBIDDEN };
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Клиент не найден." };

  try {
    const { rowCount } = await pool.query("DELETE FROM customers WHERE id = $1", [id]);
    if (rowCount === 0) return { ok: false, message: "Клиент уже удален." };
  } catch (error) {
    // Внешний ключ invoices.customer_id ON DELETE RESTRICT: клиента со счетами
    // удалить нельзя, иначе пропала бы история выручки
    if (isForeignKeyViolation(error)) {
      return { ok: false, message: "У клиента есть счета. Сначала удалите их или перенесите на другого клиента." };
    }
    console.error("deleteCustomer", error);
    return { ok: false, message: "Не удалось удалить клиента. Попробуйте еще раз." };
  }

  refresh();
  return { ok: true };
}
