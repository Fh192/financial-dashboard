import { ChartColumnIcon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/dal";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Вход" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { from } = await searchParams;
  const redirectTo = safeRedirectPath(typeof from === "string" ? from : null);

  // Уже вошедшего пользователя сразу отправляем дальше
  if (await getCurrentUser()) redirect(redirectTo);

  return (
    <main className="flex flex-1 items-center justify-center bg-muted/40 p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ChartColumnIcon className="size-4" />
          </span>
          Financial Dashboard
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Вход в систему</CardTitle>
            <CardDescription>Учетные записи выдает администратор</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm redirectTo={redirectTo} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
