import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { can, type CurrentUser } from "@/lib/dal";
import { type CustomerRow, fetchFilteredCustomers } from "@/lib/data/customers";
import { formatCurrency, initials } from "@/lib/format";
import { DeleteCustomerButton, EditCustomerButton } from "./buttons";

type Props = { query: string; page: number; user: CurrentUser };

export async function CustomersTable({ query, page, user }: Props) {
  const customers = await fetchFilteredCustomers(query, page);
  const canEdit = can(user, { customer: ["update"] });
  const canDelete = can(user, { customer: ["delete"] });
  const hasActions = canEdit || canDelete;

  if (customers.length === 0) {
    return (
      <div data-testid="empty-state" className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
        {query ? `По запросу «${query}» ничего не найдено.` : "Клиентов пока нет."}
      </div>
    );
  }

  const actions = (customer: CustomerRow) =>
    hasActions && (
      <div className="flex justify-end gap-1">
        {canEdit && <EditCustomerButton id={customer.id} />}
        {canDelete && <DeleteCustomerButton id={customer.id} name={customer.name} />}
      </div>
    );

  return (
    <div className="rounded-xl border">
      {/* Телефон: карточки */}
      <ul className="divide-y md:hidden">
        {customers.map((customer) => (
          <li key={customer.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <CustomerInfo customer={customer} />
              {actions(customer)}
            </div>
            <dl className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Счетов</dt>
                <dd>
                  <InvoicesLink customer={customer} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Оплачено</dt>
                <dd className="tabular-nums">{formatCurrency(customer.paid)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Ожидает</dt>
                <dd className="tabular-nums">{formatCurrency(customer.pending)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      {/* Планшет и компьютер: таблица */}
      <Table data-testid="customers-table" className="hidden md:table">
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Клиент</TableHead>
            <TableHead className="text-right">Счетов</TableHead>
            <TableHead className="text-right">Оплачено</TableHead>
            <TableHead className="text-right">Ожидает оплаты</TableHead>
            {hasActions && <TableHead className="pr-4 text-right">Действия</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id} data-testid={`customer-row-${customer.id}`}>
              <TableCell className="pl-4">
                <CustomerInfo customer={customer} />
              </TableCell>
              <TableCell className="text-right">
                <InvoicesLink customer={customer} />
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(customer.paid)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(customer.pending)}</TableCell>
              {hasActions && <TableCell className="pr-4">{actions(customer)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function CustomerInfo({ customer }: { customer: CustomerRow }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-8">
        {customer.imageUrl && <AvatarImage src={customer.imageUrl} alt={customer.name} />}
        <AvatarFallback className="text-xs">{initials(customer.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{customer.name}</p>
        <p className="truncate text-xs text-muted-foreground">{customer.email}</p>
      </div>
    </div>
  );
}

/** Количество счетов — ссылка на список счетов, отфильтрованный по почте клиента. */
function InvoicesLink({ customer }: { customer: CustomerRow }) {
  if (customer.invoiceCount === 0) return <span className="text-muted-foreground">0</span>;
  return (
    <Link
      href={`/dashboard/invoices?query=${encodeURIComponent(customer.email)}`}
      className="font-medium tabular-nums underline-offset-4 hover:underline"
    >
      {customer.invoiceCount}
    </Link>
  );
}
