"use client";

import { DownloadIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Скачивание CSV с текущим поиском из адреса страницы. Обычная ссылка, а не
 * next/link: файл отдает Route Handler, клиентская навигация здесь не нужна.
 */
export function ExportButton({ href }: { href: string }) {
  const query = useSearchParams().get("query");
  const url = query ? `${href}?${new URLSearchParams({ query })}` : href;

  return (
    <Button asChild variant="outline">
      <a href={url} download>
        <DownloadIcon />
        <span className="hidden sm:inline">CSV</span>
      </a>
    </Button>
  );
}
