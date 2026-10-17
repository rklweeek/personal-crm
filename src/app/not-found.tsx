import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-5 py-16 text-center lg:py-24">
      <h1 className="text-title font-semibold uppercase">
        Такой страницы <span className="text-brand">нет</span>
      </h1>
      <p className="text-muted-foreground">Возможно, контакт удалён или ссылка с ошибкой.</p>
      <Link href="/" className={buttonVariants({ size: "lg", className: "mt-1" })}>
        К списку контактов
        <span className="text-brand" aria-hidden>
          →
        </span>
      </Link>
    </div>
  );
}
