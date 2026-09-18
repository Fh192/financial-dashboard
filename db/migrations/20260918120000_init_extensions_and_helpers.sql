-- migrate:up

-- Триграммный поиск для ILIKE '%...%' по имени и почте клиентов
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Общая триггерная функция: обновляет updated_at при любом UPDATE строки
CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- migrate:down

DROP FUNCTION IF EXISTS set_updated_at();
DROP EXTENSION IF EXISTS pg_trgm;
