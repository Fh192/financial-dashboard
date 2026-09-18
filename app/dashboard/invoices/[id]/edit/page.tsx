import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { InvoiceStatusHistory } from "@/components/invoices/status-history";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { updateInvoice } from "@/lib/actions/invoices";
import { requirePermission } from "@/lib/dal";
import { fetchCustomerOptions, fetchInvoiceById } from "@/lib/data/invoices";

export const metadata: Metadata = { title: "Изменение счета" };

export default async function EditInvoicePage({ params }: PageProps<"/dashboard/invoices/[id]/edit">) {
  await requirePermission({ invoice: ["update"] });
  const { id } = await params;
  const [invoice, customers] = await Promise.all([fetchInvoiceById(id), fetchCustomerOptions()]);

  if (!invoice) notFound();

  return (
    <>
      <PageBreadcrumbs items={[{ label: "Счета", href: "/dashboard/invoices" }, { label: "Изменение счета" }]} />
      <InvoiceForm
        customers={customers}
        invoice={invoice}
        action={updateInvoice.bind(null, invoice.id)}
        submitLabel="Сохранить"
      />
      <Suspense fallback={<Skeleton className="h-40 max-w-xl" />}>
        <InvoiceStatusHistory invoiceId={invoice.id} />
      </Suspense>
    </>
  );
}
