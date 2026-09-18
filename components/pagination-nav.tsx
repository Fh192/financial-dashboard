"use client";

import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { paginationItems } from "@/lib/search";

export function PaginationNav({ totalPages }: { totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = Math.min(Math.max(Number(searchParams.get("page")) || 1, 1), Math.max(totalPages, 1));

  if (totalPages <= 1) return null;

  const pageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    return `${pathname}?${params}`;
  };

  return (
    <nav aria-label="Страницы" className="flex items-center justify-center gap-1">
      <PageArrow href={pageUrl(current - 1)} disabled={current <= 1} label="Предыдущая страница">
        <ChevronLeftIcon />
      </PageArrow>
      {paginationItems(current, totalPages).map((item, i) =>
        item === "..." ? (
          <span key={`gap-${i}`} className="flex size-9 items-center justify-center text-muted-foreground">
            <MoreHorizontalIcon className="size-4" />
          </span>
        ) : (
          <Button key={item} asChild size="icon" variant={item === current ? "outline" : "ghost"}>
            <Link href={pageUrl(item)} aria-current={item === current ? "page" : undefined}>
              {item}
            </Link>
          </Button>
        ),
      )}
      <PageArrow href={pageUrl(current + 1)} disabled={current >= totalPages} label="Следующая страница">
        <ChevronRightIcon />
      </PageArrow>
    </nav>
  );
}

function PageArrow({ href, disabled, label, children }: { href: string; disabled: boolean; label: string; children: React.ReactNode }) {
  if (disabled) {
    return (
      <Button size="icon" variant="ghost" disabled aria-label={label}>
        {children}
      </Button>
    );
  }
  return (
    <Button asChild size="icon" variant="ghost">
      <Link href={href} aria-label={label}>
        {children}
      </Link>
    </Button>
  );
}
