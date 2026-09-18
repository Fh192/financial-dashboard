"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Выход: сессия удаляется из БД, cookie очищаются плагином nextCookies. */
export async function logout() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
