-- migrate:up

CREATE TABLE invoice_status_history (
  id         bigint         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_id uuid           NOT NULL REFERENCES invoices (id) ON DELETE CASCADE,
  old_status invoice_status,          -- NULL, если счет только что создан
  new_status invoice_status NOT NULL,
  changed_by uuid           REFERENCES users (id) ON DELETE SET NULL,
  changed_at timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX invoice_status_history_invoice_idx
  ON invoice_status_history (invoice_id, changed_at DESC);

-- Журнал пишет только триггер. SECURITY DEFINER выполняет функцию с правами
-- владельца, поэтому роли приложения не нужно право INSERT в журнал
-- и подделать историю через приложение нельзя.
-- Автора изменения приложение передает в транзакции:
--   SELECT set_config('app.user_id', '<uuid>', true);
CREATE FUNCTION log_invoice_status_change() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO invoice_status_history (invoice_id, old_status, new_status, changed_by)
    VALUES (
      NEW.id,
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.status END,
      NEW.status,
      NULLIF(current_setting('app.user_id', true), '')::uuid
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION log_invoice_status_change() FROM PUBLIC;

CREATE TRIGGER invoices_log_status_change
  AFTER INSERT OR UPDATE OF status ON invoices
  FOR EACH ROW EXECUTE FUNCTION log_invoice_status_change();

-- migrate:down

DROP TRIGGER IF EXISTS invoices_log_status_change ON invoices;
DROP FUNCTION IF EXISTS log_invoice_status_change();
DROP TABLE IF EXISTS invoice_status_history;
