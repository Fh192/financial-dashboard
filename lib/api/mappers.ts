import type { z } from "zod";
import type { CustomerRow } from "@/lib/data/customers";
import type { InvoiceRow } from "@/lib/data/invoices";
import type { CustomerSchema, InvoiceSchema } from "./schemas";

// Строки БД → объекты API. Суммы в API явно названы *Cents,
// чтобы клиент не спутал центы с долларами.

export function toApiInvoice(row: InvoiceRow): z.output<typeof InvoiceSchema> {
  return {
    id: row.id,
    customerId: row.customerId,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    amountCents: row.amount,
    status: row.status,
    date: row.date,
  };
}

export function toApiCustomer(row: CustomerRow): z.output<typeof CustomerSchema> {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    imageUrl: row.imageUrl,
    invoiceCount: row.invoiceCount,
    paidCents: row.paid,
    pendingCents: row.pending,
  };
}
