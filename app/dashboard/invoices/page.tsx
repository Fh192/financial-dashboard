import type { Metadata } from "next";
import { Suspense } from "react";
import { CreateInvoiceButton } from "@/components/invoices/buttons";
import { InvoicesTable } from "@/components/invoices/invoices-table";
import { ListSkeleton } from "@/components/list-skeleton";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { PaginationNav } from "@/components/pagination-nav";
import { SearchInput } from "@/components/search-input";
import { can, requirePermission } from "@/lib/dal";
import { fetchInvoicesPages } from "@/lib/data/invoices";
import { parsePage, parseQuery } from "@/lib/search";

export const metadata: Metadata = { title: "Счета" };

export default async function InvoicesPage({ searchParams }: PageProps<"/dashboard/invoices">) {
  const user = await requirePermission({ invoice: ["read"] });
  const params = await searchParams;
  const query = parseQuery(params.query);
  const page = parsePage(params.page);
  const totalPages = await fetchInvoicesPages(query);

  return (
    <>
      <PageBreadcrumbs items={[{ label: "Счета" }]} />
      <div className="flex items-center gap-2">
        <SearchInput placeholder="Клиент, почта, сумма, дата (ДД.ММ.ГГГГ) или статус" />
        {can(user, { invoice: ["create"] }) && <CreateInvoiceButton />}
      </div>
      {/* key: при новом поиске или странице снова показываем скелетон */}
      <Suspense key={`${query}:${page}`} fallback={<ListSkeleton />}>
        <InvoicesTable query={query} page={page} user={user} />
      </Suspense>
      <PaginationNav totalPages={totalPages} />
    </>
  );
}
