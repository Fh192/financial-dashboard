import { ApiError, apiRoute, readQuery, requireApiUser } from "@/lib/api/http";
import { ExchangeRatesQuerySchema } from "@/lib/api/schemas";
import { getExchangeRates } from "@/lib/data/exchange-rates";

// GET /api/v1/exchange-rates?date=YYYY-MM-DD — курсы ЦБ РФ на дату (кэш в БД)
export const GET = apiRoute(async (request) => {
  await requireApiUser();
  const { date } = readQuery(request, ExchangeRatesQuerySchema);

  const rates = await getExchangeRates(date);
  if (!rates) throw new ApiError(503, "RATES_UNAVAILABLE", "Курсы ЦБ временно недоступны.");
  return Response.json(rates);
});
