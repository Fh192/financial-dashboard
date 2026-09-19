import { CheckIcon, ClockIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { InvoiceStatus } from "@/lib/definitions";

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return status === "paid" ? (
    <Badge data-testid="invoice-status" data-status={status} className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
      <CheckIcon data-icon="inline-start" />
      Оплачен
    </Badge>
  ) : (
    <Badge data-testid="invoice-status" data-status={status} variant="secondary">
      <ClockIcon data-icon="inline-start" />
      Ожидает
    </Badge>
  );
}
