-- migrate:up

CREATE TABLE customers (
  id         uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  name       varchar(255) NOT NULL CHECK (btrim(name) <> ''),
  email      varchar(255) NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  image_url  varchar(255),
  created_at timestamptz  NOT NULL DEFAULT now(),
  updated_at timestamptz  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX customers_email_lower_key ON customers (lower(email));

-- GIN-индексы ускоряют поиск по подстроке (ILIKE '%запрос%')
CREATE INDEX customers_name_trgm_idx  ON customers USING gin (name gin_trgm_ops);
CREATE INDEX customers_email_trgm_idx ON customers USING gin (email gin_trgm_ops);

CREATE TRIGGER customers_set_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- migrate:down

DROP TABLE IF EXISTS customers;
