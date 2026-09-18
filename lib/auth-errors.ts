type AuthError = { status: number; code?: string; message?: string };

/** Текст ошибки входа для пользователя по ответу Better Auth. */
export function loginErrorMessage(error: AuthError): string {
  switch (error.status) {
    case 400:
    case 401:
      return "Неверная почта или пароль.";
    case 403:
      // Например, учетная запись заблокирована — сообщение задано в lib/auth.ts
      return error.message || "Вход запрещен.";
    case 429:
      return "Слишком много попыток входа. Подождите минуту и попробуйте снова.";
    default:
      return "Не удалось войти. Попробуйте позже.";
  }
}

const ADMIN_MESSAGES: Record<string, string> = {
  USER_ALREADY_EXISTS: "Пользователь с такой почтой уже есть.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Пользователь с такой почтой уже есть.",
  YOU_CANNOT_BAN_YOURSELF: "Нельзя заблокировать самого себя.",
  YOU_CANNOT_REMOVE_YOURSELF: "Нельзя удалить самого себя.",
  YOU_ARE_NOT_ALLOWED_TO_SET_NON_EXISTENT_VALUE: "Такой роли нет.",
  INVALID_ROLE_TYPE: "Такой роли нет.",
  USER_NOT_FOUND: "Пользователь не найден: возможно, его уже удалили.",
  PASSWORD_TOO_SHORT: "Пароль слишком короткий.",
  PASSWORD_TOO_LONG: "Пароль слишком длинный.",
};

/** Текст ошибки управления пользователями по коду ошибки Better Auth. */
export function adminErrorMessage(error: { code?: string } | undefined): string {
  if (error?.code && ADMIN_MESSAGES[error.code]) return ADMIN_MESSAGES[error.code];
  if (error?.code?.startsWith("YOU_ARE_NOT_ALLOWED")) return "Недостаточно прав для этого действия.";
  return "Не удалось выполнить действие. Попробуйте еще раз.";
}
