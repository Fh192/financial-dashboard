import { describe, expect, it } from "vitest";
import { adminErrorMessage, loginErrorMessage } from "./auth-errors";

describe("loginErrorMessage", () => {
  it("одинаково отвечает на неверную почту и неверный пароль", () => {
    expect(loginErrorMessage({ status: 401, code: "INVALID_EMAIL_OR_PASSWORD" })).toBe("Неверная почта или пароль.");
    expect(loginErrorMessage({ status: 400, code: "INVALID_EMAIL" })).toBe("Неверная почта или пароль.");
  });

  it("сообщает о превышении числа попыток", () => {
    expect(loginErrorMessage({ status: 429 })).toMatch(/Слишком много попыток/);
  });

  it("показывает причину запрета, если она есть", () => {
    expect(loginErrorMessage({ status: 403, message: "Учетная запись заблокирована." })).toBe(
      "Учетная запись заблокирована.",
    );
    expect(loginErrorMessage({ status: 403 })).toBe("Вход запрещен.");
  });

  it("не раскрывает детали прочих ошибок", () => {
    expect(loginErrorMessage({ status: 500, message: "connection refused" })).toBe("Не удалось войти. Попробуйте позже.");
  });
});

describe("adminErrorMessage", () => {
  it("переводит известные коды Better Auth", () => {
    expect(adminErrorMessage({ code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" })).toBe("Пользователь с такой почтой уже есть.");
    expect(adminErrorMessage({ code: "YOU_CANNOT_BAN_YOURSELF" })).toBe("Нельзя заблокировать самого себя.");
  });

  it("сводит все отказы в правах к одному сообщению", () => {
    expect(adminErrorMessage({ code: "YOU_ARE_NOT_ALLOWED_TO_DELETE_USERS" })).toBe("Недостаточно прав для этого действия.");
  });

  it("не показывает технические детали неизвестных ошибок", () => {
    expect(adminErrorMessage({ code: "SOMETHING_ELSE" })).toBe("Не удалось выполнить действие. Попробуйте еще раз.");
    expect(adminErrorMessage(undefined)).toBe("Не удалось выполнить действие. Попробуйте еще раз.");
  });
});
