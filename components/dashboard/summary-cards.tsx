import { BanknoteIcon, ClockIcon, FileTextIcon, type LucideIcon, UsersIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchDashboardSummary } from "@/lib/data/dashboard";
import { formatCurrency } from "@/lib/format";

export async function SummaryCards() {
  const { paid, pending, invoiceCount, customerCount } = await fetchDashboardSummary();

  return (
    <>
      <SummaryCard testId="summary-paid" title="Оплачено" value={formatCurrency(paid)} icon={BanknoteIcon} />
      <SummaryCard testId="summary-pending" title="Ожидает оплаты" value={formatCurrency(pending)} icon={ClockIcon} />
      <SummaryCard testId="summary-invoices" title="Всего счетов" value={invoiceCount.toLocaleString("ru-RU")} icon={FileTextIcon} />
      <SummaryCard testId="summary-customers" title="Всего клиентов" value={customerCount.toLocaleString("ru-RU")} icon={UsersIcon} />
    </>
  );
}

type SummaryCardProps = { testId: string; title: string; value: string; icon: LucideIcon };

function SummaryCard({ testId, title, value, icon: Icon }: SummaryCardProps) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
