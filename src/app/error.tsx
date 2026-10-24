"use client";

import { RotateCwIcon } from "lucide-react";
import type { ErrorInfo } from "next/error";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";

export default function ErrorPage({ error, retry }: ErrorInfo) {
  // Server errors reach the browser without details, only with this id;
  // the server log prints the same id next to the full error.
  const digest =
    error instanceof Error && "digest" in error && typeof error.digest === "string"
      ? error.digest
      : null;

  return (
    <div className="flex flex-col items-center gap-5 py-16 text-center lg:py-24">
      <h1 className="text-title font-semibold uppercase">
        Что-то пошло <span className="text-brand">не так</span>
      </h1>
      <p className="text-muted-foreground">
        Не получилось загрузить или сохранить данные. Попробуйте ещё раз через минуту.
      </p>
      <div className="mt-1 flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={() => retry()}>
          <RotateCwIcon />
          Попробовать ещё раз
        </Button>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
          К списку контактов
        </Link>
      </div>
      {digest && (
        <p className="font-mono text-label tracking-mono text-subtle uppercase">
          Код ошибки: {digest}
        </p>
      )}
    </div>
  );
}
