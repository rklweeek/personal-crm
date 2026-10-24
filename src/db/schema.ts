import { index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const contactFrequencyEnum = pgEnum("contact_frequency", [
  "week",
  "month",
  "quarter",
  "year",
]);

export const contacts = pgTable(
  "contacts",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull(),
    howWeMet: text("how_we_met").notNull().default(""),
    phone: text("phone").notNull().default(""),
    email: text("email").notNull().default(""),
    contactFrequency: contactFrequencyEnum("contact_frequency"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("contacts_name_idx").on(table.name)],
);

export const notes = pgTable(
  "notes",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("notes_contact_id_idx").on(table.contactId)],
);

export type Contact = typeof contacts.$inferSelect;
export type Note = typeof notes.$inferSelect;
