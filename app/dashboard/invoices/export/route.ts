import type { NextRequest } from "next/server";
import { moscowToday } from "@/lib/cbr/convert";
import { csvAmount, csvDate, csvResponse, toCsv } from "@/lib/csv";
import { fetchInvoicesForExport, type InvoiceRow } from "@/lib/data/invoices";
import { checkExportAccess } from "@/lib/export-access";
import { parseQuery } from "@/lib/search";

// GET /dashboard/invoices/export?query=... — счета в CSV с тем же поиском, что и в списке
export async function GET(request: NextRequest) {
  const denied = await checkExportAccess({ invoice: ["read"], report: ["export"] });
  if (denied) return denied;

  const query = parseQuery(request.nextUrl.searchParams.get("query") ?? undefined);
  const invoices = await fetchInvoicesForExport(query);

  const csv = toCsv<InvoiceRow>(invoices, [
    { header: "Дата", value: (i) => csvDate(i.date) },
    { header: "Клиент", value: (i) => i.customerName },
    { header: "Почта клиента", value: (i) => i.customerEmail },
    { header: "Сумма, USD", value: (i) => csvAmount(i.amount) },
    { header: "Статус", value: (i) => (i.status === "paid" ? "Оплачен" : "Ожидает оплаты") },
  ]);

  return csvResponse(csv, `invoices-${moscowToday()}.csv`);
}
