import { z } from "zod";

import { pluralize, toAppDate, type AppDate } from "@/lib/format";

export const CONTACT_FREQUENCIES = ["week", "month", "quarter", "year"] as const;

export type ContactFrequency = (typeof CONTACT_FREQUENCIES)[number];

/** null means "not set". */
export const contactFrequencySchema = z.enum(CONTACT_FREQUENCIES).nullable();

/** Slider labels in slider order: position 0 is "not set". */
export const SLIDER_LABELS = ["Не задано", "Неделя", "Месяц", "Квартал", "Год"] as const;

export const FREQUENCY_LABELS: Record<ContactFrequency, string> = {
  week: "раз в неделю",
  month: "раз в месяц",
  quarter: "раз в квартал",
  year: "раз в год",
};

export function frequencyToPosition(frequency: ContactFrequency | null) {
  return frequency === null ? 0 : CONTACT_FREQUENCIES.indexOf(frequency) + 1;
}

export function positionToFrequency(position: number) {
  return CONTACT_FREQUENCIES[position - 1] ?? null;
}

/** Text of the note that the "Связались" button adds. */
export const CONTACTED_NOTE_BODY = "Связались";

const MONTHS_IN_PERIOD = { month: 1, quarter: 3, year: 12 } as const;

function toUtcDay({ year, month, day }: AppDate) {
  return Date.UTC(year, month - 1, day);
}

/** Adds the period to the date; a missing day of the month is clamped to the last one. */
export function addPeriod(date: AppDate, frequency: ContactFrequency): AppDate {
  if (frequency === "week") {
    const next = new Date(toUtcDay(date) + 7 * 24 * 60 * 60 * 1000);
    return {
      year: next.getUTCFullYear(),
      month: next.getUTCMonth() + 1,
      day: next.getUTCDate(),
    };
  }

  const monthIndex = date.month - 1 + MONTHS_IN_PERIOD[frequency];
  const year = date.year + Math.floor(monthIndex / 12);
  const month = (monthIndex % 12) + 1;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { year, month, day: Math.min(date.day, lastDay) };
}

/** Whole calendar days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: AppDate, to: AppDate) {
  return Math.round((toUtcDay(to) - toUtcDay(from)) / (24 * 60 * 60 * 1000));
}

export type DueCandidate = {
  id: number;
  name: string;
  contactFrequency: ContactFrequency;
  lastContactedAt: Date;
};

export type DueContact = DueCandidate & { overdueDays: number };

/**
 * Keeps contacts whose due date is today or earlier and sorts them: the most
 * overdue first, then by name. `today` is a calendar date in the app time zone.
 */
export function pickDueContacts(candidates: DueCandidate[], today: AppDate): DueContact[] {
  return candidates
    .map((candidate) => {
      const due = addPeriod(toAppDate(candidate.lastContactedAt), candidate.contactFrequency);
      return { ...candidate, overdueDays: daysBetween(due, today) };
    })
    .filter((contact) => contact.overdueDays >= 0)
    .sort(
      (a, b) => b.overdueDays - a.overdueDays || a.name.localeCompare(b.name, "ru"),
    );
}

export function overdueLabel(overdueDays: number) {
  if (overdueDays === 0) return "срок сегодня";
  const days = pluralize(overdueDays, ["день", "дня", "дней"]);
  return `просрочено на ${overdueDays} ${days}`;
}
