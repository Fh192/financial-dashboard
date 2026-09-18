import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchRevenue } from "@/lib/data/dashboard";
import { formatCurrency } from "@/lib/format";
import { RevenueChartView } from "./revenue-chart-view";

export async function RevenueChart() {
  const data = await fetchRevenue();
  const total = data.reduce((sum, point) => sum + point.revenue, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Выручка</CardTitle>
        <CardDescription>Оплаченные счета за последние 12 месяцев: {formatCurrency(total)}</CardDescription>
      </CardHeader>
      <CardContent>
        {total > 0 ? (
          <RevenueChartView data={data} />
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">За последние 12 месяцев оплат не было.</p>
        )}
      </CardContent>
    </Card>
  );
}
