"use client";

import { BanIcon, KeyRoundIcon, Loader2Icon, LogOutIcon, MoreHorizontalIcon, ShieldIcon, Trash2Icon, UnlockIcon } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  banUser,
  removeUser,
  revokeUserSessions,
  setUserPassword,
  setUserRole,
  unbanUser,
} from "@/lib/actions/users";
import type { ActionResult } from "@/lib/actions/types";
import { type Role, roleLabels, ROLES } from "@/lib/permissions";
import { BAN_DURATIONS } from "@/lib/validation/user";

type Props = {
  user: { id: string; name: string; role: Role; isBanned: boolean; activeSessions: number };
};

type DialogKind = "password" | "ban" | "remove" | null;

export function UserActions({ user }: Props) {
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [isPending, startTransition] = useTransition();

  // Запуск действия: уведомление об итоге, диалог закрывается только при успехе
  function run(action: () => Promise<ActionResult>, success: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(success);
        setDialog(null);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <>
      {/* modal={false}: иначе Radix не дает открыть диалог из пункта меню */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" aria-label={`Действия: ${user.name}`} disabled={isPending}>
            {isPending ? <Loader2Icon className="animate-spin" /> : <MoreHorizontalIcon />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ShieldIcon />
              Роль
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={user.role}
                onValueChange={(role) =>
                  role !== user.role &&
                  run(() => setUserRole(user.id, role), `Роль изменена: ${roleLabels[role as Role]}`)
                }
              >
                {ROLES.map((role) => (
                  <DropdownMenuRadioItem key={role} value={role}>
                    {roleLabels[role]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onSelect={() => setDialog("password")}>
            <KeyRoundIcon />
            Сменить пароль
          </DropdownMenuItem>
          {user.isBanned ? (
            <DropdownMenuItem onSelect={() => run(() => unbanUser(user.id), "Блокировка снята")}>
              <UnlockIcon />
              Разблокировать
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setDialog("ban")}>
              <BanIcon />
              Заблокировать
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            disabled={user.activeSessions === 0}
            onSelect={() => run(() => revokeUserSessions(user.id), "Сеансы завершены")}
          >
            <LogOutIcon />
            Завершить сеансы
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setDialog("remove")}>
            <Trash2Icon />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PasswordDialog
        open={dialog === "password"}
        onOpenChange={(open) => setDialog(open ? "password" : null)}
        userName={user.name}
        isPending={isPending}
        onSubmit={(password) => run(() => setUserPassword(user.id, password), "Пароль изменен, сеансы завершены")}
      />
      <BanDialog
        open={dialog === "ban"}
        onOpenChange={(open) => setDialog(open ? "ban" : null)}
        userName={user.name}
        isPending={isPending}
        onSubmit={(input) => run(() => banUser(user.id, input), "Пользователь заблокирован")}
      />
      <AlertDialog open={dialog === "remove"} onOpenChange={(open) => setDialog(open ? "remove" : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
            <AlertDialogDescription>
              {user.name} больше не сможет войти, его сеансы будут завершены. В истории статусов счетов автор
              изменений станет «система».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                run(() => removeUser(user.id), "Пользователь удален");
              }}
            >
              {isPending && <Loader2Icon className="animate-spin" />}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type DialogProps<T> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  isPending: boolean;
  onSubmit: (value: T) => void;
};

function PasswordDialog({ open, onOpenChange, userName, isPending, onSubmit }: DialogProps<string>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(String(new FormData(e.currentTarget).get("password") ?? ""));
          }}
        >
          <DialogHeader>
            <DialogTitle>Новый пароль</DialogTitle>
            <DialogDescription>
              Для пользователя {userName}. Все его сеансы будут завершены — войти можно будет только с новым паролем.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="new-password">Пароль</FieldLabel>
              <Input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
              <FieldDescription>От 8 до 128 символов. Передайте пароль пользователю лично.</FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Отмена
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2Icon className="animate-spin" />}
              Сменить пароль
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BanDialog({ open, onOpenChange, userName, isPending, onSubmit }: DialogProps<{ reason: string; duration: string }>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            onSubmit({ reason: String(data.get("reason") ?? ""), duration: String(data.get("duration") ?? "") });
          }}
        >
          <DialogHeader>
            <DialogTitle>Заблокировать пользователя</DialogTitle>
            <DialogDescription>
              {userName} не сможет войти, текущие сеансы будут завершены сразу.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="ban-reason">Причина</FieldLabel>
              <Input id="ban-reason" name="reason" maxLength={200} placeholder="Необязательно" />
            </Field>
            <Field>
              <FieldLabel htmlFor="ban-duration">Срок</FieldLabel>
              <Select name="duration" defaultValue="forever">
                <SelectTrigger id="ban-duration" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BAN_DURATIONS).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Отмена
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending && <Loader2Icon className="animate-spin" />}
              Заблокировать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
