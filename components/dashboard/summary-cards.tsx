import { BanknoteIcon, ClockIcon, FileTextIcon, type LucideIcon, UsersIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchDashboardSummary } from "@/lib/data/dashboard";
import { formatCurrency } from "@/lib/format";

export async function SummaryCards() {
  const { paid, pending, invoiceCount, customerCount } = await fetchDashboardSummary();

  return (
    <>
      <SummaryCard title="Оплачено" value={formatCurrency(paid)} icon={BanknoteIcon} />
      <SummaryCard title="Ожидает оплаты" value={formatCurrency(pending)} icon={ClockIcon} />
      <SummaryCard title="Всего счетов" value={invoiceCount.toLocaleString("ru-RU")} icon={FileTextIcon} />
      <SummaryCard title="Всего клиентов" value={customerCount.toLocaleString("ru-RU")} icon={UsersIcon} />
    </>
  );
}

function SummaryCard({ title, value, icon: Icon }: { title: string; value: string; icon: LucideIcon }) {
  return (
    <Card>
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
