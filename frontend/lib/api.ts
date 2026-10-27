import type {
  BreakdownItem,
  Filters,
  FilterOptions,
  Order,
  OrderInput,
  OrderPage,
  OrderQuery,
  Summary,
  TimeseriesPoint,
  User,
} from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function toQuery(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

function errorMessage(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return "Something went wrong";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, errorMessage(body?.detail));
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

export const api = {
  register: (username: string, password: string) =>
    request<User>("/auth/register", json("POST", { username, password })),
  login: (username: string, password: string) =>
    request<User>("/auth/login", json("POST", { username, password })),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  me: () => request<User>("/auth/me"),

  summary: (f: Filters) => request<Summary>(`/stats/summary${toQuery(f)}`),
  timeseries: (f: Filters) =>
    request<TimeseriesPoint[]>(`/stats/timeseries${toQuery(f)}`),
  breakdown: (by: "category" | "region" | "segment" | "sub_category", f: Filters) =>
    request<BreakdownItem[]>(`/stats/breakdown${toQuery({ ...f, by })}`),
  options: () => request<FilterOptions>("/stats/options"),

  orders: (q: OrderQuery) => request<OrderPage>(`/orders${toQuery(q)}`),
  createOrder: (data: OrderInput) => request<Order>("/orders", json("POST", data)),
  updateOrder: (id: number, data: Partial<OrderInput>) =>
    request<Order>(`/orders/${id}`, json("PATCH", data)),
  deleteOrder: (id: number) => request<void>(`/orders/${id}`, { method: "DELETE" }),
};
