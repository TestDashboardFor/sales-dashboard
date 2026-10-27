"use client";

import { useEffect, useId, useRef, useState } from "react";
import { inputClass } from "./ui";

export interface Option {
  value: string;
  label: string;
}

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: (string | Option)[];
  placeholder?: string;
  triggerClassName?: string;
}

const toOption = (o: string | Option): Option =>
  typeof o === "string" ? { value: o, label: o } : o;

function Chevron() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0 text-stone-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 8 4 4 4-4" />
    </svg>
  );
}

function Check() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0 text-blue-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4.5 10.5 3.5 3.5 7.5-8" />
    </svg>
  );
}

export default function Select({
  label,
  value,
  onChange,
  options: rawOptions,
  placeholder = "Select…",
  triggerClassName = `${inputClass} flex items-center justify-between gap-2 text-left`,
}: Props) {
  const options = rawOptions.map(toOption);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
    }
  }, [open, active]);

  function openList() {
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function choose(index: number) {
    onChange(options[index].value);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp": {
        e.preventDefault();
        if (!open) return openList();
        const step = e.key === "ArrowDown" ? 1 : -1;
        setActive(Math.min(Math.max(active + step, 0), options.length - 1));
        return;
      }
      case "Home":
      case "End":
        if (open) {
          e.preventDefault();
          setActive(e.key === "Home" ? 0 : options.length - 1);
        }
        return;
      case "Enter":
      case " ":
        if (open) {
          e.preventDefault();
          choose(active);
        }
        return;
      case "Escape":
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
        }
        return;
      case "Tab":
        setOpen(false);
        return;
      default: {
        if (e.key.length !== 1 || e.ctrlKey || e.metaKey) return;
        const index = options.findIndex((o) =>
          o.label.toLowerCase().startsWith(e.key.toLowerCase()),
        );
        if (index >= 0) {
          if (!open) setOpen(true);
          setActive(index);
        }
      }
    }
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        className={triggerClassName}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-label={`${label}: ${selected?.label ?? "not selected"}`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span className={`truncate ${selected ? "" : "text-stone-400"}`}>
          {selected?.label ?? placeholder}
        </span>
        <Chevron />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute top-full left-0 z-40 mt-1 max-h-60 w-max min-w-full max-w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-stone-200 bg-white py-1 shadow-xl"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => e.preventDefault()}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={o.value === value}
              onClick={() => choose(i)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-base whitespace-nowrap sm:text-sm ${
                i === active ? "bg-blue-50" : ""
              } ${o.value === value ? "font-medium text-stone-900" : "text-stone-700"}`}
            >
              {o.label}
              {o.value === value && <Check />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
