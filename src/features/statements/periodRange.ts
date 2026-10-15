export type Period = "this_month" | "last_month" | "last_3_months" | "last_6_months";

export const PERIODS: { value: Period; label: string }[] = [
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "last_3_months", label: "Last 3 Months" },
  { value: "last_6_months", label: "Last 6 Months" },
];

function ymd(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Calendar range for a period, ending today (or at the end of last month). */
export function periodRange(period: Period, today: Date = new Date()): { dateFrom: string; dateTo: string } {
  const year = today.getFullYear();
  const month = today.getMonth();
  switch (period) {
    case "this_month":
      return { dateFrom: ymd(new Date(year, month, 1)), dateTo: ymd(today) };
    case "last_month":
      return { dateFrom: ymd(new Date(year, month - 1, 1)), dateTo: ymd(new Date(year, month, 0)) };
    case "last_3_months":
      return { dateFrom: ymd(new Date(year, month - 2, 1)), dateTo: ymd(today) };
    case "last_6_months":
      return { dateFrom: ymd(new Date(year, month - 5, 1)), dateTo: ymd(today) };
  }
}
