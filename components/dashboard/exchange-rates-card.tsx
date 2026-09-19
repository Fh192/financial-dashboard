import { LandmarkIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { convertUsdCents } from "@/lib/cbr/convert";
import { fetchDashboardSummary } from "@/lib/data/dashboard";
import { getExchangeRates } from "@/lib/data/exchange-rates";
import { formatDate, formatMoney, formatRate } from "@/lib/format";

const CURRENCIES = [
  { code: "USD", label: "Доллар США" },
  { code: "EUR", label: "Евро" },
  { code: "CNY", label: "Юань" },
] as const;

/** Курсы ЦБ на сегодня и оплаченная выручка в рублях по этому курсу. */
export async function ExchangeRatesCard() {
  const [exchange, summary] = await Promise.all([getExchangeRates(), fetchDashboardSummary()]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LandmarkIcon className="size-4 text-muted-foreground" />
          Курсы ЦБ РФ
        </CardTitle>
        <CardDescription>
          {exchange ? `Официальные курсы на ${formatDate(exchange.date)}` : "Курсы временно недоступны"}
        </CardDescription>
      </CardHeader>
      {exchange && (
        <>
          <CardContent>
            <dl className="grid grid-cols-3 gap-2">
              {CURRENCIES.map(({ code, label }) => (
                <div key={code} className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground" title={label}>
                    {code}
                  </dt>
                  <dd className="text-sm font-medium tabular-nums">
                    {exchange.rates[code] ? formatRate(exchange.rates[code]) : "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            {(() => {
              const paid = convertUsdCents(summary.paid, exchange.rates);
              return paid ? `Оплачено по текущему курсу ≈ ${formatMoney(paid.rub, "RUB")}` : null;
            })()}
          </CardFooter>
        </>
      )}
    </Card>
  );
}

export function ExchangeRatesCardSkeleton() {
  return (
    <Card>
      <CardHeader className="gap-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-9" />
        ))}
      </CardContent>
    </Card>
  );
}
