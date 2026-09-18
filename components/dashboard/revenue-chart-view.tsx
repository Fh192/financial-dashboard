"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { RevenuePoint } from "@/lib/definitions";
import { formatCurrency, formatCurrencyCompact, formatMonthLong, formatMonthShort } from "@/lib/format";

const chartConfig = {
  revenue: { label: "Выручка", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function RevenueChartView({ data }: { data: RevenuePoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
      <BarChart accessibilityLayer data={data} margin={{ left: 4, right: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={formatMonthShort} />
        <YAxis tickLine={false} axisLine={false} width={72} tickFormatter={(v: number) => formatCurrencyCompact(v)} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => formatMonthLong(String(payload?.[0]?.payload?.month ?? ""))}
              formatter={(value) => (
                <span className="font-mono font-medium tabular-nums">{formatCurrency(Number(value))}</span>
              )}
            />
          }
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
