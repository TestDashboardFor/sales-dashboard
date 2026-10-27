export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface Order {
  id: number;
  order_id: string;
  order_date: string;
  ship_date: string;
  ship_mode: string;
  customer_name: string;
  segment: string;
  city: string;
  state: string;
  region: string;
  category: string;
  sub_category: string;
  product_name: string;
  sales: number;
  quantity: number;
  discount: number;
  profit: number;
}

export type OrderInput = Omit<Order, "id">;

export interface OrderPage {
  items: Order[];
  total: number;
  page: number;
  page_size: number;
}

export interface Summary {
  total_sales: number;
  total_profit: number;
  total_quantity: number;
  orders: number;
  profit_margin: number;
}

export interface TimeseriesPoint {
  period: string;
  sales: number;
  profit: number;
  orders: number;
}

export interface BreakdownItem {
  label: string;
  sales: number;
  profit: number;
  orders: number;
}

export interface FilterOptions {
  regions: string[];
  categories: string[];
  segments: string[];
  date_min: string | null;
  date_max: string | null;
}

export interface Filters {
  date_from?: string;
  date_to?: string;
  region?: string;
  category?: string;
  segment?: string;
}

export type SortField =
  | "order_date"
  | "order_id"
  | "customer_name"
  | "region"
  | "category"
  | "sub_category"
  | "segment"
  | "sales"
  | "quantity"
  | "discount"
  | "profit";

export interface OrderQuery extends Filters {
  page: number;
  page_size: number;
  sort_by: SortField;
  sort_dir: "asc" | "desc";
  search?: string;
}
