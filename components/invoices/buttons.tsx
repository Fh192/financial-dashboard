"use client";

import { Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteInvoice(id);
      if (result.ok) {
        toast.success("Счет удален");
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Удалить счет">
          <Trash2Icon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить счет?</AlertDialogTitle>
          <AlertDialogDescription>
            {description}. Счет и история изменения его статуса будут удалены без возможности восстановления.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(e) => {
              // Не закрываем диалог сразу: ждем ответа сервера
              e.preventDefault();
              handleDelete();
            }}
          >
            {isPending && <Loader2Icon className="animate-spin" />}
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
