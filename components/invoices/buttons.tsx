import { PencilIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { deleteInvoice } from "@/lib/actions/invoices";

export function CreateInvoiceButton() {
  return (
    <Button asChild>
      <Link href="/dashboard/invoices/create">
        <PlusIcon />
        <span className="hidden sm:inline">Новый счет</span>
      </Link>
    </Button>
  );
}

export function EditInvoiceButton({ id }: { id: string }) {
  return (
    <Button asChild size="icon" variant="ghost">
      <Link href={`/dashboard/invoices/${id}/edit`} aria-label="Изменить счет">
        <PencilIcon />
      </Link>
    </Button>
  );
}

export function DeleteInvoiceButton({ id, description }: { id: string; description: string }) {
  return (
    <ConfirmDeleteButton
      action={deleteInvoice.bind(null, id)}
      label="Удалить счет"
      title="Удалить счет?"
      description={`Счет (${description}) и история изменения его статуса будут удалены без возможности восстановления.`}
      successMessage="Счет удален"
    />
  );
}
