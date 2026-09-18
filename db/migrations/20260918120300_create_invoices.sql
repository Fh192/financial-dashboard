-- migrate:up

CREATE TYPE invoice_status AS ENUM ('pending', 'paid');

CREATE TABLE invoices (
  id          uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Клиента со счетами удалить нельзя: сначала нужно разобраться со счетами
  customer_id uuid           NOT NULL REFERENCES customers (id) ON DELETE RESTRICT,
  amount      integer        NOT NULL CHECK (amount > 0), -- в центах USD
  status      invoice_status NOT NULL DEFAULT 'pending',
  date        date           NOT NULL DEFAULT current_date,
  created_at  timestamptz    NOT NULL DEFAULT now(),
  updated_at  timestamptz    NOT NULL DEFAULT now()
);

-- Индекс по внешнему ключу: счета клиента и проверка при удалении клиента
CREATE INDEX invoices_customer_id_idx ON invoices (customer_id);
-- Последние счета и сортировка списка по дате
CREATE INDEX invoices_date_idx ON invoices (date DESC);
-- Суммы по статусу и выручка по месяцам (status = 'paid' + диапазон дат)
CREATE INDEX invoices_status_date_idx ON invoices (status, date);

CREATE TRIGGER invoices_set_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- migrate:down

DROP TABLE IF EXISTS invoices;
DROP TYPE IF EXISTS invoice_status;
