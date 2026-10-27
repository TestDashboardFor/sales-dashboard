"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import FilterBar from "@/components/dashboard/FilterBar";
import KpiCards from "@/components/dashboard/KpiCards";
import OrderFormModal from "@/components/dashboard/OrderFormModal";
import OrdersTable from "@/components/dashboard/OrdersTable";
import { BreakdownChart, TimeChart } from "@/components/dashboard/charts";
import { Button } from "@/components/ui";
import { api } from "@/lib/api";
import { useMe, useOptions } from "@/lib/queries";
import type { Filters, Order } from "@/lib/types";

type Editing = Order | "new" | null;

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const { data: options } = useOptions();
  const [filters, setFilters] = useState<Filters>({});
  const [editing, setEditing] = useState<Editing>(null);

  async function logout() {
    await api.logout();
    queryClient.clear();
    router.replace("/login");
  }

  const toggle = (key: "category" | "region") => (label: string) =>
    setFilters({ ...filters, [key]: filters[key] === label ? undefined : label });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold sm:text-xl">Sales Dashboard</h1>
          <p className="text-sm text-stone-500">Superstore orders, 2014–2017</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-stone-600 sm:inline">{me?.username}</span>
          <Button variant="secondary" onClick={logout}>
            Log out
          </Button>
        </div>
      </header>

      <FilterBar filters={filters} options={options} onChange={setFilters} />
      <KpiCards filters={filters} />

      <TimeChart filters={filters} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakdownChart
          title="Sales by category"
          subtitle="Click a bar to filter"
          by="category"
          measure="sales"
          filters={filters}
          selected={filters.category}
          onSelect={toggle("category")}
        />
        <BreakdownChart
          title="Sales by region"
          subtitle="Click a bar to filter"
          by="region"
          measure="sales"
          filters={filters}
          selected={filters.region}
          onSelect={toggle("region")}
        />
      </div>

      <BreakdownChart
        title="Profit by sub-category"
        subtitle="Red bars are loss-making"
        by="sub_category"
        measure="profit"
        filters={filters}
        showLabels={false}
        labelWidth={90}
      />

      <OrdersTable
        filters={filters}
        onCreate={() => setEditing("new")}
        onEdit={setEditing}
      />

      {editing && (
        <OrderFormModal
          order={editing === "new" ? null : editing}
          options={options}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
