const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const currencyExact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const compact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
const integer = new Intl.NumberFormat("en-US");

export const formatCurrency = (n: number) => currency.format(n);
export const formatCurrencyExact = (n: number) => currencyExact.format(n);
export const formatCompact = (n: number) => compact.format(n);
export const formatInt = (n: number) => integer.format(n);
export const formatPercent = (n: number) => `${(n * 100).toFixed(1)}%`;

export const profitColor = (n: number) =>
  n < 0 ? "text-red-700" : n > 0 ? "text-emerald-700" : "";
