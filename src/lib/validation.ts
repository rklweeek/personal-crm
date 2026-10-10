import { z } from "zod";

// Error messages are shown to the user, so they are in Russian.
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Укажите имя")
    .max(200, "Слишком длинное имя — не больше 200 символов"),
  howWeMet: z
    .string()
    .trim()
    .max(1000, "Слишком длинный текст — не больше 1000 символов"),
  phone: z
    .string()
    .trim()
    .max(50, "Слишком длинный телефон")
    .refine((value) => value === "" || /^[\d\s()+\-.]{3,}$/.test(value), {
      message: "Телефон может содержать только цифры, пробелы, скобки, + и -",
    }),
  email: z
    .string()
    .trim()
    .max(200, "Слишком длинная почта")
    .refine((value) => value === "" || z.email().safeParse(value).success, {
      message: "Проверьте адрес почты — например, ivan@mail.ru",
    }),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactField = keyof ContactInput;

export const noteSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Напишите текст заметки")
    .max(5000, "Слишком длинная заметка — не больше 5000 символов"),
});
