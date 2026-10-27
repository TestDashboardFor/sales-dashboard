"use client";

import { useEffect } from "react";

export const inputClass =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base outline-none sm:text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";

const buttonVariants = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary:
    "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
}) {
  return (
    <button
      {...props}
      className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariants[variant]} ${className}`}
    />
  );
}

export function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex flex-col gap-1 text-xs font-medium text-stone-600 ${className}`}
    >
      {label}
      {children}
    </label>
  );
}

export function Card({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-stone-200 bg-[#fcfcfb] p-4 ${className}`}
    >
      {title && (
        <header className="mb-3">
          <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
          {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="my-8 w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}
