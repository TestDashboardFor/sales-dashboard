"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrencyExact, formatInt, profitColor } from "@/lib/format";
import { useOrders } from "@/lib/queries";
import type { Filters, Order, SortField } from "@/lib/types";
import Select from "../Select";
import { Button, Card, inputClass } from "../ui";

interface Props {
  filters: Filters;
  onCreate: () => void;
  onEdit: (order: Order) => void;
}

const columns: { key: SortField; label: string; numeric?: boolean }[] = [
  { key: "order_date", label: "Date" },
  { key: "order_id", label: "Order" },
  { key: "customer_name", label: "Customer" },
  { key: "category", label: "Category" },
  { key: "region", label: "Region" },
  { key: "sales", label: "Sales", numeric: true },
  { key: "quantity", label: "Qty", numeric: true },
  { key: "profit", label: "Profit", numeric: true },
];

export default function OrdersTable({ filters, onCreate, onEdit }: Props) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<SortField>("order_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const filtersKey = JSON.stringify(filters);
  const [prevFiltersKey, setPrevFiltersKey] = useState(filtersKey);
  if (prevFiltersKey !== filtersKey) {
    setPrevFiltersKey(filtersKey);
    setPage(1);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isPlaceholderData, isError, error } = useOrders({
    ...filters,
    page,
    page_size: pageSize,
    sort_by: sortBy,
    sort_dir: sortDir,
    search: search || undefined,
  });

  const remove = useMutation({
    mutationFn: api.deleteOrder,
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  function toggleSort(key: SortField) {
    if (key === sortBy) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
    setPage(1);
  }

  function confirmDelete(order: Order) {
    if (
      window.confirm(`Delete order ${order.order_id} (${order.product_name})?`)
    ) {
      remove.mutate(order.id);
    }
  }

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Orders</h2>
          <p className="text-xs text-stone-500">
            {data ? `${formatInt(data.total)} matching rows` : "Loading…"}
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <input
            className={`${inputClass} min-w-0 flex-1 sm:!w-72 sm:flex-none`}
            placeholder="Search orders"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search orders"
          />
          <Button onClick={onCreate}>Add order</Button>
        </div>
      </div>

      {isError ? (
        <p className="text-sm text-red-700">{error.message}</p>
      ) : (
        <div
          className={`transition-opacity ${isPlaceholderData ? "opacity-50" : ""}`}
        >
          <div className="mb-3 flex gap-2 lg:hidden">
            <div className="min-w-0 flex-1">
              <Select
                label="Sort by"
                value={sortBy}
                options={columns.map((c) => ({
                  value: c.key,
                  label: `Sort by ${c.label.toLowerCase()}`,
                }))}
                onChange={(v) => {
                  setSortBy(v as SortField);
                  setPage(1);
                }}
              />
            </div>
            <Button
              variant="secondary"
              aria-label={sortDir === "asc" ? "Ascending" : "Descending"}
              onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
            >
              {sortDir === "asc" ? "↑ Asc" : "↓ Desc"}
            </Button>
          </div>

          <ul className="flex flex-col gap-2 lg:hidden">
            {data?.items.map((o) => (
              <li
                key={o.id}
                className="rounded-lg border border-stone-200 bg-white p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.customer_name}</p>
                    <p className="flex flex-wrap gap-x-2 text-xs text-stone-500">
                      <span className="whitespace-nowrap">{o.order_id}</span>
                      <span className="whitespace-nowrap">{o.order_date}</span>
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums">
                    {formatCurrencyExact(o.sales)}
                  </p>
                </div>
                <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-stone-600">
                  <span className="whitespace-nowrap">{o.category}</span>
                  <span className="whitespace-nowrap">{o.region}</span>
                  <span className="whitespace-nowrap">qty {o.quantity}</span>
                  <span
                    className={`whitespace-nowrap ${profitColor(o.profit)}`}
                  >
                    profit {formatCurrencyExact(o.profit)}
                  </span>
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => onEdit(o)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => confirmDelete(o)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
            {data?.items.length === 0 && (
              <li className="py-8 text-center text-sm text-stone-500">
                No orders match the current filters.
              </li>
            )}
          </ul>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs text-stone-500">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={`px-2 py-2 font-medium ${c.numeric ? "text-right" : ""}`}
                      aria-sort={
                        sortBy === c.key
                          ? sortDir === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        className={`inline-flex items-center gap-1 align-middle hover:text-stone-900 ${c.numeric ? "flex-row-reverse" : ""}`}
                        onClick={() => toggleSort(c.key)}
                      >
                        {c.label}
                        <span aria-hidden className="w-3">
                          {sortBy === c.key
                            ? sortDir === "asc"
                              ? "↑"
                              : "↓"
                            : ""}
                        </span>
                      </button>
                    </th>
                  ))}
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {data?.items.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-stone-100 hover:bg-stone-50"
                  >
                    <td className="px-2 py-2 whitespace-nowrap">
                      {o.order_date}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {o.order_id}
                    </td>
                    <td className="px-2 py-2">{o.customer_name}</td>
                    <td className="px-2 py-2">{o.category}</td>
                    <td className="px-2 py-2">{o.region}</td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {formatCurrencyExact(o.sales)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {o.quantity}
                    </td>
                    <td
                      className={`px-2 py-2 text-right tabular-nums ${profitColor(o.profit)}`}
                    >
                      {formatCurrencyExact(o.profit)}
                    </td>
                    <td className="px-2 py-2 text-right whitespace-nowrap">
                      <button
                        className="mr-3 text-blue-700 hover:underline"
                        onClick={() => onEdit(o)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-700 hover:underline"
                        onClick={() => confirmDelete(o)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {data?.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="py-8 text-center text-stone-500"
                    >
                      No orders match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <label className="flex items-center gap-2 text-stone-600">
          Rows per page
          <Select
            label="Rows per page"
            value={String(pageSize)}
            options={["10", "20", "50"]}
            triggerClassName={`${inputClass} flex !w-auto items-center gap-2 text-left`}
            onChange={(v) => {
              setPageSize(Number(v));
              setPage(1);
            }}
          />
        </label>
        <div className="flex items-center gap-2">
          <span className="text-stone-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}
