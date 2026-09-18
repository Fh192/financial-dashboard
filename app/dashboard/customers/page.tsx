import type { Metadata } from "next";
import { Suspense } from "react";
import { CreateCustomerButton } from "@/components/customers/buttons";
import { CustomersTable } from "@/components/customers/customers-table";
import { ListSkeleton } from "@/components/list-skeleton";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { PaginationNav } from "@/components/pagination-nav";
import { SearchInput } from "@/components/search-input";
import { can, requirePermission } from "@/lib/dal";
import { fetchCustomersPages } from "@/lib/data/customers";
import { parsePage, parseQuery } from "@/lib/search";

export const metadata: Metadata = { title: "Клиенты" };

export default async function CustomersPage({ searchParams }: PageProps<"/dashboard/customers">) {
  const user = await requirePermission({ customer: ["read"] });
  const params = await searchParams;
  const query = parseQuery(params.query);
  const page = parsePage(params.page);
  const totalPages = await fetchCustomersPages(query);

  return (
    <>
      <PageBreadcrumbs items={[{ label: "Клиенты" }]} />
      <div className="flex items-center gap-2">
        <SearchInput placeholder="Название или почта" />
        {can(user, { customer: ["create"] }) && <CreateCustomerButton />}
      </div>
      <Suspense key={`${query}:${page}`} fallback={<ListSkeleton />}>
        <CustomersTable query={query} page={page} user={user} />
      </Suspense>
      <PaginationNav totalPages={totalPages} />
    </>
  );
}
