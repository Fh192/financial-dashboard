import "server-only";
import { withUser } from "@/lib/db";
import { isForeignKeyViolation } from "@/lib/db-errors";
import type { InvoiceStatus } from "@/lib/definitions";
import { ServiceError } from "./errors";

// Изменение счетов — общее для форм (Server Actions) и REST API.
// Права проверяет вызывающий код. Все изменения идут в транзакции от имени
// пользователя (withUser), чтобы триггер записал автора в журнал статусов.

export type InvoiceData = {
  customerId: string;
  amount: number; // центы USD
  status: InvoiceStatus;
  date: string; // YYYY-MM-DD
};

const CUSTOMER_NOT_FOUND = new ServiceError("INVALID_REFERENCE", "Клиент не найден.", "customerId");

export async function insertInvoice(userId: string, data: InvoiceData): Promise<string> {
  try {
    const { rows } = await withUser(userId, (client) =>
      client.query<{ id: string }>(
        "INSERT INTO invoices (customer_id, amount, status, date) VALUES ($1, $2, $3, $4) RETURNING id",
        [data.customerId, data.amount, data.status, data.date],
      ),
    );
    return rows[0].id;
  } catch (error) {
    if (isForeignKeyViolation(error)) throw CUSTOMER_NOT_FOUND;
    throw error;
  }
}

export async function updateInvoiceById(userId: string, id: string, data: InvoiceData): Promise<void> {
  let rowCount: number | null;
  try {
    ({ rowCount } = await withUser(userId, (client) =>
      client.query("UPDATE invoices SET customer_id = $2, amount = $3, status = $4, date = $5 WHERE id = $1", [
        id,
        data.customerId,
        data.amount,
        data.status,
        data.date,
      ]),
    ));
  } catch (error) {
    if (isForeignKeyViolation(error)) throw CUSTOMER_NOT_FOUND;
    throw error;
  }
  if (rowCount === 0) throw new ServiceError("NOT_FOUND", "Счет не найден: возможно, его уже удалили.");
}

export async function deleteInvoiceById(userId: string, id: string): Promise<void> {
  const { rowCount } = await withUser(userId, (client) => client.query("DELETE FROM invoices WHERE id = $1", [id]));
  if (rowCount === 0) throw new ServiceError("NOT_FOUND", "Счет уже удален.");
}
