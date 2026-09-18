import { InvoiceStatusBadge } from "@/components/invoices/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { can, type CurrentUser } from "@/lib/dal";
import { fetchFilteredInvoices, type InvoiceRow } from "@/lib/data/invoices";
import { formatCurrency, formatDate, initials } from "@/lib/format";
import { DeleteInvoiceButton, EditInvoiceButton } from "./buttons";

type Props = { query: string; page: number; user: CurrentUser };

export async function InvoicesTable({ query, page, user }: Props) {
  const invoices = await fetchFilteredInvoices(query, page);
  const canEdit = can(user, { invoice: ["update"] });
  const canDelete = can(user, { invoice: ["delete"] });

  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
        {query ? `По запросу «${query}» ничего не найдено.` : "Счетов пока нет."}
      </div>
    );
  }

  const actions = (invoice: InvoiceRow) =>
    (canEdit || canDelete) && (
      <div className="flex justify-end gap-1">
        {canEdit && <EditInvoiceButton id={invoice.id} />}
        {canDelete && (
          <DeleteInvoiceButton
            id={invoice.id}
            description={`${invoice.customerName}, ${formatCurrency(invoice.amount)} от ${formatDate(invoice.date)}`}
          />
        )}
      </div>
    );

  return (
    <div className="rounded-xl border">
      {/* Телефон: карточки */}
      <ul className="divide-y md:hidden">
        {invoices.map((invoice) => (
          <li key={invoice.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <Customer invoice={invoice} />
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium tabular-nums">{formatCurrency(invoice.amount)}</p>
                <p className="text-xs text-muted-foreground">{formatDate(invoice.date)}</p>
              </div>
              {actions(invoice)}
            </div>
          </li>
        ))}
      </ul>

      {/* Планшет и компьютер: таблица */}
      <Table className="hidden md:table">
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Клиент</TableHead>
            <TableHead className="text-right">Сумма</TableHead>
            <TableHead>Дата</TableHead>
            <TableHead>Статус</TableHead>
            {(canEdit || canDelete) && <TableHead className="pr-4 text-right">Действия</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="pl-4">
                <Customer invoice={invoice} />
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">{formatCurrency(invoice.amount)}</TableCell>
              <TableCell className="whitespace-nowrap">{formatDate(invoice.date)}</TableCell>
              <TableCell>
                <InvoiceStatusBadge status={invoice.status} />
              </TableCell>
              {(canEdit || canDelete) && <TableCell className="pr-4">{actions(invoice)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function Customer({ invoice }: { invoice: InvoiceRow }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-8">
        {invoice.customerImageUrl && <AvatarImage src={invoice.customerImageUrl} alt={invoice.customerName} />}
        <AvatarFallback className="text-xs">{initials(invoice.customerName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{invoice.customerName}</p>
        <p className="truncate text-xs text-muted-foreground">{invoice.customerEmail}</p>
      </div>
    </div>
  );
}

export function InvoicesTableSkeleton() {
  return (
    <div className="flex flex-col divide-y rounded-xl border">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="hidden h-4 w-24 sm:block" />
        </div>
      ))}
    </div>
  );
}
