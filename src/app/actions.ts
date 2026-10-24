"use server";

import { and, eq, gt, sql } from "drizzle-orm";
import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { contacts, notes } from "@/db/schema";
import { getContact } from "@/lib/contacts";
import {
  CONTACTED_NOTE_BODY,
  contactFrequencySchema,
  type ContactFrequency,
} from "@/lib/keep-in-touch";
import {
  contactSchema,
  noteSchema,
  type ContactField,
  type ContactInput,
} from "@/lib/validation";

export type ContactFormState = {
  values: ContactInput;
  errors: Partial<Record<ContactField, string>>;
  formError?: string;
};

export type NoteFormState = {
  body: string;
  error?: string;
  savedAt?: number;
};

function readContactForm(formData: FormData): ContactInput {
  const read = (key: ContactField) => String(formData.get(key) ?? "");
  return {
    name: read("name"),
    howWeMet: read("howWeMet"),
    phone: read("phone"),
    email: read("email"),
  };
}

function validateContact(values: ContactInput) {
  const parsed = contactSchema.safeParse(values);
  if (parsed.success) return { data: parsed.data } as const;

  const errors: ContactFormState["errors"] = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as ContactField;
    errors[field] ??= issue.message;
  }
  return { errors } as const;
}

export async function createContact(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const values = readContactForm(formData);
  const result = validateContact(values);
  if (result.errors) return { values, errors: result.errors };

  const [created] = await db
    .insert(contacts)
    .values(result.data)
    .returning({ id: contacts.id });

  revalidatePath("/", "layout");
  redirect(`/contacts/${created.id}?created=1`);
}

export async function updateContact(
  id: number,
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const values = readContactForm(formData);
  const result = validateContact(values);
  if (result.errors) return { values, errors: result.errors };

  const updated = await db
    .update(contacts)
    .set(result.data)
    .where(eq(contacts.id, id))
    .returning({ id: contacts.id });

  if (updated.length === 0) {
    return { values, errors: {}, formError: "Контакт не найден — возможно, его удалили" };
  }

  revalidatePath("/", "layout");
  redirect(`/contacts/${id}`);
}

export async function deleteContact(id: number) {
  // The contact's notes go with it: notes.contact_id is ON DELETE CASCADE.
  // Already deleted (e.g. in another tab) - same result, so no error.
  await db.delete(contacts).where(eq(contacts.id, id));

  revalidatePath("/", "layout");
  redirect("/?deleted=1");
}

export async function addNote(
  contactId: number,
  _prev: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const body = String(formData.get("body") ?? "");
  const parsed = noteSchema.safeParse({ body });
  if (!parsed.success) {
    return { body, error: parsed.error.issues[0].message };
  }

  if (!(await getContact(contactId))) {
    return { body, error: "Контакт не найден — возможно, его удалили" };
  }

  await db.insert(notes).values({ contactId, body: parsed.data.body });

  refresh();
  revalidatePath("/", "layout");
  return { body: "", savedAt: Date.now() };
}

const CONTACT_NOT_FOUND = "Контакт не найден — возможно, его удалили";

export async function setContactFrequency(
  contactId: number,
  frequency: ContactFrequency | null,
): Promise<{ error?: string }> {
  const parsed = contactFrequencySchema.safeParse(frequency);
  if (!parsed.success) return { error: "Выберите один из вариантов" };

  const updated = await db
    .update(contacts)
    .set({ contactFrequency: parsed.data })
    .where(eq(contacts.id, contactId))
    .returning({ id: contacts.id });

  if (updated.length === 0) return { error: CONTACT_NOT_FOUND };

  revalidatePath("/", "layout");
  return {};
}

export async function markContacted(
  contactId: number,
): Promise<{ noteId: number } | { error: string }> {
  if (!(await getContact(contactId))) {
    // Refresh the home page so the deleted contact leaves the due block.
    revalidatePath("/", "layout");
    return { error: CONTACT_NOT_FOUND };
  }

  const [note] = await db
    .insert(notes)
    .values({ contactId, body: CONTACTED_NOTE_BODY })
    .returning({ id: notes.id });

  revalidatePath("/", "layout");
  return { noteId: note.id };
}

/**
 * Deletes a note added by markContacted. Only a fresh "Связались" note can be
 * deleted, so this never touches anything the user wrote.
 */
export async function undoMarkContacted(noteId: number): Promise<{ error?: string }> {
  await db
    .delete(notes)
    .where(
      and(
        eq(notes.id, noteId),
        eq(notes.body, CONTACTED_NOTE_BODY),
        gt(notes.createdAt, sql`now() - interval '2 minutes'`),
      ),
    );

  revalidatePath("/", "layout");
  return {};
}
