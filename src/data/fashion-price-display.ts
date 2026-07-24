export const FASHION_FX_SNAPSHOT = {
  jpyPerUsd: 163.315,
  capturedAt: "2026-07-23T17:00:00+09:00",
  sourceUrl: "https://www.boj.or.jp/en/statistics/market/forex/fxdaily/fxlist/fx260723.pdf",
  supports: "Approximate USD display using the midpoint of the Bank of Japan 17:00 JST USD/JPY spot quote (163.31–163.32).",
  doesNotSupport: "A checkout total, card-network rate, fees, taxes, refunds, or a future exchange rate.",
  refreshRule: "Refresh before a public demo recorded on a later date.",
} as const;

export function formatJpy(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatApproxUsd(value: number) {
  return `≈${new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value / FASHION_FX_SNAPSHOT.jpyPerUsd)}`;
}

export function formatMediaPrice(value?: number) {
  if (value === undefined) {
    return {
      jpy: "Price not listed",
      usd: "Editorial reference",
      status: "unlisted" as const,
    };
  }
  return {
    jpy: formatJpy(value),
    usd: formatApproxUsd(value),
    status: "listed" as const,
  };
}
