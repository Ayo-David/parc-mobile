/** Display-only tenure label: Figma shows "30 days" and "12 months" (236:11557, 236:11572). */
export function formatTenureDays(days: number): string {
  if (days >= 60) {
    const months = Math.round(days / 30.4);
    return `${months} month${months === 1 ? "" : "s"}`;
  }
  return `${days} day${days === 1 ? "" : "s"}`;
}
