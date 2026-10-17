import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { SearchBox } from "@/components/search-box";
import { buttonVariants } from "@/components/ui/button";
import { countContacts, listContacts } from "@/lib/contacts";
import { initials, pluralize } from "@/lib/format";

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-title font-semibold uppercase">Контакты</h1>
        <Link href="/contacts/new" className={buttonVariants({ size: "lg" })}>
          <PlusIcon />
          Добавить контакт
        </Link>
      </div>

      <Suspense fallback={<ContactListSkeleton />}>
        <ContactList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ContactList({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const [contacts, total] = await Promise.all([listContacts(query), countContacts()]);

  const summary = query.trim()
    ? `Найдено: ${contacts.length} из ${total}`
    : `${total} ${pluralize(total, ["контакт", "контакта", "контактов"])}`;

  return (
    <div className="flex flex-col gap-4">
      <SearchBox initialQuery={query} />
      <p
        className="px-1 font-mono text-label tracking-mono text-subtle uppercase"
        aria-live="polite"
      >
        {summary}
      </p>

      {contacts.length === 0 ? (
        <div className="rounded-card border border-dashed px-6 py-14 text-center text-muted-foreground">
          {total === 0 ? (
            <>
              Пока нет ни одного контакта.{" "}
              <Link
                href="/contacts/new"
                className="border-b border-brand font-medium text-foreground hover:opacity-85"
              >
                Добавьте первый
              </Link>
            </>
          ) : (
            <>Никого не нашлось по запросу «{query.trim()}»</>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-line-soft overflow-hidden rounded-card bg-card shadow-card">
          {contacts.map((contact) => (
            <li key={contact.id}>
              <Link
                href={`/contacts/${contact.id}`}
                className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-background focus-visible:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset lg:gap-4 lg:px-7 lg:py-4"
              >
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
                  aria-hidden
                >
                  {initials(contact.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{contact.name}</span>
                  {contact.howWeMet && (
                    <span className="mt-0.5 block truncate text-sm text-subtle">
                      {contact.howWeMet}
                    </span>
                  )}
                </span>
                {(contact.phone || contact.email) && (
                  <span className="hidden shrink-0 text-right text-sm text-muted-foreground sm:block">
                    {contact.phone && <span className="block">{contact.phone}</span>}
                    {contact.email && <span className="block">{contact.email}</span>}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ContactListSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Загружаю контакты">
      <div className="h-12 animate-pulse rounded-full bg-muted" />
      <div className="h-4 w-32 animate-pulse rounded-full bg-muted" />
      <div className="h-96 animate-pulse rounded-card bg-muted" />
    </div>
  );
}
