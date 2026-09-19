"use client";

import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react";
import { useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { logout } from "@/lib/actions/auth";
import type { CurrentUser } from "@/lib/dal";
import { initials } from "@/lib/format";
import { roleLabels } from "@/lib/permissions";

function UserAvatar({ user }: { user: CurrentUser }) {
  return (
    <Avatar className="size-8 rounded-lg">
      {user.image && <AvatarImage src={user.image} alt={user.name} />}
      <AvatarFallback className="rounded-lg">{initials(user.name)}</AvatarFallback>
    </Avatar>
  );
}

export function NavUser({ user }: { user: CurrentUser }) {
  const { isMobile } = useSidebar();
  const [isPending, startTransition] = useTransition();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" data-testid="user-menu" className="data-[state=open]:bg-sidebar-accent">
              <UserAvatar user={user} />
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{roleLabels[user.role]}</span>
              </span>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="flex items-center gap-2 font-normal">
              <UserAvatar user={user} />
              <span className="grid flex-1 text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </span>
            </DropdownMenuLabel>
            <DropdownMenuLabel className="pt-0">
              <Badge variant="secondary">{roleLabels[user.role]}</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-testid="logout" disabled={isPending} onSelect={() => startTransition(() => logout())}>
              <LogOutIcon />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
