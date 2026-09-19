import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { convertUsdCents } from "@/lib/cbr/convert";
import { getExchangeRates } from "@/lib/data/exchange-rates";
import { formatCurrency, formatDate, formatMoney, formatRate } from "@/lib/format";

/** Сумма счета в рублях, евро и юанях по курсу ЦБ на дату счета. */
export async function InvoiceAmountInCurrencies({ amount, date }: { amount: number; date: string }) {
  const exchange = await getExchangeRates(date);
  const converted = exchange && convertUsdCents(amount, exchange.rates);

  return (
    <Card className="max-w-xl" data-testid="amount-in-currencies">
      <CardHeader>
        <CardTitle>Сумма по курсу ЦБ РФ</CardTitle>
        <CardDescription>
          {!exchange || !converted
            ? "Курсы ЦБ временно недоступны, попробуйте обновить страницу позже."
            : exchange.date === date
              ? `${formatCurrency(amount)} по курсу на дату счета, ${formatDate(date)}`
              : `${formatCurrency(amount)} по курсу на ${formatDate(exchange.date)}: на дату счета курса еще нет`}
        </CardDescription>
      </CardHeader>
      {exchange && converted && (
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Amount label="В рублях" value={formatMoney(converted.rub, "RUB")} hint={`1 $ = ${formatRate(exchange.rates.USD)}`} />
            {converted.eur !== null && (
              <Amount label="В евро" value={formatMoney(converted.eur, "EUR")} hint={`1 € = ${formatRate(exchange.rates.EUR)}`} />
            )}
            {converted.cny !== null && (
              <Amount label="В юанях" value={formatMoney(converted.cny, "CNY")} hint={`1 ¥ = ${formatRate(exchange.rates.CNY)}`} />
            )}
          </dl>
        </CardContent>
      )}
    </Card>
  );
}

function Amount({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
      <dd className="text-xs text-muted-foreground tabular-nums">{hint}</dd>
    </div>
  );
}
