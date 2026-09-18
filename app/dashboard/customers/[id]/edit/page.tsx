import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerForm } from "@/components/customers/customer-form";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { updateCustomer } from "@/lib/actions/customers";
import { requirePermission } from "@/lib/dal";
import { fetchCustomerById } from "@/lib/data/customers";

export const metadata: Metadata = { title: "Изменение клиента" };

export default async function EditCustomerPage({ params }: PageProps<"/dashboard/customers/[id]/edit">) {
  await requirePermission({ customer: ["update"] });
  const { id } = await params;
  const customer = await fetchCustomerById(id);

  if (!customer) notFound();

  return (
    <>
      <PageBreadcrumbs items={[{ label: "Клиенты", href: "/dashboard/customers" }, { label: customer.name }]} />
      <CustomerForm customer={customer} action={updateCustomer.bind(null, customer.id)} submitLabel="Сохранить" />
    </>
  );
}
