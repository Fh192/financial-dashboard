import { FileQuestionIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function InvoiceNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <FileQuestionIcon className="size-10 text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Счет не найден</h2>
        <p className="text-sm text-muted-foreground">Возможно, его удалили или ссылка неверная.</p>
      </div>
      <Button asChild variant="outline">
        <Link href="/dashboard/invoices">К списку счетов</Link>
      </Button>
    </div>
  );
}
