import { ArrowLeftIcon, CheckCircle2Icon, PencilIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { addNote } from "@/app/actions";
import { NoteForm } from "@/components/note-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContact, listNotes, parseContactId } from "@/lib/contacts";
import { formatDateTime, pluralize } from "@/lib/format";

export default function ContactPage(props: PageProps<"/contacts/[id]">) {
  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Все контакты
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
      {created && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
        >
          <CheckCircle2Icon className="size-4" />
          Контакт добавлен
        </p>
      )}

      <Card>
        <CardHeader className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight break-words">{contact.name}</h1>
          <Link
            href={`/contacts/${contact.id}/edit`}
            className={buttonVariants({ variant: "outline" })}
          >
            <PencilIcon />
            Изменить
          </Link>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Откуда знакомы" className="sm:col-span-2">
              {contact.howWeMet || <Empty />}
            </Detail>
            <Detail label="Телефон">
              {contact.phone ? (
                <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="hover:underline">
                  {contact.phone}
                </a>
              ) : (
                <Empty />
              )}
            </Detail>
            <Detail label="Почта">
              {contact.email ? (
                <a href={`mailto:${contact.email}`} className="break-all hover:underline">
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
          <CardTitle className="text-lg">
            Заметки
            {notes.length > 0 && (
              <span className="ml-2 font-normal text-muted-foreground">{notes.length}</span>
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
              className="flex flex-col gap-4"
              aria-label={`${notes.length} ${pluralize(notes.length, ["заметка", "заметки", "заметок"])}`}
            >
              {notes.map((note) => (
                <li key={note.id} className="border-l-2 border-border pl-4">
                  <time
                    dateTime={note.createdAt.toISOString()}
                    className="text-xs text-muted-foreground"
                  >
                    {formatDateTime(note.createdAt)}
                  </time>
                  <p className="mt-1 text-sm whitespace-pre-wrap break-words">{note.body}</p>
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
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words">{children}</dd>
    </div>
  );
}

function Empty() {
  return <span className="text-muted-foreground">—</span>;
}

function ContactSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Загружаю контакт">
      <div className="h-44 animate-pulse rounded-xl bg-muted" />
      <div className="h-64 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
