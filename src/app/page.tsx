import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { SearchBox } from "@/components/search-box";
import { buttonVariants } from "@/components/ui/button";
import { countContacts, listContacts } from "@/lib/contacts";
import { initials, pluralize } from "@/lib/format";

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Контакты</h1>
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
    <div className="flex flex-col gap-3">
      <SearchBox initialQuery={query} />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {summary}
      </p>

      {contacts.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-background px-6 py-12 text-center text-muted-foreground">
          {total === 0 ? (
            <>
              Пока нет ни одного контакта.{" "}
              <Link href="/contacts/new" className="text-foreground underline underline-offset-4">
                Добавьте первый
              </Link>
            </>
          ) : (
            <>Никого не нашлось по запросу «{query.trim()}»</>
          )}
        </div>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl bg-background ring-1 ring-foreground/10">
          {contacts.map((contact) => (
            <li key={contact.id}>
              <Link
                href={`/contacts/${contact.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
              >
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
                  aria-hidden
                >
                  {initials(contact.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{contact.name}</span>
                  {contact.howWeMet && (
                    <span className="block truncate text-sm text-muted-foreground">
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
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Загружаю контакты">
      <div className="h-10 animate-pulse rounded-lg bg-muted" />
      <div className="h-5 w-32 animate-pulse rounded bg-muted" />
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
