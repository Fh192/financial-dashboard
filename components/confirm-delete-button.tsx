"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";
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
import type { ActionResult } from "@/lib/actions/types";

type Props = {
  /** Server Action с уже привязанным id: deleteInvoice.bind(null, id) */
  action: () => Promise<ActionResult>;
  label: string;
  title: string;
  description: string;
  successMessage: string;
};

/** Кнопка удаления с подтверждением. Диалог закрывается только после ответа сервера. */
export function ConfirmDeleteButton({ action, label, title, description, successMessage }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(successMessage);
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label={label}>
          <Trash2Icon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(e) => {
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
