import type { Metadata } from "next";
import { Suspense } from "react";
import { ExchangeRatesCard, ExchangeRatesCardSkeleton } from "@/components/dashboard/exchange-rates-card";
import { LatestInvoices } from "@/components/dashboard/latest-invoices";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import {
  LatestInvoicesSkeleton,
  RevenueChartSkeleton,
  SummaryCardsSkeleton,
} from "@/components/dashboard/skeletons";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { requirePermission } from "@/lib/dal";

export const metadata: Metadata = { title: "Обзор" };

export default async function OverviewPage() {
  await requirePermission({ invoice: ["read"], customer: ["read"] });

  // Каждый блок грузит свои данные и появляется, как только они готовы
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Обзор</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Suspense fallback={<SummaryCardsSkeleton />}>
          <SummaryCards />
        </Suspense>
      </div>
      <div className="grid gap-4 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <Suspense fallback={<RevenueChartSkeleton />}>
            <RevenueChart />
          </Suspense>
        </div>
        <div className="flex flex-col gap-4 lg:col-span-3">
          {/* Курсы грузятся из внешнего API — отдельный Suspense, чтобы не задерживать остальное */}
          <Suspense fallback={<ExchangeRatesCardSkeleton />}>
            <ExchangeRatesCard />
          </Suspense>
          <Suspense fallback={<LatestInvoicesSkeleton />}>
            <LatestInvoices />
          </Suspense>
        </div>
      </div>
    </>
  );
}
