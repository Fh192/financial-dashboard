"use client";

import { RotateCcwIcon, TriangleAlertIcon } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

type Props = { error: Error & { digest?: string }; retry: () => void };

/** Экран ошибки для error.tsx: текст для пользователя и повтор загрузки. */
export function ErrorState({ error, retry }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <TriangleAlertIcon className="size-10 text-destructive" />
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Не удалось загрузить данные</h2>
        <p className="text-sm text-muted-foreground">
          Попробуйте еще раз. Если ошибка повторяется, сообщите администратору
          {error.digest && <> (код ошибки: {error.digest})</>}.
        </p>
      </div>
      <Button variant="outline" onClick={() => retry()}>
        <RotateCcwIcon />
        Повторить
      </Button>
    </div>
  );
}
