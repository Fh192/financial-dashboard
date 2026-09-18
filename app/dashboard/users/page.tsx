import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/list-skeleton";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { PaginationNav } from "@/components/pagination-nav";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { UsersTable } from "@/components/users/users-table";
import { can, requirePermission } from "@/lib/dal";
import { fetchUsersPages } from "@/lib/data/users";
import { parsePage, parseQuery } from "@/lib/search";

export const metadata: Metadata = { title: "Пользователи" };

export default async function UsersPage({ searchParams }: PageProps<"/dashboard/users">) {
  const currentUser = await requirePermission({ user: ["list"] });
  const params = await searchParams;
  const query = parseQuery(params.query);
  const page = parsePage(params.page);
  const totalPages = await fetchUsersPages(query);

  return (
    <>
      <PageBreadcrumbs items={[{ label: "Пользователи" }]} />
      <div className="flex items-center gap-2">
        <SearchInput placeholder="Имя или почта" />
        {can(currentUser, { user: ["create"] }) && (
          <Button asChild>
            <Link href="/dashboard/users/create">
              <PlusIcon />
              <span className="hidden sm:inline">Новый пользователь</span>
            </Link>
          </Button>
        )}
      </div>
      <Suspense key={`${query}:${page}`} fallback={<ListSkeleton />}>
        <UsersTable query={query} page={page} currentUser={currentUser} />
      </Suspense>
      <PaginationNav totalPages={totalPages} />
    </>
  );
}
