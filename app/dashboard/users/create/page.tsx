import type { Metadata } from "next";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { CreateUserForm } from "@/components/users/create-user-form";
import { requirePermission } from "@/lib/dal";

export const metadata: Metadata = { title: "Новый пользователь" };

export default async function CreateUserPage() {
  await requirePermission({ user: ["create"] });

  return (
    <>
      <PageBreadcrumbs items={[{ label: "Пользователи", href: "/dashboard/users" }, { label: "Новый пользователь" }]} />
      <CreateUserForm />
    </>
  );
}
