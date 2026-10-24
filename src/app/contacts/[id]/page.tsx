import { PencilIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { addNote, deleteContact } from "@/app/actions";
import { DeleteContactButton } from "@/components/delete-contact-button";
import { NoteForm } from "@/components/note-form";
import { StatusMessage } from "@/components/status-message";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContact, listNotes, parseContactId } from "@/lib/contacts";
import { formatDateTime, initials, pluralize } from "@/lib/format";

export default function ContactPage(props: PageProps<"/contacts/[id]">) {
  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-2 text-nav font-medium tracking-caps uppercase hover:opacity-85"
      >
        <span className="text-brand" aria-hidden>
          ←
        </span>
        <span className="border-b border-brand pb-px">Все контакты</span>
      </Link>
      <Suspense fallback={<ContactSkeleton />}>
        <ContactDetails {...props} />
      </Suspense>
    </div>
  );
}

async function ContactDetails({ params, searchParams }: PageProps<"/contacts/[id]">) {
  const id = parseContactId((await params).id);
  if (id === null) notFound();

  const [contact, notes, { created }] = await Promise.all([
    getContact(id),
    listNotes(id),
    searchParams,
  ]);
  if (!contact) notFound();

  return (
    <>
      {created && <StatusMessage>Контакт добавлен</StatusMessage>}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3.5 lg:gap-4">
            <span
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-base font-medium text-muted-foreground lg:size-17 lg:text-lg"
              aria-hidden
            >
              {initials(contact.name)}
            </span>
            <h1 className="min-w-0 text-name font-semibold break-words">{contact.name}</h1>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <Link
              href={`/contacts/${contact.id}/edit`}
              className={buttonVariants({ variant: "outline" })}
            >
              <PencilIcon />
              Изменить
            </Link>
            <DeleteContactButton
              name={contact.name}
              noteCount={notes.length}
              action={deleteContact.bind(null, contact.id)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 border-t border-line-soft pt-4 sm:grid-cols-2 lg:gap-5 lg:pt-5">
            <Detail label="Откуда знакомы" className="sm:col-span-2">
              {contact.howWeMet || <Empty />}
            </Detail>
            <Detail label="Телефон">
              {contact.phone ? (
                <a
                  href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                  className="border-b border-line transition-colors hover:border-brand"
                >
                  {contact.phone}
                </a>
              ) : (
                <Empty />
              )}
            </Detail>
            <Detail label="Почта">
              {contact.email ? (
                <a
                  href={`mailto:${contact.email}`}
                  className="border-b border-line break-all transition-colors hover:border-brand"
                >
                  {contact.email}
                </a>
              ) : (
                <Empty />
              )}
            </Detail>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-baseline gap-2.5">
            Заметки
            {notes.length > 0 && (
              <span className="font-mono text-label font-normal text-brand">{notes.length}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <NoteForm action={addNote.bind(null, contact.id)} />

          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Заметок пока нет. Запишите, о чём поговорили или договорились.
            </p>
          ) : (
            <ol
              className="flex flex-col border-t border-line-soft"
              aria-label={`${notes.length} ${pluralize(notes.length, ["заметка", "заметки", "заметок"])}`}
            >
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="flex flex-col gap-1.5 border-b border-line-soft py-4 last:border-b-0 last:pb-0 sm:grid sm:grid-cols-[184px_minmax(0,1fr)] sm:gap-4 lg:grid-cols-[200px_minmax(0,1fr)]"
                >
                  <time dateTime={note.createdAt.toISOString()} className="text-note text-subtle">
                    {formatDateTime(note.createdAt)}
                  </time>
                  <p className="text-note whitespace-pre-wrap break-words">
                    {note.body}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function Detail({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <dt className="font-mono text-label tracking-mono text-subtle uppercase">{label}</dt>
      <dd className="mt-1.5 text-base whitespace-pre-wrap break-words">{children}</dd>
    </div>
  );
}

function Empty() {
  return <span className="text-subtle">—</span>;
}

function ContactSkeleton() {
  return (
    <div className="flex flex-col gap-5 lg:gap-6" aria-busy="true" aria-label="Загружаю контакт">
      <div className="h-52 animate-pulse rounded-card bg-muted" />
      <div className="h-72 animate-pulse rounded-card bg-muted" />
    </div>
  );
}
