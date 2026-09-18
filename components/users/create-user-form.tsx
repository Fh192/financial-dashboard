"use client";

import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createUser } from "@/lib/actions/users";
import { DEFAULT_ROLE, roleLabels, ROLES } from "@/lib/permissions";

const roleHints = {
  admin: "Полный доступ, включая пользователей",
  manager: "Счета и клиенты, без удаления клиентов",
  viewer: "Только просмотр и выгрузка отчетов",
} as const;

export function CreateUserForm() {
  const [state, formAction, isPending] = useActionState(createUser, {
    message: null,
    errors: {},
    values: { role: DEFAULT_ROLE },
  });
  const { errors, values } = state;
  const fieldError = (messages?: string[]) => messages?.map((message) => ({ message }));

  return (
    <form action={formAction} key={JSON.stringify(values)} className="max-w-xl">
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Имя</FieldLabel>
          <Input id="name" name="name" autoComplete="off" defaultValue={values.name} aria-invalid={!!errors.name} />
          <FieldError errors={fieldError(errors.name)} />
        </Field>

        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Почта (логин)</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="off"
            defaultValue={values.email}
            aria-invalid={!!errors.email}
          />
          <FieldError errors={fieldError(errors.email)} />
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Пароль</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
          />
          {errors.password ? (
            <FieldError errors={fieldError(errors.password)} />
          ) : (
            <FieldDescription>От 8 до 128 символов. Передайте пароль пользователю лично.</FieldDescription>
          )}
        </Field>

        <Field data-invalid={!!errors.role}>
          <FieldLabel htmlFor="role">Роль</FieldLabel>
          <Select name="role" defaultValue={values.role}>
            <SelectTrigger id="role" className="w-full" aria-invalid={!!errors.role}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {roleLabels[role]} — {roleHints[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={fieldError(errors.role)} />
        </Field>

        {state.message && (
          <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircleIcon className="size-4 shrink-0" />
            {state.message}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/users">Отмена</Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2Icon className="animate-spin" />}
            Создать пользователя
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
