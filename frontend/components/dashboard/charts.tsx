"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { colors } from "@/lib/colors";
import { formatCompact, formatCurrency, formatInt } from "@/lib/format";
import { useBreakdown, useTimeseries } from "@/lib/queries";
import type { BreakdownItem, Filters, TimeseriesPoint } from "@/lib/types";
import { Card } from "../ui";

const axisTick = { fontSize: 12, fill: colors.inkSecondary };

function tickPeriods(periods: string[]) {
  const step = periods.length > 24 ? 12 : periods.length > 12 ? 3 : 1;
  return periods.filter((p) => (Number(p.slice(5, 7)) - 1) % step === 0);
}

const monthLabel = (period: string) =>
  new Date(period).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });

function TooltipShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-stone-500">{title}</p>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function TooltipRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-0.5 w-3" style={{ background: color }} />
      <span className="font-semibold tabular-nums text-stone-900">{value}</span>
      <span className="text-stone-500">{label}</span>
    </div>
  );
}

function Frame({
  stale,
  tall = false,
  children,
}: {
  stale: boolean;
  tall?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${tall ? "h-[30rem]" : "h-60"} transition-opacity ${stale ? "opacity-50" : ""}`}
    >
      {children}
    </div>
  );
}

export function TimeChart({ filters }: { filters: Filters }) {
  const { data = [], isPlaceholderData, isError } = useTimeseries(filters);

  return (
    <Card title="Sales and profit over time" subtitle="Monthly, USD">
      {isError ? (
        <p className="text-sm">Failed to load chart.</p>
      ) : (
        <>
          <div className="mb-2 flex gap-4 text-xs text-stone-600">
            {[
              ["Sales", colors.sales],
              ["Profit", colors.profit],
            ].map(([label, color]) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="h-0.5 w-4" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
          <Frame stale={isPlaceholderData}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid vertical={false} stroke={colors.grid} />
                <XAxis
                  dataKey="period"
                  ticks={tickPeriods(data.map((d) => d.period))}
                  tickFormatter={monthLabel}
                  tick={axisTick}
                  tickLine={false}
                  axisLine={{ stroke: colors.grid }}
                  minTickGap={24}
                />
                <YAxis
                  tickFormatter={formatCompact}
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  domain={[(min: number) => Math.min(0, min), "auto"]}
                  tickCount={7}
                />
                <Tooltip
                  cursor={{
                    stroke: colors.inkSecondary,
                    strokeDasharray: "3 3",
                  }}
                  content={({ active, payload }) => {
                    const point = payload?.[0]?.payload as
                      TimeseriesPoint | undefined;
                    if (!active || !point) return null;
                    return (
                      <TooltipShell title={monthLabel(point.period)}>
                        <TooltipRow
                          color={colors.sales}
                          label="Sales"
                          value={formatCurrency(point.sales)}
                        />
                        <TooltipRow
                          color={colors.profit}
                          label="Profit"
                          value={formatCurrency(point.profit)}
                        />
                        <TooltipRow
                          color={colors.inkSecondary}
                          label="Orders"
                          value={formatInt(point.orders)}
                        />
                      </TooltipShell>
                    );
                  }}
                />
                <Line
                  name="Sales"
                  dataKey="sales"
                  stroke={colors.sales}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, stroke: "#fcfcfb", strokeWidth: 2 }}
                />
                <Line
                  name="Profit"
                  dataKey="profit"
                  stroke={colors.profit}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, stroke: "#fcfcfb", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Frame>
        </>
      )}
    </Card>
  );
}

interface BreakdownProps {
  title: string;
  subtitle: string;
  by: "category" | "region" | "segment" | "sub_category";
  measure: "sales" | "profit";
  filters: Filters;
  selected?: string;
  onSelect?: (label: string) => void;
  showLabels?: boolean;
  labelWidth?: number;
}

export function BreakdownChart({
  title,
  subtitle,
  by,
  measure,
  filters,
  selected,
  onSelect,
  showLabels = true,
  labelWidth = 110,
}: BreakdownProps) {
  const { data = [], isPlaceholderData, isError } = useBreakdown(by, filters);
  const sorted = [...data].sort((a, b) => b[measure] - a[measure]);

  const fillFor = (item: BreakdownItem) => {
    if (item[measure] < 0) return colors.negative;
    return colors.sales;
  };
  const dim = (item: BreakdownItem) =>
    selected && selected !== item.label ? 0.35 : 1;

  return (
    <Card title={title} subtitle={subtitle}>
      {isError ? (
        <p className="text-sm">Failed to load chart.</p>
      ) : (
        <Frame stale={isPlaceholderData} tall={sorted.length > 6}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sorted}
              layout="vertical"
              margin={{
                top: 4,
                right: showLabels ? 56 : 16,
                bottom: 0,
                left: 0,
              }}
              barCategoryGap={sorted.length > 6 ? 4 : 10}
            >
              <CartesianGrid
                horizontal={false}
                vertical={!showLabels}
                stroke={colors.grid}
              />
              <XAxis
                type="number"
                hide={showLabels}
                tickFormatter={formatCompact}
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                tickCount={4}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={axisTick}
                tickLine={false}
                axisLine={{ stroke: colors.grid }}
                width={labelWidth}
                interval={0}
              />
              <Tooltip
                cursor={{ fill: colors.grid, opacity: 0.4 }}
                content={({ active, payload }) => {
                  const item = payload?.[0]?.payload as
                    BreakdownItem | undefined;
                  if (!active || !item) return null;
                  return (
                    <TooltipShell title={item.label}>
                      <TooltipRow
                        color={colors.sales}
                        label="Sales"
                        value={formatCurrency(item.sales)}
                      />
                      <TooltipRow
                        color={colors.profit}
                        label="Profit"
                        value={formatCurrency(item.profit)}
                      />
                      <TooltipRow
                        color={colors.inkSecondary}
                        label="Orders"
                        value={formatInt(item.orders)}
                      />
                    </TooltipShell>
                  );
                }}
              />
              <ReferenceLine x={0} stroke={colors.inkSecondary} />
              <Bar
                dataKey={measure}
                maxBarSize={26}
                radius={[0, 4, 4, 0]}
                cursor={onSelect ? "pointer" : undefined}
                onClick={(bar) =>
                  onSelect?.((bar.payload as BreakdownItem).label)
                }
              >
                {sorted.map((item) => (
                  <Cell
                    key={item.label}
                    fill={fillFor(item)}
                    fillOpacity={dim(item)}
                  />
                ))}
                {showLabels && (
                  <LabelList
                    dataKey={measure}
                    position="right"
                    formatter={(v) => formatCompact(Number(v))}
                    style={{ fontSize: 12, fill: colors.ink }}
                  />
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Frame>
      )}
    </Card>
  );
}
