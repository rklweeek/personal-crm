"use client";

import { useActionState } from "react";

import type { NoteFormState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type NoteFormProps = {
  action: (state: NoteFormState, formData: FormData) => Promise<NoteFormState>;
};

export function NoteForm({ action }: NoteFormProps) {
  const [state, formAction, pending] = useActionState(action, { body: "" });

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Label htmlFor="note-body" className="sr-only">
        Новая заметка
      </Label>
      <Textarea
        // Remount after each save so the field is cleared.
        key={state.savedAt ?? "initial"}
        id="note-body"
        name="body"
        defaultValue={state.body}
        placeholder="О чём поговорили, о чём договорились…"
        rows={3}
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? "note-error" : undefined}
      />
      {state.error && (
        <p id="note-error" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="mt-1 flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? (
            "Сохраняю…"
          ) : (
            <>
              Добавить заметку
              <span className="text-brand" aria-hidden>
                →
              </span>
            </>
          )}
        </Button>
        {state.savedAt && !pending && (
          <span role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2 rounded-full bg-brand" aria-hidden />
            Заметка сохранена
          </span>
        )}
      </div>
    </form>
  );
}
