"use client";

import type { FilterOptions, Filters } from "@/lib/types";
import DatePicker from "../DatePicker";
import Select from "../Select";
import { Button, Field } from "../ui";

interface Props {
  filters: Filters;
  options: FilterOptions | undefined;
  onChange: (next: Filters) => void;
}

function yearsBetween(min: string | null, max: string | null): number[] {
  if (!min || !max) return [];
  const from = Number(min.slice(0, 4));
  const to = Number(max.slice(0, 4));
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

export default function FilterBar({ filters, options, onChange }: Props) {
  const set = (patch: Filters) => onChange({ ...filters, ...patch });
  const years = yearsBetween(
    options?.date_min ?? null,
    options?.date_max ?? null,
  );
  const activeYear = years.find(
    (y) =>
      filters.date_from === `${y}-01-01` && filters.date_to === `${y}-12-31`,
  );
  const hasFilters = Object.values(filters).some(Boolean);

  const select = (
    label: string,
    key: "region" | "category" | "segment",
    values: string[] = [],
    width: string,
  ) => (
    <Field label={label} className={width}>
      <Select
        label={label}
        value={filters[key] ?? ""}
        options={[{ value: "", label: "All" }, ...values]}
        onChange={(v) => set({ [key]: v || undefined })}
      />
    </Field>
  );

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-[#fcfcfb] p-4">
      <div className="grid w-full grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:contents">
        <Field label="From" className="sm:w-40">
          <DatePicker
            label="From"
            placeholder="Any date"
            clearable
            value={filters.date_from ?? ""}
            min={options?.date_min ?? undefined}
            max={filters.date_to ?? options?.date_max ?? undefined}
            onChange={(v) => set({ date_from: v || undefined })}
          />
        </Field>
        <Field label="To" className="sm:w-40">
          <DatePicker
            label="To"
            placeholder="Any date"
            clearable
            align="right"
            value={filters.date_to ?? ""}
            min={filters.date_from ?? options?.date_min ?? undefined}
            max={options?.date_max ?? undefined}
            onChange={(v) => set({ date_to: v || undefined })}
          />
        </Field>
      </div>

      <div className="flex gap-1" role="group" aria-label="Year presets">
        {years.map((y) => (
          <Button
            key={y}
            variant={activeYear === y ? "primary" : "secondary"}
            onClick={() =>
              activeYear === y
                ? set({ date_from: undefined, date_to: undefined })
                : set({ date_from: `${y}-01-01`, date_to: `${y}-12-31` })
            }
          >
            {y}
          </Button>
        ))}
      </div>

      <div className="grid w-full grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:contents">
        {select("Region", "region", options?.regions, "sm:w-32")}
        {select("Category", "category", options?.categories, "sm:w-44")}
        {select("Segment", "segment", options?.segments, "sm:w-36")}

        {hasFilters && (
          <Button
            variant="secondary"
            className="self-end"
            onClick={() => onChange({})}
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
