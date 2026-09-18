import { ArrowRightIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchInvoiceHistory } from "@/lib/data/invoices";
import { formatDateTime } from "@/lib/format";
import { InvoiceStatusBadge } from "./status-badge";

/** Журнал статусов счета. Его заполняет триггер в БД, приложение только читает. */
export async function InvoiceStatusHistory({ invoiceId }: { invoiceId: string }) {
  const history = await fetchInvoiceHistory(invoiceId);

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>История статуса</CardTitle>
        <CardDescription>Время московское</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Записей нет.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {history.map((change) => (
              <li key={change.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2">
                  {change.oldStatus ? (
                    <>
                      <InvoiceStatusBadge status={change.oldStatus} />
                      <ArrowRightIcon className="size-3.5 text-muted-foreground" />
                    </>
                  ) : (
                    <span className="text-muted-foreground">Создан:</span>
                  )}
                  <InvoiceStatusBadge status={change.newStatus} />
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(change.changedAt)} · {change.changedBy ?? "система"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
