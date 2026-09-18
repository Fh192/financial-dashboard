import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

/**
 * Ресурсы и действия над ними. user и session — встроенные ресурсы плагина
 * admin (управление пользователями и их сессиями).
 */
export const statement = {
  ...defaultStatements,
  invoice: ["read", "create", "update", "delete"],
  customer: ["read", "create", "update", "delete"],
  report: ["export"],
} as const;

export const ac = createAccessControl(statement);

/** Только просмотр данных и выгрузка отчетов. */
export const viewer = ac.newRole({
  invoice: ["read"],
  customer: ["read"],
  report: ["export"],
});

/** Работа со счетами и клиентами. Удалять клиентов и управлять пользователями не может. */
export const manager = ac.newRole({
  invoice: ["read", "create", "update", "delete"],
  customer: ["read", "create", "update"],
  report: ["export"],
});

/** Полный доступ, включая пользователей и их сессии. */
export const admin = ac.newRole({
  invoice: ["read", "create", "update", "delete"],
  customer: ["read", "create", "update", "delete"],
  report: ["export"],
  ...adminAc.statements,
});

export const roles = { admin, manager, viewer };

export type Role = keyof typeof roles;
export const ROLES = Object.keys(roles) as Role[];
export const DEFAULT_ROLE: Role = "viewer";

export const roleLabels: Record<Role, string> = {
  admin: "Администратор",
  manager: "Менеджер",
  viewer: "Наблюдатель",
};

export type Permissions = {
  [K in keyof typeof statement]?: (typeof statement)[K][number][];
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && value in roles;
}

/**
 * Проверяет права роли. Better Auth хранит несколько ролей через запятую:
 * права дает хотя бы одна из них. Неизвестные роли прав не дают.
 */
export function hasPermission(role: string | null | undefined, permissions: Permissions): boolean {
  if (!role) return false;
  return role
    .split(",")
    .map((r) => r.trim())
    .filter(isRole)
    .some((r) => roles[r].authorize(permissions).success);
}
