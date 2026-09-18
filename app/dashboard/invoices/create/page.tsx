import type { Metadata } from "next";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { createInvoice } from "@/lib/actions/invoices";
import { requirePermission } from "@/lib/dal";
import { fetchCustomerOptions } from "@/lib/data/invoices";

export const metadata: Metadata = { title: "Новый счет" };

export default async function CreateInvoicePage() {
  await requirePermission({ invoice: ["create"] });
  const customers = await fetchCustomerOptions();

  return (
    <>
      <PageBreadcrumbs items={[{ label: "Счета", href: "/dashboard/invoices" }, { label: "Новый счет" }]} />
      <InvoiceForm customers={customers} action={createInvoice} submitLabel="Создать счет" />
    </>
  );
}
