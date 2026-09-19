"use client";

import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InvoiceFormState } from "@/lib/actions/invoices";
import type { CustomerOption, InvoiceForm as InvoiceData } from "@/lib/data/invoices";
import { MAX_AMOUNT } from "@/lib/validation/invoice";

type Props = {
  customers: CustomerOption[];
  action: (state: InvoiceFormState, formData: FormData) => Promise<InvoiceFormState>;
  invoice?: InvoiceData;
  submitLabel: string;
};

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function InvoiceForm({ customers, action, invoice, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState(action, {
    message: null,
    errors: {},
    values: invoice
      ? {
          customerId: invoice.customerId,
          amount: (invoice.amount / 100).toFixed(2),
          status: invoice.status,
          date: invoice.date,
        }
      : { status: "pending", date: todayISO() },
  });
  const { errors, values } = state;
  const fieldError = (messages?: string[]) => messages?.map((message) => ({ message }));

  // key пересоздает поля, когда сервер вернул значения: React сбрасывает
  // форму после action, а defaultValue применяется только при монтировании
  return (
    <form action={formAction} key={JSON.stringify(values)} className="max-w-xl">
      <FieldGroup>
        <Field data-invalid={!!errors.customerId}>
          <FieldLabel htmlFor="customerId">Клиент</FieldLabel>
          <Select name="customerId" defaultValue={values.customerId}>
            <SelectTrigger id="customerId" data-testid="field-customerId" className="w-full" aria-invalid={!!errors.customerId}>
              <SelectValue placeholder="Выберите клиента" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id} data-testid={`option-${c.id}`}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError data-testid="field-error-customerId" errors={fieldError(errors.customerId)} />
        </Field>

        <Field data-invalid={!!errors.amount}>
          <FieldLabel htmlFor="amount">Сумма, $</FieldLabel>
          <Input
            id="amount"
            name="amount"
            data-testid="field-amount"
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={values.amount}
            aria-invalid={!!errors.amount}
          />
          {errors.amount ? (
            <FieldError data-testid="field-error-amount" errors={fieldError(errors.amount)} />
          ) : (
            <FieldDescription>До {MAX_AMOUNT.toLocaleString("ru-RU")} $, центы через запятую или точку</FieldDescription>
          )}
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field data-invalid={!!errors.date}>
            <FieldLabel htmlFor="date">Дата</FieldLabel>
            <Input id="date" name="date" data-testid="field-date" type="date" defaultValue={values.date} aria-invalid={!!errors.date} />
            <FieldError data-testid="field-error-date" errors={fieldError(errors.date)} />
          </Field>

          <Field data-invalid={!!errors.status}>
            <FieldLabel htmlFor="status">Статус</FieldLabel>
            <Select name="status" defaultValue={values.status}>
              <SelectTrigger id="status" data-testid="field-status" className="w-full" aria-invalid={!!errors.status}>
                <SelectValue placeholder="Выберите статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending" data-testid="option-pending">Ожидает оплаты</SelectItem>
                <SelectItem value="paid" data-testid="option-paid">Оплачен</SelectItem>
              </SelectContent>
            </Select>
            <FieldError data-testid="field-error-status" errors={fieldError(errors.status)} />
          </Field>
        </div>

        {state.message && (
          <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircleIcon className="size-4 shrink-0" />
            {state.message}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/invoices">Отмена</Link>
          </Button>
          <Button type="submit" data-testid="form-submit" disabled={isPending}>
            {isPending && <Loader2Icon className="animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
