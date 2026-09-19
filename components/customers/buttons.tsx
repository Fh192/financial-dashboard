import { PencilIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { deleteCustomer } from "@/lib/actions/customers";

export function CreateCustomerButton() {
  return (
    <Button asChild>
      <Link href="/dashboard/customers/create" data-testid="customer-create">
        <PlusIcon />
        <span className="hidden sm:inline">Новый клиент</span>
      </Link>
    </Button>
  );
}

export function EditCustomerButton({ id }: { id: string }) {
  return (
    <Button asChild size="icon" variant="ghost">
      <Link href={`/dashboard/customers/${id}/edit`} data-testid="customer-edit" aria-label="Изменить клиента">
        <PencilIcon />
      </Link>
    </Button>
  );
}

export function DeleteCustomerButton({ id, name }: { id: string; name: string }) {
  return (
    <ConfirmDeleteButton
      testId="customer-delete"
      action={deleteCustomer.bind(null, id)}
      label="Удалить клиента"
      title="Удалить клиента?"
      description={`${name} будет удален без возможности восстановления. Клиента, у которого есть счета, удалить нельзя.`}
      successMessage="Клиент удален"
    />
  );
}
