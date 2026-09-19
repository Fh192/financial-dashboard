import "server-only";
import { pool } from "@/lib/db";
import { isForeignKeyViolation, isUniqueViolation } from "@/lib/db-errors";
import { ServiceError } from "./errors";

// Изменение клиентов — общее для форм (Server Actions) и REST API.
// Права проверяет вызывающий код.

export type CustomerData = {
  name: string;
  email: string; // в нижнем регистре
  imageUrl: string | null;
};

// Уникальность почты без учета регистра проверяет индекс в БД — это
// надежнее проверки перед вставкой, которую обгонит параллельный запрос
function mapUniqueEmail(error: unknown): never {
  if (isUniqueViolation(error, "customers_email_lower_key")) {
    throw new ServiceError("CONFLICT", "Клиент с такой почтой уже есть.", "email");
  }
  throw error;
}

export async function insertCustomer(data: CustomerData): Promise<string> {
  try {
    const { rows } = await pool.query<{ id: string }>(
      "INSERT INTO customers (name, email, image_url) VALUES ($1, $2, $3) RETURNING id",
      [data.name, data.email, data.imageUrl],
    );
    return rows[0].id;
  } catch (error) {
    mapUniqueEmail(error);
  }
}

export async function updateCustomerById(id: string, data: CustomerData): Promise<void> {
  let rowCount: number | null = null;
  try {
    ({ rowCount } = await pool.query("UPDATE customers SET name = $2, email = $3, image_url = $4 WHERE id = $1", [
      id,
      data.name,
      data.email,
      data.imageUrl,
    ]));
  } catch (error) {
    mapUniqueEmail(error);
  }
  if (rowCount === 0) throw new ServiceError("NOT_FOUND", "Клиент не найден: возможно, его уже удалили.");
}

export async function deleteCustomerById(id: string): Promise<void> {
  let rowCount: number | null = null;
  try {
    ({ rowCount } = await pool.query("DELETE FROM customers WHERE id = $1", [id]));
  } catch (error) {
    // Внешний ключ invoices.customer_id ON DELETE RESTRICT: клиента со счетами
    // удалить нельзя, иначе пропала бы история выручки
    if (isForeignKeyViolation(error)) {
      throw new ServiceError("CONFLICT", "У клиента есть счета. Сначала удалите их или перенесите на другого клиента.");
    }
    throw error;
  }
  if (rowCount === 0) throw new ServiceError("NOT_FOUND", "Клиент уже удален.");
}
