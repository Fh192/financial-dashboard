import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CurrentUser } from "@/lib/dal";
import { fetchFilteredUsers, type UserRow } from "@/lib/data/users";
import { formatDate, formatDateTime, initials } from "@/lib/format";
import { roleLabels } from "@/lib/permissions";
import { UserActions } from "./user-actions";

type Props = { query: string; page: number; currentUser: CurrentUser };

export async function UsersTable({ query, page, currentUser }: Props) {
  const users = await fetchFilteredUsers(query, page);

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
        {query ? `По запросу «${query}» ничего не найдено.` : "Пользователей пока нет."}
      </div>
    );
  }

  // Над своей учетной записью действия недоступны: чтобы не лишить себя доступа
  const actions = (user: UserRow) =>
    user.id === currentUser.id ? (
      <span className="px-2 text-xs text-muted-foreground">Это вы</span>
    ) : (
      <UserActions user={user} />
    );

  return (
    <div className="rounded-xl border">
      {/* Телефон: карточки */}
      <ul className="divide-y md:hidden">
        {users.map((user) => (
          <li key={user.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <UserInfo user={user} />
              {actions(user)}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{roleLabels[user.role]}</Badge>
              <UserStatus user={user} />
              <span>Сеансов: {user.activeSessions}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* Планшет и компьютер: таблица */}
      <Table className="hidden md:table">
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Пользователь</TableHead>
            <TableHead>Роль</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="text-right">Сеансов</TableHead>
            <TableHead>Создан</TableHead>
            <TableHead className="pr-4 text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="pl-4">
                <UserInfo user={user} />
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{roleLabels[user.role]}</Badge>
              </TableCell>
              <TableCell>
                <UserStatus user={user} />
              </TableCell>
              <TableCell className="text-right tabular-nums">{user.activeSessions}</TableCell>
              <TableCell className="whitespace-nowrap">{formatDate(user.createdAt)}</TableCell>
              <TableCell className="pr-4 text-right">{actions(user)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function UserInfo({ user }: { user: UserRow }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-8">
        <AvatarFallback className="text-xs">{initials(user.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
    </div>
  );
}

function UserStatus({ user }: { user: UserRow }) {
  if (!user.isBanned) {
    return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Активен</Badge>;
  }
  const details = [
    user.banExpires ? `до ${formatDateTime(user.banExpires)}` : "бессрочно",
    user.banReason,
  ].filter(Boolean);
  return (
    <span className="flex flex-col items-start gap-0.5">
      <Badge variant="destructive">Заблокирован</Badge>
      <span className="text-xs text-muted-foreground">{details.join(" · ")}</span>
    </span>
  );
}
