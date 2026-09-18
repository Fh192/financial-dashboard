-- migrate:up

-- Групповые роли без права входа. Пользователи для входа (с паролем) создаются
-- отдельно, вне репозитория, и получают одну из этих ролей:
--   CREATE ROLE dashboard_app_user LOGIN PASSWORD '...' IN ROLE dashboard_app;
-- Роли общие для всего кластера PostgreSQL, поэтому создаем их, только если их нет.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'dashboard_app') THEN
    CREATE ROLE dashboard_app NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'dashboard_readonly') THEN
    CREATE ROLE dashboard_readonly NOLOGIN;
  END IF;

  EXECUTE format(
    'GRANT CONNECT ON DATABASE %I TO dashboard_app, dashboard_readonly',
    current_database()
  );
END;
$$;

-- Объекты в схеме создает только владелец: у приложения нет DDL
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO dashboard_app, dashboard_readonly;

-- Приложение: только DML и только там, где он нужен
GRANT SELECT, INSERT, UPDATE         ON users          TO dashboard_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON customers      TO dashboard_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON invoices       TO dashboard_app;
GRANT SELECT, INSERT, UPDATE         ON exchange_rates TO dashboard_app;
-- Журнал статусов только для чтения: его пишет триггер
GRANT SELECT ON invoice_status_history, revenue TO dashboard_app;

-- Отчеты и аналитика: только чтение и без доступа к хешам паролей
GRANT SELECT (id, name, email, role, created_at, updated_at) ON users TO dashboard_readonly;
GRANT SELECT ON customers, invoices, invoice_status_history, revenue, exchange_rates
  TO dashboard_readonly;

-- migrate:down

REVOKE ALL ON users, customers, invoices, exchange_rates, invoice_status_history, revenue
  FROM dashboard_app, dashboard_readonly;
REVOKE USAGE ON SCHEMA public FROM dashboard_app, dashboard_readonly;

DO $$
BEGIN
  EXECUTE format(
    'REVOKE CONNECT ON DATABASE %I FROM dashboard_app, dashboard_readonly',
    current_database()
  );
END;
$$;

DROP ROLE IF EXISTS dashboard_readonly;
DROP ROLE IF EXISTS dashboard_app;
