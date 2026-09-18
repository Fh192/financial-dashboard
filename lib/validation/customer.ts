import { z } from "zod";

// Проверка формы клиента. Ограничения повторяют CHECK и UNIQUE в БД
// (непустое имя, формат почты), но с понятными сообщениями у полей.

export const customerSchema = z.object({
  name: z
    .string({ error: "Введите название или имя" })
    .trim()
    .min(1, { error: "Введите название или имя" })
    .max(255, { error: "Не длиннее 255 символов" }),
  email: z
    .string({ error: "Введите почту" })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Некорректный адрес почты" }).max(255, { error: "Не длиннее 255 символов" })),
  // Необязательная ссылка на логотип: только https, чтобы страница не грузила
  // картинки по незащищенному соединению
  imageUrl: z
    .string()
    .trim()
    .max(255, { error: "Не длиннее 255 символов" })
    .refine((v) => v === "" || /^https:\/\/\S+$/i.test(v), { error: "Ссылка должна начинаться с https://" })
    .transform((v) => (v === "" ? null : v)),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type CustomerField = keyof z.input<typeof customerSchema>;

export function parseCustomerForm(formData: FormData) {
  return customerSchema.safeParse({
    name: formData.get("name") ?? undefined,
    email: formData.get("email") ?? undefined,
    imageUrl: formData.get("imageUrl") ?? "",
  });
}
