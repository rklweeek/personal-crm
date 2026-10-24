"use client";

import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { markContacted, undoMarkContacted } from "@/app/actions";
import { StatusMessage } from "@/components/status-message";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/format";
import { FREQUENCY_LABELS, overdueLabel, type ContactFrequency } from "@/lib/keep-in-touch";

export type DueContactRow = {
  id: number;
  name: string;
  contactFrequency: ContactFrequency;
  overdueDays: number;
};

type PendingRow = { name: string; index: number };

type Row =
  | { kind: "due"; contact: DueContactRow }
  | { kind: "pending"; id: number; name: string };

const COLLAPSED_ROWS = 10;
const UNDO_MS = 10_000;

export function DueContacts({ contacts }: { contacts: DueContactRow[] }) {
  const listId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const marked = useRef(new Map<number, ReturnType<typeof markContacted>>());
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState<Record<number, PendingRow>>({});
  const [error, setError] = useState<string>();

  useEffect(() => {
    const activeTimers = timers.current;
    return () => activeTimers.forEach((timer) => clearTimeout(timer));
  }, []);

  // The server drops a marked contact from the block, but its "note added" row
  // stays where it was until the undo time runs out, so the list does not jump.
  const rows: Row[] = contacts.map((contact) =>
    pending[contact.id]
      ? { kind: "pending", id: contact.id, name: contact.name }
      : { kind: "due", contact },
  );
  Object.entries(pending)
    .filter(([id]) => !contacts.some((contact) => contact.id === Number(id)))
    .sort(([, a], [, b]) => a.index - b.index)
    .forEach(([id, row]) => {
      rows.splice(Math.min(row.index, rows.length), 0, {
        kind: "pending",
        id: Number(id),
        name: row.name,
      });
    });

  const hiddenCount = Math.max(rows.length - COLLAPSED_ROWS, 0);
  const visibleRows = expanded ? rows : rows.slice(0, COLLAPSED_ROWS);

  function removePending(id: number) {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    marked.current.delete(id);

    // The row with the focus is about to disappear: move the focus to the heading.
    const row = listRef.current?.querySelector(`[data-row-id="${id}"]`);
    if (row?.contains(document.activeElement)) headingRef.current?.focus();

    setPending((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  async function handleMark(contact: DueContactRow, index: number) {
    if (pending[contact.id]) return;

    setError(undefined);
    setPending((current) => ({ ...current, [contact.id]: { name: contact.name, index } }));
    timers.current.set(
      contact.id,
      setTimeout(() => removePending(contact.id), UNDO_MS),
    );

    const request = markContacted(contact.id);
    marked.current.set(contact.id, request);
    const result = await request;
    if ("error" in result) {
      removePending(contact.id);
      setError(result.error);
    }
  }

  async function handleUndo(id: number) {
    const request = marked.current.get(id);
    if (!request) return;

    const result = await request;
    if ("noteId" in result) await undoMarkContacted(result.noteId);
    removePending(id);
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby={`${listId}-title`}>
      <h2
        id={`${listId}-title`}
        ref={headingRef}
        tabIndex={-1}
        className="flex items-baseline gap-2.5 px-1 text-card-title font-semibold uppercase focus-visible:outline-none"
      >
        Пора связаться
        <span className="font-mono text-label font-normal text-brand">{contacts.length}</span>
      </h2>

      {error && <StatusMessage>{error}</StatusMessage>}

      <ul
        id={listId}
        ref={listRef}
        className="divide-y divide-line-soft overflow-hidden rounded-card bg-card shadow-card"
      >
        {visibleRows.map((row, index) => (
          <li
            key={row.kind === "due" ? row.contact.id : row.id}
            data-row-id={row.kind === "due" ? row.contact.id : row.id}
            className="flex items-center gap-3 px-5 py-3.5 lg:gap-4 lg:px-7 lg:py-4"
          >
            {row.kind === "due" ? (
              <DueRow contact={row.contact} onMark={() => handleMark(row.contact, index)} />
            ) : (
              <PendingRowView name={row.name} onUndo={() => handleUndo(row.id)} />
            )}
          </li>
        ))}
      </ul>

      {rows.length > COLLAPSED_ROWS && (
        <Button
          type="button"
          variant="outline"
          className="self-start"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? (
            <>
              <ChevronUpIcon />
              Свернуть
            </>
          ) : (
            <>
              <ChevronDownIcon />
              Показать ещё {hiddenCount}
            </>
          )}
        </Button>
      )}
    </section>
  );
}

function DueRow({ contact, onMark }: { contact: DueContactRow; onMark: () => void }) {
  return (
    <>
      <Link
        href={`/contacts/${contact.id}`}
        className="-my-1 flex min-w-0 flex-1 items-center gap-3.5 rounded-inset py-1 transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:gap-4"
      >
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
          aria-hidden
        >
          {initials(contact.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{contact.name}</span>
          <span className="mt-0.5 block text-sm text-subtle">
            <span className="block sm:inline">{FREQUENCY_LABELS[contact.contactFrequency]}</span>
            <span className="hidden sm:inline"> · </span>
            <span className="block sm:inline">{overdueLabel(contact.overdueDays)}</span>
          </span>
        </span>
      </Link>
      <Button
        type="button"
        variant="outline"
        className="shrink-0"
        aria-label={`Связались: ${contact.name}`}
        onClick={onMark}
      >
        <CheckIcon className="hidden sm:block" />
        Связались
      </Button>
    </>
  );
}

function PendingRowView({ name, onUndo }: { name: string; onUndo: () => void }) {
  return (
    <>
      <p role="status" className="min-w-0 flex-1 text-sm font-medium">
        Заметка добавлена
        <span className="sr-only">: {name}</span>
      </p>
      <Button
        type="button"
        variant="outline"
        className="shrink-0"
        aria-label={`Отменить: ${name}`}
        autoFocus
        onClick={onUndo}
      >
        Отменить
      </Button>
    </>
  );
}
