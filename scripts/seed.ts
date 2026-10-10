/**
 * Fills an empty database with realistic test contacts and notes.
 * Usage: pnpm db:seed [count]   (default: 1000)
 *
 * Refuses to run when contacts already exist, so it never mixes test data
 * into real data and never deletes anything.
 */
import "dotenv/config";

import { fakerRU as faker } from "@faker-js/faker";
import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { contacts, notes } from "../src/db/schema";

const total = Number(process.argv[2] ?? 1000);
if (!Number.isInteger(total) || total < 1) {
  throw new Error(`Invalid contact count: ${process.argv[2]}`);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const client = postgres(databaseUrl, { max: 1 });
const db = drizzle(client);

const cities = ["Москве", "Петербурге", "Казани", "Екатеринбурге", "Новосибирске", "Сочи", "Калининграде", "Нижнем Новгороде", "Самаре", "Ереване", "Тбилиси", "Стамбуле"];
const companies = ["Яндексе", "Сбере", "Тинькофф", "Ozon", "Авито", "VK", "Лаборатории Касперского", "2ГИС", "Альфа-Банке", "Wildberries", "МТС", "Ростелекоме"];
const events = ["конференции HighLoad", "митапе по продукту", "дне рождения Саши", "свадьбе Лены и Димы", "курсах английского", "йоге", "пробежке в парке", "хакатоне", "книжном клубе", "отпуске в Турции", "даче у Колиных", "Новый год у Ани"];
const universities = ["МГУ", "СПбГУ", "ВШЭ", "МФТИ", "Бауманке", "УрФУ", "КФУ", "НГУ"];
const hobbies = ["футбол", "бег", "настолки", "походы", "фотография", "волейбол", "шахматы", "сапборд"];
const topics = ["переезд", "новую работу", "ремонт квартиры", "отпуск", "детей и школу", "свой проект", "курсы по дизайну", "покупку машины", "здоровье родителей", "книги", "инвестиции", "сериалы"];
const promises = [
  "Обещал скинуть контакт хорошего стоматолога.",
  "Договорились встретиться на кофе в следующем месяце.",
  "Попросила совета по резюме — отправлю до пятницы.",
  "Хочет познакомиться с кем-то из маркетинга, подумать, кого предложить.",
  "Договорились вместе сходить на концерт.",
  "Нужно вернуть книгу, которую брал летом.",
  "Обещал позвать на новоселье.",
  "Договорились созвониться после праздников.",
  "Скинуть ссылку на курс, который обсуждали.",
  "Поздравить с днём рождения — не забыть!",
  "Ищет квартиру в аренду, спросить у знакомых.",
  "Предложил помочь с переездом в выходные.",
];

function pick<T>(items: readonly T[]) {
  return faker.helpers.arrayElement(items);
}

function howWeMet() {
  return pick([
    () => `Учились вместе в ${pick(universities)}`,
    () => `Работали вместе в ${pick(companies)}`,
    () => `Коллега по ${pick(companies)}, сидели в одном отделе`,
    () => `Познакомились на ${pick(events)}`,
    () => `Соседи по дому в ${pick(cities)}`,
    () => `Учились в одном классе, школа в ${pick(cities)}`,
    () => `Вместе играем в ${pick(hobbies)}`,
    () => `Дружим с детства, жили в ${pick(cities)}`,
    () => `Познакомил общий друг на ${pick(events)}`,
    () => `Бывший руководитель в ${pick(companies)}`,
    () => `Познакомились в поездке по ${pick(cities)}`,
    () => "",
  ])();
}

function phone() {
  return faker.helpers.replaceSymbols("+7 9## ###-##-##");
}

function noteBody() {
  return pick([
    () => `Созвонились, обсудили ${pick(topics)}. ${pick(promises)}`,
    () => `Встретились в ${pick(cities)}, поговорили про ${pick(topics)}.`,
    () => pick(promises),
    () => `Рассказал(а) про ${pick(topics)}. Всё хорошо, передаёт привет.\n${pick(promises)}`,
    () => `Переписывались — ${pick(topics)}. Вернуться к разговору через пару недель.`,
  ])();
}

async function main() {
  const [{ value: existing }] = await db.select({ value: count() }).from(contacts);
  if (existing > 0) {
    console.error(
      `The database already has ${existing} contacts. Seeding is only allowed into an empty database.`,
    );
    process.exitCode = 1;
    return;
  }

  faker.seed(20261010);
  const now = Date.now();
  const twoYearsAgo = new Date(now - 2 * 365 * 24 * 60 * 60 * 1000);

  const contactRows = Array.from({ length: total }, () => {
    const sex = faker.person.sexType();
    const firstName = faker.person.firstName(sex);
    const lastName = faker.person.lastName(sex);
    const createdAt = faker.date.between({ from: twoYearsAgo, to: new Date(now) });
    return {
      name: `${firstName} ${lastName}`,
      howWeMet: howWeMet(),
      phone: faker.datatype.boolean(0.85) ? phone() : "",
      email: faker.datatype.boolean(0.7)
        ? faker.internet.email({ firstName, lastName }).toLowerCase()
        : "",
      createdAt,
      updatedAt: createdAt,
    };
  });

  let insertedNotes = 0;
  await db.transaction(async (tx) => {
    const chunkSize = 250;
    for (let i = 0; i < contactRows.length; i += chunkSize) {
      const chunk = contactRows.slice(i, i + chunkSize);
      const inserted = await tx
        .insert(contacts)
        .values(chunk)
        .returning({ id: contacts.id, createdAt: contacts.createdAt });

      const noteRows = inserted.flatMap(({ id, createdAt }) =>
        Array.from({ length: faker.number.int({ min: 0, max: 4 }) }, () => ({
          contactId: id,
          body: noteBody(),
          createdAt: faker.date.between({ from: createdAt, to: new Date(now) }),
        })),
      );
      if (noteRows.length > 0) {
        await tx.insert(notes).values(noteRows);
        insertedNotes += noteRows.length;
      }
    }
  });

  console.log(`Inserted ${contactRows.length} contacts and ${insertedNotes} notes.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.end());
