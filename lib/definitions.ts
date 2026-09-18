// Типы данных, которые серверные функции отдают в компоненты.
// Суммы — в центах USD, даты — строками YYYY-MM-DD.

export type InvoiceStatus = "pending" | "paid";

export type DashboardSummary = {
  paid: number;
  pending: number;
  invoiceCount: number;
  customerCount: number;
};

export type RevenuePoint = {
  month: string;
  revenue: number;
};

export type LatestInvoice = {
  id: string;
  amount: number;
  status: InvoiceStatus;
  date: string;
  customerName: string;
  customerEmail: string;
  customerImageUrl: string | null;
};
