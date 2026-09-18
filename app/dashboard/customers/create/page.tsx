import type { Metadata } from "next";
import { CustomerForm } from "@/components/customers/customer-form";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { createCustomer } from "@/lib/actions/customers";
import { requirePermission } from "@/lib/dal";

export const metadata: Metadata = { title: "Новый клиент" };

export default async function CreateCustomerPage() {
  await requirePermission({ customer: ["create"] });

  return (
    <>
      <PageBreadcrumbs items={[{ label: "Клиенты", href: "/dashboard/customers" }, { label: "Новый клиент" }]} />
      <CustomerForm action={createCustomer} submitLabel="Добавить клиента" />
    </>
  );
}
