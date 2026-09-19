// Ошибки бизнес-логики. Сервисы не знают, кто их вызвал: Server Action
// превращает ошибку в сообщение формы, REST API — в HTTP-статус.

export type ServiceErrorCode =
  | "NOT_FOUND" // записи нет (404)
  | "CONFLICT" // нарушено ограничение: дубль почты, у клиента есть счета (409)
  | "INVALID_REFERENCE"; // ссылка на несуществующую запись, например клиента (422)

export class ServiceError extends Error {
  constructor(
    readonly code: ServiceErrorCode,
    message: string,
    /** Поле формы, к которому относится ошибка */
    readonly field?: string,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}
