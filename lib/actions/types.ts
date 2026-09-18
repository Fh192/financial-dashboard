// Общие типы результатов Server Actions (в "use server"-файлах можно
// экспортировать только async-функции, поэтому типы вынесены сюда).

/** Результат действия без формы (например, удаления). */
export type ActionResult = { ok: true } | { ok: false; message: string };

/** Состояние формы для useActionState. */
export type FormState<Field extends string> = {
  message: string | null;
  errors: Partial<Record<Field, string[]>>;
  // Введенные значения возвращаем в форму, чтобы при ошибке они не пропали
  values: Partial<Record<Field, string>>;
};

export const FORBIDDEN = "Недостаточно прав для этого действия.";
export const DB_ERROR = "Не удалось сохранить изменения. Попробуйте еще раз.";

/** Строковые значения полей формы — чтобы вернуть их в форму при ошибке. */
export function formValues<Field extends string>(formData: FormData, fields: readonly Field[]) {
  const values: Partial<Record<Field, string>> = {};
  for (const field of fields) {
    const value = formData.get(field);
    if (typeof value === "string") values[field] = value;
  }
  return values;
}
