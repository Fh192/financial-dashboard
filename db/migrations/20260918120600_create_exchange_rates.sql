-- migrate:up

-- Кэш официальных курсов ЦБ РФ: не ходить во внешний API на каждый запрос
-- и пересчитывать суммы по курсу на дату счета
CREATE TABLE exchange_rates (
  rate_date     date          NOT NULL,
  currency_code char(3)       NOT NULL CHECK (currency_code ~ '^[A-Z]{3}$'),
  nominal       integer       NOT NULL CHECK (nominal > 0),
  value         numeric(14,4) NOT NULL CHECK (value > 0), -- рублей за nominal единиц валюты
  fetched_at    timestamptz   NOT NULL DEFAULT now(),
  PRIMARY KEY (rate_date, currency_code)
);

-- migrate:down

DROP TABLE IF EXISTS exchange_rates;
