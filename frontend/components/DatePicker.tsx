"use client";

import { useEffect, useRef, useState } from "react";
import Select from "./Select";
import { inputClass } from "./ui";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  clearable?: boolean;
  align?: "left" | "right";
}

interface View {
  y: number;
  m: number;
}

const MONTHS = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleDateString("en-US", { month: "long" }),
);
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (y: number, m: number, d: number) =>
  `${y}-${pad(m + 1)}-${pad(d)}`;
const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m: m - 1, d };
};
const monthIndex = ({ y, m }: View) => y * 12 + m;
const fromIndex = (i: number): View => ({ y: Math.floor(i / 12), m: i % 12 });

function formatDate(iso: string) {
  const { y, m, d } = parse(iso);
  return new Date(y, m, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function todayISO() {
  const t = new Date();
  return toISO(t.getFullYear(), t.getMonth(), t.getDate());
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0 text-stone-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4.5" width="14" height="12.5" rx="2" />
      <path d="M3 8.5h14M7 3v3M13 3v3" />
    </svg>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={dir === "left" ? "m12 5-5 5 5 5" : "m8 5 5 5-5 5"} />
    </svg>
  );
}

export default function DatePicker({
  label,
  value,
  onChange,
  min,
  max,
  placeholder = "Select date",
  clearable = false,
  align = "left",
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>({ y: 2000, m: 0 });

  const today = todayISO();
  const minIdx = min ? monthIndex(parse(min)) : -Infinity;
  const maxIdx = max ? monthIndex(parse(max)) : Infinity;
  const clampView = (v: View): View =>
    fromIndex(Math.min(Math.max(monthIndex(v), minIdx), maxIdx));

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (rootRef.current?.querySelector('[role="listbox"]')) return;
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  function toggle() {
    if (!open) {
      const base = value ? parse(value) : parse(today);
      setView(clampView({ y: base.y, m: base.m }));
    }
    setOpen(!open);
  }

  function pick(iso: string) {
    onChange(iso);
    setOpen(false);
    triggerRef.current?.focus();
  }

  const yearFrom = Math.min(min ? parse(min).y : parse(today).y - 10, view.y);
  const yearTo = Math.max(max ? parse(max).y : parse(today).y + 10, view.y);
  const years = Array.from(
    { length: yearTo - yearFrom + 1 },
    (_, i) => yearFrom + i,
  );

  const firstWeekday = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const outOfRange = (iso: string) =>
    (!!min && iso < min) || (!!max && iso > max);
  const navButton =
    "flex h-8 w-8 items-center justify-center rounded-md text-stone-600 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent";
  const compactTrigger =
    "flex items-center justify-between gap-1 rounded-md px-2 py-1 text-sm font-semibold text-stone-900 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        className={`${inputClass} flex items-center justify-between gap-2 text-left`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}: ${value ? formatDate(value) : "not set"}`}
        onClick={toggle}
      >
        <span className={`truncate ${value ? "" : "text-stone-400"}`}>
          {value ? formatDate(value) : placeholder}
        </span>
        <CalendarIcon />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`Choose ${label.toLowerCase()}`}
          className={`absolute z-40 mt-2 w-[17.5rem] rounded-xl border border-stone-200 bg-white p-3 shadow-xl ${align === "right" ? "right-0" : "left-0"}`}
          onClick={(e) => e.preventDefault()}
        >
          <div className="mb-2 flex items-center justify-between gap-1">
            <button
              type="button"
              className={navButton}
              aria-label="Previous month"
              disabled={monthIndex(view) <= minIdx}
              onClick={() => setView(fromIndex(monthIndex(view) - 1))}
            >
              <Chevron dir="left" />
            </button>
            <div className="flex items-center">
              <Select
                label="Month"
                triggerClassName={`${compactTrigger} w-[6.75rem]`}
                value={String(view.m)}
                options={MONTHS.map((name, i) => ({
                  value: String(i),
                  label: name,
                }))}
                onChange={(v) =>
                  setView(clampView({ y: view.y, m: Number(v) }))
                }
              />
              <Select
                label="Year"
                triggerClassName={`${compactTrigger} w-[4.75rem]`}
                value={String(view.y)}
                options={years.map(String)}
                onChange={(v) =>
                  setView(clampView({ y: Number(v), m: view.m }))
                }
              />
            </div>
            <button
              type="button"
              className={navButton}
              aria-label="Next month"
              disabled={monthIndex(view) >= maxIdx}
              onClick={() => setView(fromIndex(monthIndex(view) + 1))}
            >
              <Chevron dir="right" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs text-stone-400">
            {WEEKDAYS.map((d) => (
              <span key={d} className="py-1">
                {d}
              </span>
            ))}
          </div>

          <div
            className="grid grid-cols-7 gap-y-0.5 text-center text-sm"
            role="grid"
          >
            {cells.map((day, i) => {
              if (day === null) return <span key={`blank-${i}`} />;
              const iso = toISO(view.y, view.m, day);
              const selected = iso === value;
              const disabled = outOfRange(iso);
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  aria-label={formatDate(iso)}
                  aria-pressed={selected}
                  onClick={() => pick(iso)}
                  className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full tabular-nums transition-colors ${
                    selected
                      ? "bg-blue-600 font-semibold text-white"
                      : disabled
                        ? "cursor-not-allowed text-stone-300"
                        : `hover:bg-blue-50 ${iso === today ? "font-semibold text-blue-700 ring-1 ring-blue-200" : "text-stone-800"}`
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-stone-100 pt-2 text-sm">
            <button
              type="button"
              className="rounded-md px-2 py-1 font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:bg-transparent"
              disabled={outOfRange(today)}
              onClick={() => pick(today)}
            >
              Today
            </button>
            {clearable && value && (
              <button
                type="button"
                className="rounded-md px-2 py-1 font-medium text-stone-600 hover:bg-stone-100"
                onClick={() => pick("")}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
