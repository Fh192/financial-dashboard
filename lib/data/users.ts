import "server-only";
import { requirePermission } from "@/lib/dal";
import { pool } from "@/lib/db";
import { DEFAULT_ROLE, isRole, type Role } from "@/lib/permissions";
import { containsPattern } from "@/lib/search";

export const USERS_PER_PAGE = 10;

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isBanned: boolean;
  banReason: string | null;
  banExpires: string | null;
  activeSessions: number;
  createdAt: string;
};

const SEARCH_CONDITION = "u.name ILIKE $1 OR u.email ILIKE $1";

export async function fetchFilteredUsers(query: string, page: number): Promise<UserRow[]> {
  await requirePermission({ user: ["list"] });

  const { rows } = await pool.query<Omit<UserRow, "role"> & { role: string }>(
    `
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      -- Истекшая блокировка снимается Better Auth при следующем входе,
      -- поэтому считаем пользователя заблокированным, только пока срок не прошел
      (u.banned AND (u.ban_expires IS NULL OR u.ban_expires > now())) AS "isBanned",
      u.ban_reason AS "banReason",
      to_char(u.ban_expires AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "banExpires",
      (SELECT COUNT(*)::int FROM sessions s WHERE s.user_id = u.id AND s.expires_at > now()) AS "activeSessions",
      to_char(u.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS "createdAt"
    FROM users u
    WHERE ${SEARCH_CONDITION}
    ORDER BY u.name, u.email
    LIMIT $2 OFFSET $3
    `,
    [containsPattern(query), USERS_PER_PAGE, (page - 1) * USERS_PER_PAGE],
  );
  return rows.map((r) => ({ ...r, role: isRole(r.role) ? r.role : DEFAULT_ROLE }));
}

export async function fetchUsersPages(query: string): Promise<number> {
  await requirePermission({ user: ["list"] });

  const { rows } = await pool.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM users u WHERE ${SEARCH_CONDITION}`,
    [containsPattern(query)],
  );
  return Math.ceil(rows[0].count / USERS_PER_PAGE);
}
