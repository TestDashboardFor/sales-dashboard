import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { Filters, OrderQuery } from "./types";

const keep = { placeholderData: keepPreviousData };

export const useMe = () => useQuery({ queryKey: ["me"], queryFn: api.me });

export const useOptions = () =>
  useQuery({ queryKey: ["options"], queryFn: api.options });

export const useSummary = (f: Filters) =>
  useQuery({
    queryKey: ["summary", f],
    queryFn: () => api.summary(f),
    ...keep,
  });

export const useTimeseries = (f: Filters) =>
  useQuery({
    queryKey: ["timeseries", f],
    queryFn: () => api.timeseries(f),
    ...keep,
  });

export const useBreakdown = (
  by: "category" | "region" | "segment" | "sub_category",
  f: Filters,
) =>
  useQuery({
    queryKey: ["breakdown", by, f],
    queryFn: () => api.breakdown(by, f),
    ...keep,
  });

export const useOrders = (q: OrderQuery) =>
  useQuery({ queryKey: ["orders", q], queryFn: () => api.orders(q), ...keep });
