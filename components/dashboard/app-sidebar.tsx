"use client";

import { ChartColumnIcon, LayoutDashboardIcon, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { CurrentUser } from "@/lib/dal";
import { hasPermission, type Permissions } from "@/lib/permissions";
import { NavUser } from "./nav-user";

type NavItem = { title: string; href: string; icon: LucideIcon; permissions: Permissions };

// Разделы появляются в меню по мере реализации. Пункт виден, только если
// у роли есть права на раздел (сама страница проверяет права еще раз).
const navItems: NavItem[] = [
  { title: "Обзор", href: "/dashboard", icon: LayoutDashboardIcon, permissions: { invoice: ["read"] } },
];

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ user }: { user: CurrentUser }) {
  const pathname = usePathname();
  const items = navItems.filter((item) => hasPermission(user.role, item.permissions));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <ChartColumnIcon className="size-4" />
                </span>
                <span className="truncate font-semibold">Financial Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive(pathname, item.href)} tooltip={item.title}>
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
