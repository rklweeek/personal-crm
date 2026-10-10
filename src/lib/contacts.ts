import "server-only";

import { and, asc, count, desc, eq, ilike } from "drizzle-orm";

import { db } from "@/db";
import { contacts, notes } from "@/db/schema";

// Escape LIKE wildcards so user input is matched literally.
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Lists contacts sorted by name. Every word of the query must appear
 * somewhere in the name, so "Петров Иван" finds "Иван Петров".
 */
export async function listContacts(query: string) {
  const words = query.trim().split(/\s+/).filter(Boolean);
  const filter = words.length
    ? and(...words.map((word) => ilike(contacts.name, `%${escapeLike(word)}%`)))
    : undefined;

  return db
    .select({
      id: contacts.id,
      name: contacts.name,
      howWeMet: contacts.howWeMet,
      phone: contacts.phone,
      email: contacts.email,
    })
    .from(contacts)
    .where(filter)
    .orderBy(asc(contacts.name), asc(contacts.id));
}

export async function countContacts() {
  const [row] = await db.select({ value: count() }).from(contacts);
  return row.value;
}

export async function getContact(id: number) {
  const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
  return contact;
}

export async function listNotes(contactId: number) {
  return db
    .select()
    .from(notes)
    .where(eq(notes.contactId, contactId))
    .orderBy(desc(notes.createdAt), desc(notes.id));
}

/** Parses a route param into a contact id, or null if it is not a valid id. */
export function parseContactId(raw: string) {
  if (!/^\d{1,9}$/.test(raw)) return null;
  return Number(raw);
}
