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
