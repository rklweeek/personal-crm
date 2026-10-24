/** All dates and times in the app are shown and counted in this time zone. */
export const APP_TIME_ZONE = "Europe/Moscow";

const dateTimeFormat = new Intl.DateTimeFormat("ru-RU", {
  timeZone: APP_TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(date: Date) {
  return dateTimeFormat.format(date);
}

const dateParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

export type AppDate = { year: number; month: number; day: number };

/** Calendar date (month is 1-12) of the moment in the app time zone. */
export function toAppDate(date: Date): AppDate {
  const parts = dateParts.formatToParts(date);
  const read = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day") };
}

/** Picks the Russian plural form: pluralize(5, ["контакт", "контакта", "контактов"]). */
export function pluralize(n: number, forms: [one: string, few: string, many: string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}
