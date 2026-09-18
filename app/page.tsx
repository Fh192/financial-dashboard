import { redirect } from "next/navigation";

// Отдельной главной страницы нет: сразу в панель (или на вход, если сессии нет)
export default function Home() {
  redirect("/dashboard");
}
