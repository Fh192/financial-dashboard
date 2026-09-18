"use client";

import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { CustomerFormState } from "@/lib/actions/customers";
import type { CustomerForm as CustomerData } from "@/lib/data/customers";

type Props = {
  action: (state: CustomerFormState, formData: FormData) => Promise<CustomerFormState>;
  customer?: CustomerData;
  submitLabel: string;
};

export function CustomerForm({ action, customer, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState(action, {
    message: null,
    errors: {},
    values: customer ? { name: customer.name, email: customer.email, imageUrl: customer.imageUrl ?? "" } : {},
  });
  const { errors, values } = state;
  const fieldError = (messages?: string[]) => messages?.map((message) => ({ message }));

  // key пересоздает поля с возвращенными сервером значениями (см. InvoiceForm)
  return (
    <form action={formAction} key={JSON.stringify(values)} className="max-w-xl">
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Название или имя</FieldLabel>
          <Input
            id="name"
            name="name"
            placeholder="ООО «Ромашка»"
            autoComplete="organization"
            defaultValue={values.name}
            aria-invalid={!!errors.name}
          />
          <FieldError errors={fieldError(errors.name)} />
        </Field>

        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Почта для счетов</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="billing@example.com"
            autoComplete="email"
            defaultValue={values.email}
            aria-invalid={!!errors.email}
          />
          <FieldError errors={fieldError(errors.email)} />
        </Field>

        <Field data-invalid={!!errors.imageUrl}>
          <FieldLabel htmlFor="imageUrl">Логотип</FieldLabel>
          <Input
            id="imageUrl"
            name="imageUrl"
            type="url"
            placeholder="https://..."
            defaultValue={values.imageUrl}
            aria-invalid={!!errors.imageUrl}
          />
          {errors.imageUrl ? (
            <FieldError errors={fieldError(errors.imageUrl)} />
          ) : (
            <FieldDescription>Необязательно. Без логотипа показываются инициалы.</FieldDescription>
          )}
        </Field>

        {state.message && (
          <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircleIcon className="size-4 shrink-0" />
            {state.message}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/customers">Отмена</Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2Icon className="animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
