"use server";

import { eq } from "drizzle-orm";
import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { contacts, notes } from "@/db/schema";
import { getContact } from "@/lib/contacts";
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
  return { body: "", savedAt: Date.now() };
}
