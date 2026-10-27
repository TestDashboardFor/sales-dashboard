"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { FilterOptions, Order, OrderInput } from "@/lib/types";
import DatePicker from "../DatePicker";
import Select from "../Select";
import { Button, Field, inputClass, Modal } from "../ui";

interface Props {
  order: Order | null;
  options: FilterOptions | undefined;
  onClose: () => void;
}

type FormState = Record<keyof OrderInput, string>;

const REQUIRED_CHOICES = ["segment", "region", "category"] as const;
const SHIP_MODES = [
  "Standard Class",
  "Second Class",
  "First Class",
  "Same Day",
];

function toForm(order: Order | null): FormState {
  const today = new Date().toISOString().slice(0, 10);
  return {
    order_id: order?.order_id ?? "",
    order_date: order?.order_date ?? today,
    ship_date: order?.ship_date ?? today,
    ship_mode: order?.ship_mode ?? SHIP_MODES[0],
    customer_name: order?.customer_name ?? "",
    segment: order?.segment ?? "",
    city: order?.city ?? "",
    state: order?.state ?? "",
    region: order?.region ?? "",
    category: order?.category ?? "",
    sub_category: order?.sub_category ?? "",
    product_name: order?.product_name ?? "",
    sales: String(order?.sales ?? ""),
    quantity: String(order?.quantity ?? 1),
    discount: String(order?.discount ?? 0),
    profit: String(order?.profit ?? ""),
  };
}

function toPayload(f: FormState): OrderInput {
  return {
    ...f,
    sales: Number(f.sales),
    quantity: Number(f.quantity),
    discount: Number(f.discount),
    profit: Number(f.profit),
  };
}

export default function OrderFormModal({ order, options, onClose }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => toForm(order));
  const [formError, setFormError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (data: OrderInput) =>
      order ? api.updateOrder(order.id, data) : api.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries();
      onClose();
    },
  });

  const bind = (key: keyof FormState) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [key]: e.target.value }),
  });

  const text = (
    key: keyof FormState,
    label: string,
    type = "text",
    extra = {},
  ) => (
    <Field label={label}>
      <input
        className={inputClass}
        type={type}
        required
        {...extra}
        {...bind(key)}
      />
    </Field>
  );

  const select = (
    key: keyof FormState,
    label: string,
    values: string[] = [],
  ) => (
    <Field label={label}>
      <Select
        label={label}
        value={form[key]}
        options={values}
        onChange={(v) => setForm({ ...form, [key]: v })}
      />
    </Field>
  );

  return (
    <Modal
      title={order ? `Edit order ${order.order_id}` : "Add order"}
      onClose={onClose}
    >
      <form
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const missing = REQUIRED_CHOICES.filter((k) => !form[k]);
          if (missing.length) {
            setFormError(`Please choose: ${missing.join(", ")}.`);
            return;
          }
          setFormError(null);
          save.mutate(toPayload(form));
        }}
      >
        {text("order_id", "Order ID", "text", { maxLength: 20 })}
        {text("customer_name", "Customer", "text", { maxLength: 100 })}
        <Field label="Order date">
          <DatePicker
            label="Order date"
            value={form.order_date}
            onChange={(v) =>
              setForm({
                ...form,
                order_date: v,
                ship_date: form.ship_date < v ? v : form.ship_date,
              })
            }
          />
        </Field>
        <Field label="Ship date">
          <DatePicker
            label="Ship date"
            align="right"
            value={form.ship_date}
            min={form.order_date}
            onChange={(v) => setForm({ ...form, ship_date: v })}
          />
        </Field>
        {select("ship_mode", "Ship mode", SHIP_MODES)}
        {select("segment", "Segment", options?.segments)}
        {text("city", "City")}
        {text("state", "State")}
        {select("region", "Region", options?.regions)}
        {select("category", "Category", options?.categories)}
        {text("sub_category", "Sub-category", "text", { maxLength: 50 })}
        {text("product_name", "Product", "text", { maxLength: 255 })}
        {text("sales", "Sales (USD)", "number", { min: 0, step: "0.01" })}
        {text("quantity", "Quantity", "number", { min: 1, step: 1 })}
        {text("discount", "Discount (0–1)", "number", {
          min: 0,
          max: 1,
          step: "0.01",
        })}
        {text("profit", "Profit (USD)", "number", { step: "0.01" })}

        {(formError || save.isError) && (
          <p role="alert" className="text-sm text-red-700 sm:col-span-2">
            {formError ?? save.error?.message}
          </p>
        )}

        <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
