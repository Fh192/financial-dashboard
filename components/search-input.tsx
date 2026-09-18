"use client";

import { SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "@/components/ui/input";

/**
 * Поиск хранится в URL (?query=...): ссылкой с результатами можно поделиться,
 * а кнопка «Назад» работает. Запрос уходит через 300 мс после ввода, а не на каждую букву.
 */
export function SearchInput({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    if (term.trim()) params.set("query", term);
    else params.delete("query");
    replace(params.size > 0 ? `${pathname}?${params}` : pathname);
  }, 300);

  return (
    <div className="relative flex-1">
      <label htmlFor="search" className="sr-only">
        Поиск
      </label>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id="search"
        type="search"
        className="pl-8"
        placeholder={placeholder}
        defaultValue={searchParams.get("query") ?? ""}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  );
}
