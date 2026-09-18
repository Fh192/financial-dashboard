-- migrate:up

-- Переход на Better Auth. Имена полей соответствуют настройкам lib/auth.ts
-- (modelName/fields). Состав таблиц сверен с `npx auth generate`.

-- Пароли переезжают в accounts (provider_id = 'credential') и хешируются scrypt.
-- Старые bcrypt-хеши Better Auth не проверяет, поэтому пароли задаются заново
-- (pnpm db:seed или администратором).
ALTER TABLE users DROP COLUMN password;

-- Better Auth хранит роль строкой (несколько ролей — через запятую).
-- Вместо перечисления — text с тем же набором значений через CHECK.
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
ALTER TABLE users ALTER COLUMN role TYPE text USING role::text;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'viewer';
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'viewer'));
DROP TYPE user_role;

ALTER TABLE users
  ADD COLUMN email_verified boolean     NOT NULL DEFAULT false,
  ADD COLUMN image          text,
  -- Блокировка (плагин admin)
  ADD COLUMN banned         boolean     NOT NULL DEFAULT false,
  ADD COLUMN ban_reason     text,
  ADD COLUMN ban_expires    timestamptz;

-- Сессии хранятся в БД: их можно отозвать, а блокировка и смена роли
-- действуют сразу, без ожидания истечения токена
CREATE TABLE sessions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token           text        NOT NULL UNIQUE,
  expires_at      timestamptz NOT NULL,
  ip_address      text,
  user_agent      text,
  -- Администратор, который вошел под этим пользователем (плагин admin)
  impersonated_by text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sessions_user_id_idx    ON sessions (user_id);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);

-- Способы входа пользователя. Для входа по почте: provider_id = 'credential',
-- account_id = id пользователя, password = scrypt-хеш
CREATE TABLE accounts (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  account_id               text        NOT NULL,
  provider_id              text        NOT NULL,
  access_token             text,
  refresh_token            text,
  id_token                 text,
  access_token_expires_at  timestamptz,
  refresh_token_expires_at timestamptz,
  scope                    text,
  password                 text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_id, account_id)
);

CREATE INDEX accounts_user_id_idx ON accounts (user_id);

-- Одноразовые токены (сброс пароля, подтверждение почты)
CREATE TABLE verifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text        NOT NULL,
  value      text        NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX verifications_identifier_idx ON verifications (identifier);

-- Счетчики ограничения частоты запросов (например, попыток входа)
CREATE TABLE rate_limits (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  key          text    NOT NULL UNIQUE,
  count        integer NOT NULL CHECK (count >= 0),
  last_request bigint  NOT NULL -- мс с начала эпохи
);

-- Права: таблицы авторизации нужны только приложению. Роль отчетов их не видит:
-- там токены сессий и хеши паролей.
GRANT SELECT, INSERT, UPDATE, DELETE ON sessions, accounts, verifications, rate_limits TO dashboard_app;
-- Администратор может удалять пользователей (сессии и способы входа удалятся каскадно,
-- в журнале статусов автор станет NULL)
GRANT DELETE ON users TO dashboard_app;
GRANT SELECT (email_verified, image, banned) ON users TO dashboard_readonly;

-- migrate:down

REVOKE SELECT (email_verified, image, banned) ON users FROM dashboard_readonly;
REVOKE DELETE ON users FROM dashboard_app;

DROP TABLE IF EXISTS rate_limits;
DROP TABLE IF EXISTS verifications;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS sessions;

ALTER TABLE users
  DROP COLUMN ban_expires,
  DROP COLUMN ban_reason,
  DROP COLUMN banned,
  DROP COLUMN image,
  DROP COLUMN email_verified;

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'viewer');
ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::user_role;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'viewer';

-- Хеши паролей при откате не восстанавливаются: столбец возвращается пустым
ALTER TABLE users ADD COLUMN password text;
