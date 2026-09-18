-- migrate:up

-- Выручка за последние 12 месяцев (включая текущий), считается из оплаченных
-- счетов. Месяцы без оплат тоже попадают в выборку, с нулевой выручкой.
-- security_invoker: права проверяются у того, кто читает представление.
CREATE VIEW revenue WITH (security_invoker = true) AS
SELECT
  m.month::date                      AS month,
  COALESCE(SUM(i.amount), 0)::bigint AS revenue -- в центах USD
FROM generate_series(
       date_trunc('month', current_date) - interval '11 months',
       date_trunc('month', current_date),
       interval '1 month'
     ) AS m(month)
LEFT JOIN invoices i
  ON i.status = 'paid'
 AND i.date >= m.month
 AND i.date <  m.month + interval '1 month'
GROUP BY m.month
ORDER BY m.month;

-- migrate:down

DROP VIEW IF EXISTS revenue;
