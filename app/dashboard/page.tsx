import { LogOutIcon } from "lucide-react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { logout } from "@/lib/actions/auth";
import { can, requireUser } from "@/lib/dal";
import { type Permissions, roleLabels } from "@/lib/permissions";

export const metadata: Metadata = { title: "Панель" };

// Временная страница: проверка входа и ролей. Панель с данными — следующий шаг.
const capabilities: { label: string; permissions: Permissions }[] = [
  { label: "Просмотр счетов и клиентов", permissions: { invoice: ["read"], customer: ["read"] } },
  { label: "Создание и изменение счетов", permissions: { invoice: ["create", "update"] } },
  { label: "Удаление счетов", permissions: { invoice: ["delete"] } },
  { label: "Создание и изменение клиентов", permissions: { customer: ["create", "update"] } },
  { label: "Удаление клиентов", permissions: { customer: ["delete"] } },
  { label: "Выгрузка отчетов", permissions: { report: ["export"] } },
  { label: "Управление пользователями", permissions: { user: ["list", "create", "set-role", "ban"] } },
];

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <main className="mx-auto w-full max-w-xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Здравствуйте, {user.name}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm">
            Роль: <Badge variant="secondary">{roleLabels[user.role]}</Badge>
          </div>
          <ul className="flex flex-col gap-1.5 text-sm">
            {capabilities.map(({ label, permissions }) => {
              const allowed = can(user, permissions);
              return (
                <li key={label} className={allowed ? "" : "text-muted-foreground line-through"}>
                  {allowed ? "✓" : "✗"} {label}
                </li>
              );
            })}
          </ul>
        </CardContent>
        <CardFooter>
          <form action={logout}>
            <Button type="submit" variant="outline">
              <LogOutIcon className="size-4" />
              Выйти
            </Button>
          </form>
        </CardFooter>
      </Card>
    </main>
  );
}
