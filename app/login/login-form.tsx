"use client";

import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { loginErrorMessage } from "@/lib/auth-errors";

type State = { error: string | null; email: string };

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();

  // Вход идет через HTTP-эндпоинт Better Auth (/api/auth/sign-in/email),
  // а не через Server Action: только так срабатывает ограничение числа попыток
  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prev, formData) => {
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");

      const { error } = await authClient.signIn.email({ email, password });
      if (error) return { error: loginErrorMessage(error), email };

      router.replace(redirectTo);
      router.refresh();
      return { error: null, email };
    },
    { error: null, email: "" },
  );

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Электронная почта</FieldLabel>
          <Input
            id="email"
            data-testid="field-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="user@example.com"
            defaultValue={state.email}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Пароль</FieldLabel>
          <Input id="password" name="password" data-testid="field-password" type="password" autoComplete="current-password" required />
        </Field>

        {state.error && (
          <p role="alert" data-testid="login-error" className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircleIcon className="size-4 shrink-0" />
            {state.error}
          </p>
        )}

        <Button type="submit" data-testid="form-submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2Icon className="size-4 animate-spin" />}
          Войти
        </Button>
      </FieldGroup>
    </form>
  );
}
