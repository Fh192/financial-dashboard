import { CheckIcon, ClockIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { InvoiceStatus } from "@/lib/definitions";

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return status === "paid" ? (
    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
      <CheckIcon data-icon="inline-start" />
      Оплачен
    </Badge>
  ) : (
    <Badge variant="secondary">
      <ClockIcon data-icon="inline-start" />
      Ожидает
    </Badge>
  );
}
