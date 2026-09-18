-- migrate:up

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'viewer');

CREATE TABLE users (
  id         uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  name       varchar(255) NOT NULL CHECK (btrim(name) <> ''),
  email      varchar(255) NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  password   text         NOT NULL, -- bcrypt-хеш, не сам пароль
  role       user_role    NOT NULL DEFAULT 'viewer',
  created_at timestamptz  NOT NULL DEFAULT now(),
  updated_at timestamptz  NOT NULL DEFAULT now()
);

-- Почта уникальна без учета регистра: User@Mail.ru и user@mail.ru — один адрес
CREATE UNIQUE INDEX users_email_lower_key ON users (lower(email));

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- migrate:down

DROP TABLE IF EXISTS users;
DROP TYPE IF EXISTS user_role;
