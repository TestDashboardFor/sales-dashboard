"use client";

import { useSummary } from "@/lib/queries";
import type { Filters } from "@/lib/types";
import { formatCurrency, formatInt, formatPercent } from "@/lib/format";
import { Card } from "../ui";

export default function KpiCards({ filters }: { filters: Filters }) {
  const { data, isPlaceholderData, isError } = useSummary(filters);

  const items = [
    { label: "Sales", value: data && formatCurrency(data.total_sales) },
    { label: "Profit", value: data && formatCurrency(data.total_profit) },
    {
      label: "Profit margin",
      value: data && formatPercent(data.profit_margin),
    },
    { label: "Orders", value: data && formatInt(data.orders) },
    { label: "Units sold", value: data && formatInt(data.total_quantity) },
  ];

  if (isError) {
    return <Card>Failed to load summary.</Card>;
  }

  return (
    <div
      className={`grid grid-cols-2 gap-3 transition-opacity md:grid-cols-3 lg:grid-cols-5 ${isPlaceholderData ? "opacity-50" : ""}`}
    >
      {items.map((item, i) => (
        <Card
          key={item.label}
          className={i === items.length - 1 ? "col-span-2 md:col-span-1" : ""}
        >
          <p className="text-xs text-stone-500">{item.label}</p>
          <p className="mt-1 text-xl font-semibold sm:text-2xl tabular-nums">
            {item.value ?? "—"}
          </p>
        </Card>
      ))}
    </div>
  );
}
