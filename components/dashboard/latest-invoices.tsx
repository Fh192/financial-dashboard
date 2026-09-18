import { InvoiceStatusBadge } from "@/components/invoices/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchLatestInvoices } from "@/lib/data/dashboard";
import { formatCurrency, formatDate, initials } from "@/lib/format";

export async function LatestInvoices() {
  const invoices = await fetchLatestInvoices();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Последние счета</CardTitle>
        <CardDescription>Пять последних по дате выставления</CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Счетов пока нет.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {invoices.map((invoice) => (
              <li key={invoice.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Avatar className="size-9">
                  {invoice.customerImageUrl && (
                    <AvatarImage src={invoice.customerImageUrl} alt={invoice.customerName} />
                  )}
                  <AvatarFallback>{initials(invoice.customerName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{invoice.customerName}</p>
                  <p className="truncate text-xs text-muted-foreground">{formatDate(invoice.date)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-medium tabular-nums">{formatCurrency(invoice.amount)}</span>
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
