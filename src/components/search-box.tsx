"use client";

import { Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";

const DEBOUNCE_MS = 250;

export function SearchBox({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery);
  // The query this box last navigated to, to tell our own URL updates
  // apart from outside ones (e.g. clicking the header link).
  const [sentQuery, setSentQuery] = useState(initialQuery);
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery);
    if (!pending && initialQuery !== sentQuery) {
      setQuery(initialQuery);
      setSentQuery(initialQuery);
    }
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  function navigate(value: string) {
    const trimmed = value.trim();
    setSentQuery(trimmed);
    const url = trimmed ? `${pathname}?q=${encodeURIComponent(trimmed)}` : pathname;
    startTransition(() => router.replace(url, { scroll: false }));
  }

  function handleChange(value: string) {
    setQuery(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate(value), DEBOUNCE_MS);
  }

  return (
    <form
      role="search"
      action={pathname}
      onSubmit={(event) => {
        event.preventDefault();
        clearTimeout(timer.current);
        navigate(query);
      }}
      className="relative"
    >
      {pending ? (
        <Loader2Icon
          className="pointer-events-none absolute top-1/2 left-4.5 size-4 -translate-y-1/2 animate-spin text-brand"
          aria-hidden
        />
      ) : (
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-4.5 size-4 -translate-y-1/2 text-subtle"
          aria-hidden
        />
      )}
      <Input
        type="search"
        name="q"
        value={query}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Найти по имени"
        aria-label="Найти контакт по имени"
        autoComplete="off"
        className="h-12 rounded-full pr-12 pl-11.5 [&::-webkit-search-cancel-button]:hidden"
      />
      {query && (
        <button
          type="button"
          onClick={() => handleChange("")}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-2 text-subtle hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          aria-label="Очистить поиск"
        >
          <XIcon className="size-4" />
        </button>
      )}
    </form>
  );
}
