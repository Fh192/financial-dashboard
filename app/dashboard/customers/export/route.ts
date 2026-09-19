import type { NextRequest } from "next/server";
import { moscowToday } from "@/lib/cbr/convert";
import { csvAmount, csvResponse, toCsv } from "@/lib/csv";
import { type CustomerRow, fetchCustomersForExport } from "@/lib/data/customers";
import { checkExportAccess } from "@/lib/export-access";
import { parseQuery } from "@/lib/search";

// GET /dashboard/customers/export?query=... — клиенты с суммами по счетам в CSV
export async function GET(request: NextRequest) {
  const denied = await checkExportAccess({ customer: ["read"], report: ["export"] });
  if (denied) return denied;

  const query = parseQuery(request.nextUrl.searchParams.get("query") ?? undefined);
  const customers = await fetchCustomersForExport(query);

  const csv = toCsv<CustomerRow>(customers, [
    { header: "Клиент", value: (c) => c.name },
    { header: "Почта", value: (c) => c.email },
    { header: "Счетов", value: (c) => c.invoiceCount },
    { header: "Оплачено, USD", value: (c) => csvAmount(c.paid) },
    { header: "Ожидает оплаты, USD", value: (c) => csvAmount(c.pending) },
  ]);

  return csvResponse(csv, `customers-${moscowToday()}.csv`);
}
